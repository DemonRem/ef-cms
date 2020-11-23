const AWS = require('aws-sdk');
const axios = require('axios');
const fs = require('fs');
const parse = require('csv-parse');
const {
  COUNTRY_TYPES,
  ROLES,
} = require('../shared/src/business/entities/EntityConstants');
const {
  createISODateString,
} = require('../shared/src/business/utilities/DateHandler');
const {
  getUserPoolId,
  getUserToken,
} = require('./storage/scripts/loadTest/loadTestHelpers');
const { gatherRecords, getCsvOptions } = require('../shared/src/tools/helpers');

const formatRecord = record => {
  const returnData = {};

  Object.keys(record).map(key => {
    if (record[key] === '') {
      delete record[key];
    }
  });

  returnData.firstName = record.firstName;
  returnData.middleName = record.middleName;
  returnData.lastName = record.lastName;
  returnData.suffix = record.suffix;

  returnData.admissionsDate = createISODateString(
    record.admissionsDate,
    'MM-DD-YYYY',
  );

  returnData.birthYear = parseInt(record.birthYear) || 1900;

  if (record.isIrsEmployee === 'Y') {
    returnData.employer = 'IRS';
    returnData.role = ROLES.irsPractitioner;
  } else if (record.isDojEmployee === 'Y') {
    returnData.employer = 'DOJ';
    returnData.role = ROLES.irsPractitioner;
  } else {
    returnData.employer = 'Private';
    returnData.role = ROLES.privatePractitioner;
  }

  returnData.additionalPhone = record.additionalPhone;
  returnData.admissionsStatus = record.admissionsStatus;
  returnData.alternateEmail = record.alternateEmail;
  returnData.barNumber = record.barNumber;
  returnData.email = record.email;
  returnData.firmName = record.firmName;
  returnData.originalBarState = record.originalBarState || 'N/A';
  returnData.practitionerType = record.practitionerType;

  returnData.contact = {
    address1: record['contact/address1'],
    address2: record['contact/address2'],
    city: record['contact/city'],
    countryType: record['contact/countryType'],
    phone: record['contact/phone'],
    state: record['contact/state'],
  };

  if (record['contact/country']) {
    returnData.contact.country = record['contact/country'];
  } else if (record['contact/countryType'] === 'international') {
    returnData.contact.country = 'N/A';
  }

  if (!returnData.contact.address1 && returnData.contact.address2) {
    returnData.contact.address1 = returnData.contact.address2;
    delete returnData.contact.address2;
  }

  if (returnData.contact.countryType === COUNTRY_TYPES.DOMESTIC) {
    returnData.contact.postalCode = record['contact/postalCode'] || '00000';
  } else if (returnData.contact.countryType === COUNTRY_TYPES.INTERNATIONAL) {
    returnData.contact.postalCode = record['contact/postalCode'] || 'N/A';
  }

  return returnData;
};

