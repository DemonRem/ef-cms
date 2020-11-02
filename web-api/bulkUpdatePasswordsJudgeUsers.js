const AWS = require('aws-sdk');
const parse = require('csv-parse');
const { gatherRecords, getCsvOptions } = require('../shared/src/tools/helpers');
const { getUserPoolId } = require('./storage/scripts/loadTest/loadTestHelpers');
const { readCsvFile } = require('./importHelpers');
const cognito = new AWS.CognitoIdentityServiceProvider({
  region: process.env.REGION,
});

const CSV_HEADERS = [
  'name',
  'judgeTitle',
  'judgeFullName',
  'email',
  'role',
  'section',
];

if (!process.env.ENV) {
  process.env.ENV = process.argv[1];
}

const init = async csvFile => {
  const csvOptions = getCsvOptions(CSV_HEADERS);
  let output = [];

  const data = readCsvFile(csvFile);
  const stream = parse(data, csvOptions);

  const processCsv = new Promise(resolve => {
    stream.on('readable', gatherRecords(CSV_HEADERS, output));
    stream.on('end', async () => {
      const UserPoolId = await getUserPoolId({ cognito, env: process.env.ENV });
      console.log({ UserPoolId });

      for (let row of output) {
        try {
          const params = {
            Password: 'Testing1234$',
            Permanent: true,
            UserPoolId,
            Username: row.email,
          };
          const response = await cognito.adminSetUserPassword(params).promise();
          console.log(response);
        } catch (err) {
          console.log(err);
        }
      }
      resolve();
    });
  });
  await processCsv;
};

(async () => {
  const file = process.argv[2];
  if (file && !process.env.test) {
    await init(file);
    // console.log('Judges Map: ', outputMap);
    console.log('done');
  }
})();

module.exports = {
  CSV_HEADERS,
  init,
};
