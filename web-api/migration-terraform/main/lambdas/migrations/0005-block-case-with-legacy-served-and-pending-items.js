const createApplicationContext = require('../../../../src/applicationContext');
const {
  aggregateCaseItems,
} = require('../../../../../shared/src/persistence/dynamo/helpers/aggregateCaseItems');
const {
  AUTOMATIC_BLOCKED_REASONS,
} = require('../../../../../shared/src/business/entities/EntityConstants');
const {
  Case,
} = require('../../../../../shared/src/business/entities/cases/Case');
const {
  createISODateString,
} = require('../../../../../shared/src/business/utilities/DateHandler');
const { cloneDeep } = require('lodash');

const applicationContext = createApplicationContext({});

const getFullCaseRecord = async ({ docketNumber, documentClient }) => {
  const fullCase = await documentClient
    .query({
      ExpressionAttributeNames: {
        '#pk': 'pk',
      },
      ExpressionAttributeValues: {
        ':pk': `case|${docketNumber}`,
      },
      KeyConditionExpression: '#pk = :pk',
      TableName: process.env.SOURCE_TABLE,
    })
    .promise()
    .then(res => {
      return res.Items;
    });

  return aggregateCaseItems(fullCase);
};

const getBlockedCaseFromItem = ({ caseRecord, item }) => {
  let itemToModify = cloneDeep(item);
  itemToModify.automaticBlocked = true;
  itemToModify.automaticBlockedDate = createISODateString();

  if (
    itemToModify.automaticBlockedReason === AUTOMATIC_BLOCKED_REASONS.dueDate
  ) {
    itemToModify.automaticBlockedReason =
      AUTOMATIC_BLOCKED_REASONS.pendingAndDueDate;
  } else {
    itemToModify.automaticBlockedReason = AUTOMATIC_BLOCKED_REASONS.pending;
  }

  new Case(
    { ...caseRecord, ...itemToModify },
    {
      applicationContext,
    },
  ).validate();
  return itemToModify;
};

const migrateItems = async (items, documentClient) => {
  const itemsAfter = [];
  for (const item of items) {
    if (
      item.pk.includes('case|') &&
      item.sk.includes('case|') &&
      !item.trialDate
    ) {
      const caseRecord = await getFullCaseRecord({
        docketNumber: item.docketNumber,
        documentClient,
      });

      const shouldBlockCase = caseRecord.docketEntries.some(
        entry => entry.pending && entry.isLegacyServed,
      );

      if (shouldBlockCase) {
        const itemToModify = getBlockedCaseFromItem({ caseRecord, item });
        itemsAfter.push(itemToModify);
      } else {
        itemsAfter.push(item);
      }
    } else if (
      item.gsi1pk &&
      item.gsi1pk.startsWith('eligible-for-trial-case-catalog')
    ) {
      const docketNumber = item.gsi1pk.split('|')[1];

      const caseRecord = await getFullCaseRecord({
        docketNumber,
        documentClient,
      });

      const shouldBlockCase = caseRecord.docketEntries.some(
        entry => entry.pending && entry.isLegacyServed,
      );

      if (!shouldBlockCase) {
        itemsAfter.push(item);
      }
    } else {
      itemsAfter.push(item);
    }
  }
  return itemsAfter;
};

exports.migrateItems = migrateItems;
