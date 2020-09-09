const AWS = require('aws-sdk');

// Seth said 200 for segment constant?
const [ENV, SEGMENT_SIZE] = process.argv.slice(2);

if (!ENV) {
  throw new Error('Please provide an environment.');
}

if (!SEGMENT_SIZE) {
  throw new Error('Please provide a segment size.');
}

const sqs = new AWS.SQS({ apiVersion: '2012-11-05', region: 'us-east-1' });

const getItemCount = async () => {
  const dynamo = new AWS.DynamoDB({
    credentials: {
      accessKeyId: 'noop',
      secretAccessKey: 'noop',
    },
    endpoint: 'http://localhost:8000',
    region: 'us-east-1',
  });

  try {
    const { Table } = await dynamo
      .describeTable({ TableName: `efcms-${ENV}` })
      .promise();
    return Table.ItemCount;
  } catch (e) {
    console.error('Error retrieving dynamo item count.', e);
  }
};

const sendSegmentMessage = async ({ numSegments, segment }) => {
  const messageBody = { segment, totalSegments: numSegments };
  const params = {
    MessageBody: JSON.stringify(messageBody),
    MessageDeduplicationId: JSON.stringify(segment),
    MessageGroupId: 'MigrationSegments',
    QueueUrl:
      'https://sqs.us-east-1.amazonaws.com/515554424717/migration_segments_ueue_exp1.fifo',
  };

  try {
    await sqs.sendMessage(params).promise();
  } catch (e) {
    console.error(`Error sending message ${segment}/${numSegments}.`, e);
  }
};

(async () => {
  const itemCount = await getItemCount();

  const numSegments = Math.ceil(itemCount / SEGMENT_SIZE);

  for (let segment = 0; segment < numSegments; segment++) {
    await sendSegmentMessage({ numSegments, segment });
  }
})();
