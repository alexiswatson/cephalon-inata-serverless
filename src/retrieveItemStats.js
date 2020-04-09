import WarframeMarketAPI from './lib/WarframeMarketAPI';
import SecureParameterStore from './lib/SecureParameterStore';
import { Point } from '@influxdata/influxdb-client';
import InfluxDBAPI from './lib/InfluxDBAPI';
import AWS from 'aws-sdk';

const market = WarframeMarketAPI.getInstance();

// Record item stats based on unprocessed items in the ItemStatsQueue.
// Note that reservedConcurrency *must* be set to 1, otherwise concurrent Lambdas
// will not respect the rate limit.
export const handler = async function retrieveItemStats(event) {
	const { Records } = event;
	const items = Records && Records.map(record => JSON.parse(record.body));

	const getItemStats = async (item) => {
		const stats = await market.get.itemStatistics(item.url_name);
		return {
			...item,
			stats: stats.data.payload
		};
	}
	const itemStats = items && await Promise.all(
		items.map(item => getItemStats(item))
	);

	const ssm = new AWS.SSM();
	const paramStore = SecureParameterStore.create(ssm);
	const INFLUXDB_API_KEY = await paramStore.getParam(process.env.INFLUXDB_API_KEY_PATH);
	const INFLUXDB_API_ORG = await paramStore.getParam(process.env.INFLUXDB_API_ORG_PATH);

	const idb = InfluxDBAPI.create({url: process.env.INFLUXDB_API_URL, token: INFLUXDB_API_KEY});
	const writeApi = idb.getWriteApi(INFLUXDB_API_ORG, process.env.INFLUXDB_API_BUCKET, 's');

	// Closed trade aggregates are taken hourly. Lower timestamp resolution is used on write
	// to facilitate improvements in InfluxDB's compression.
	//
	// Also note that the API requires a string timestamp, or it will ignore and use now().
	// Presumably this is to support nanosecond timestamps beyond MAX_SAFE_INTEGER, though
	// our use case doesn't call for anything that precise.
	const parseEpochSeconds = (dateString) => {
		const msTimestamp = Date.parse(dateString);
		if (Number.isNaN(msTimestamp)) throw new TypeError(`Unable to parse date string: ${dateString}`);
		return (msTimestamp / 1000).toString();
	};

	const itemPoints = itemStats.map((item) => {
		return {
			...item, 
			points: item.stats.statistics_closed['48hours'].map((point) => {
				return new Point('closed_trades_hourly')
					.tag('item_name', item.item_name)
					.tag('url_name', item.url_name)
					.intField('volume', point.volume)
					.intField('min_price', point.min_price)
					.intField('max_price', point.max_price)
					.intField('open_price', point.open_price)
					.intField('closed_price', point.closed_price)
					.floatField('avg_price', point.avg_price)
					.floatField('wa_price', point.wa_price)
					.floatField('median', point.median)
					.intField('donch_top', point.donch_top)
					.intField('donch_bot', point.donch_bot)
					.timestamp(parseEpochSeconds(point.datetime));
			}),
		};
	});

	// InfluxDB writes with fixed timestamps are idempotent, so we don't need any
	// additional logic to handle duplicates.
	const dataPoints = itemPoints.reduce((points, item) => [...points, ...item.points], []);
	writeApi.writePoints(dataPoints);

	await writeApi.close();

  return { message: 'Item batch sampled successfully.', event };
};