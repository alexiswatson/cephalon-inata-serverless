import AWS from 'aws-sdk';
import WarframeMarketAPI from './lib/WarframeMarketAPI';
AWS.config.apiVersions = {
  sqs: '2012-11-05',
  ssm: '2014-11-06'
};

const market = WarframeMarketAPI.getInstance();
const sqs = new AWS.SQS();

// Fetch items currently available for trade from Warframe Market, and add them
// to the ItemStatsQueue to fetch their statistics.
//
// Polling more frequently than hourly isn't going to produce meaningful results,
// as they aggregate closed trades on the hour.
export const lambda = ({ market, sqs }) => async function enqueueItems(event) {
	const itemCatalog = await market.get.items();
	const allEntries = itemCatalog.data.payload.items.map((item, idx) => ({
		Id: `${idx}`,
		MessageBody: JSON.stringify({item_name: item.item_name, url_name: item.url_name})
	}));

	// sendMessageBatch will only accept ten messages at a time.
	const batchEntries = (entries) => {
		const batch = entries.slice(0, 10);
		return (!batch.length) ? entries : [batch].concat(batchEntries(entries.slice(10, entries.length)));
	}

	const batchedEntries = batchEntries(allEntries);
	const QueueUrl = process.env.AWS_ITEMSTATSQUEUE_URL;

	const batchedResponses = await Promise.all(batchedEntries.map((Entries) => {
		return sqs.sendMessageBatch({Entries, QueueUrl}).promise();
	}));

	const failedResponses = batchedResponses.reduce((failedSoFar, { Failed }) => {
		return (Failed) ? [ ...failedSoFar,  ...Failed ] : failedSoFar;
	}, []);
	const failedMessages = failedResponses && failedResponses.map(response => `${response.Id}: ${response.Code}`);
	if (failedMessages && failedMessages.length) throw new Error(`Failed responses received from AWS SQS: ${failedMessages.join(', ')}`);

  return Promise.resolve({ message: 'Item catalog successfully enqueued for sampling.', event });
};

// Export the handler with production dependencies injected.
export const handler = lambda({market, sqs});