/* istanbul ignore next */
/* eslint no-console: "off"*/
(async () => {
  const files = [];
  process.argv.forEach((val, index) => {
    if (index > 1) {
      files.push(val);
    }
  });

  const csvColumns = [
    'admissionsDate',
    'admissionsStatus',
    'birthYear',
    'practitionerType',
    'firstName',
    'lastName',
    'middleName',
    'suffix',
    'email',
    'firmName',
    'alternateEmail',
    'additionalPhone',
    'originalBarState',
    'barNumber',
    'contact/address1',
    'contact/address2',
    'contact/city',
    'contact/countryType',
    'contact/country',
    'contact/phone',
    'contact/postalCode',
    'contact/state',
    'isIrsEmployee',
    'isDojEmployee',
  ];

  const csvOptions = getCsvOptions(csvColumns);

  if (files.length < 1) {
    return;
  }

  const cognito = new AWS.CognitoIdentityServiceProvider({
    region: process.env.REGION,
  });
  const apigateway = new AWS.APIGateway({
    region: process.env.REGION,
  });
  const { items: apis } = await apigateway
    .getRestApis({ limit: 200 })
    .promise();

  const services = apis
    .filter(api =>
      api.name.includes(
        `gateway_api_${process.env.ENV}_${process.env.DEPLOYING_COLOR}`,
      ),
    )
    .reduce((obj, api) => {
      obj[
        api.name.replace(`_${process.env.ENV}`, '')
      ] = `https://${api.id}.execute-api.${process.env.REGION}.amazonaws.com/${process.env.ENV}`;
      return obj;
    }, {});

  let token = await getUserToken({
    cognito,
    env: process.env.ENV,
    password: process.env.USTC_ADMIN_PASS,
    username: 'migrator@dawson.ustaxcourt.gov',
  });
  const userPoolId = await getUserPoolId({ cognito, env: process.env.ENV });
  console.log({ userPoolId });

  const data = fs.readFileSync(files[0], 'utf8');

  let output = [];

  const stream = parse(data, csvOptions);

  stream.on('readable', gatherRecords(csvColumns, output));
  stream.on('end', async () => {
    const sleep = time =>
      new Promise(resolve => {
        setTimeout(resolve, time);
      });

    const throttle = batch =>
      new Promise(resolve => {
        console.log(`-- batch ${batch + 1} --`);
        sleep(1000).then(resolve);
      });

    let records = output.map(formatRecord);
    const batchSize = {
      api: 30, // per second
      cognito: 30, // per second
    };
    let batchedRows = [];
    const apiUrl = services[`gateway_api_${process.env.DEPLOYING_COLOR}`];
    const createUserInCognito = async opts => {
      const { barNumber, email, firstName, lastName, retries, role } = opts;
      try {
        await cognito
          .adminCreateUser({
            MessageAction: 'SUPPRESS',
            UserAttributes: [
              {
                Name: 'email_verified',
                Value: 'True',
              },
              {
                Name: 'email',
                Value: email,
              },
              {
                Name: 'custom:role',
                Value: role,
              },
              {
                Name: 'name',
                Value: [firstName, lastName].join(' '),
              },
            ],
            UserPoolId: userPoolId,
            Username: email,
          })
          .promise();

        console.log(`SUCCESS ${barNumber}`);
      } catch (err) {
        const errorText = err.code || err.message || 'Unknown error';
        console.log(`ERROR ${barNumber}: ${errorText}`);
        if (retries && retries > 5) {
          console.log('...giving up');
          return;
        }
        const retry = (retries || 0) + 1;

        // exponential back off
        await sleep(1000 * retry);
        await createUserInCognito({
          ...opts,
          retries: retry,
        });
      }
      return true;
    };

    const createUserInDawson = async (record, retries = 0) => {
      try {
        const result = await axios.post(
          `${apiUrl}/practitioners`,
          { user: record },
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        );
        if (result.status === 200) {
          console.log(`SUCCESS ${record.barNumber}`);
        } else {
          console.log(`ERROR ${record.barNumber}`);
          console.log(result);
          // records.push(record);
        }
      } catch (err) {
        // records.push(record);
        // handle this better
        if (err.response) {
          const isThrottled =
            err.response.data &&
            (err.response.data.message === 'Too many requests' ||
              err.response.data === 'Too many requests');
          const isTimeout =
            err.response.status === 504 &&
            err.response.data &&
            err.response.data.message === 'Endpoint request timed out';

          if (isThrottled || isTimeout) {
            // throttled; exponential back off
            retries++;
            console.log('... throttled');
            await sleep(1000 * retries);
            await createUserInDawson(record, retries);
          } else {
            const errorMessage =
              typeof err.response.data.message === 'string'
                ? err.response.data.message
                : JSON.stringify(err.response.data);

            console.log(
              `ERROR ${record.barNumber}: (${err.response.status}) ${errorMessage}`,
            );
          }
        } else {
          console.log(err);
        }
      }
      return true;
    };

    const startApiLoad = async () => {
      batchedRows = [];

      // Build list for API
      while (records.length) {
        batchedRows.push(records.splice(0, batchSize.api));
      }

      for (let i = 0; i < batchedRows.length; i++) {
        if (tooManyRequests) {
          console.log('... encountered too many requests, waiting 5 minutes');
          await sleep(60 * 1000 * 5);
          tooManyRequests = false;
        }
        const promises = [throttle(i)];
        for (let record of batchedRows[i]) {
          promises.push(createUserInDawson(record));
        }
        await Promise.all(promises);
      }

      if (records.length == 0 || retries > 10) {
        console.log(`finishing with ${records.length} records not yet created`);
        return true;
      } else {
        retries++;
        console.log(
          `retrying startApiLoad retry #${retries} with ${records.length} records to go`,
        );
        await startApiLoad();
        return true;
      }
    };

    let retries = 0;
    let tooManyRequests = false;

    console.log(`we have ${records.length} total records`);

    if (process.env.MODE === 'cognito') {
      // Build list for Cognito
      const hasEmail = records.filter(
        record => record.email && record.admissionsStatus === 'Active',
      );
      console.log('== START COGNITO ' + new Date().toString() + '==');
      console.log(`we have ${hasEmail.length} with email addresses`);

      while (hasEmail.length) {
        batchedRows.push(hasEmail.splice(0, batchSize.cognito));
      }

      for (let i = 0; i < batchedRows.length; i++) {
        const promises = [throttle(i)];
        for (let record of batchedRows[i]) {
          promises.push(createUserInCognito(record));
        }
        await Promise.all(promises);
      }
      console.log('== FINISH COGNITO ' + new Date().toString() + '==');
    } else if (process.env.MODE === 'API') {
      console.log('== START API ' + new Date().toString() + '==');
      console.log(`${records.length} total records!`);
      await startApiLoad();
      console.log('== FINISH API ' + new Date().toString() + '==');
    }
  });
})();

module.exports = {
  formatRecord,
};
