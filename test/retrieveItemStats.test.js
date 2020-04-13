import { lambda } from '../src/retrieveItemStats';
import { MARKET_ENDPOINT } from '../src/lib/WarframeMarketAPI';
import payloads, { warframes } from './helpers/payloads';
import chai, { expect } from 'chai';
import sinon from 'sinon';
import sinonChai from 'sinon-chai';
import chaiAsPromised from 'chai-as-promised';

chai.use(sinonChai);
chai.use(chaiAsPromised);

describe('retrieveItemStats Lambda Function', () => {
	const batch = {
		Records: warframes.map((frame) => ({
			body: JSON.stringify({
				item_name: `${frame} Prime Set`,
				url_name: `${frame.toLowerCase()}_prime_set`
			})
		}))
	}
	let itemStatisticsStub;
	let getParamStub;
	let closeStub;
	let writePointsStub;
	let deps;

	beforeEach(() => {
		writePointsStub = sinon.stub();
		getParamStub = sinon.stub();
		closeStub = sinon.stub().resolves();
		itemStatisticsStub = sinon.stub();

		deps = {
			market: {
				get: {
					itemStatistics: itemStatisticsStub
				}
			},
			paramStore: {
				getParam: getParamStub
			},
			InfluxDBAPI: {
				create() {
					return {
						getWriteApi() {
							return {
								writePoints: writePointsStub,
								close: closeStub
							};
						}
					}
				}
			},
		};

		process.env.INFLUXDB_API_KEY_PATH = 'path/to/api/key';
		process.env.INFLUXDB_API_ORG_PATH = 'path/to/api/org';
		process.env.INFLUXDB_API_URL = 'https://www.example.com/path/to/influxdb';
		process.env.INFLUXDB_API_BUCKET = '1234567890';
	});

	afterEach(() => {
		sinon.restore();
		delete process.env.INFLUXDB_API_KEY_PATH;
		delete process.env.INFLUXDB_API_ORG_PATH;
		delete process.env.INFLUXDB_API_URL;
		delete process.env.INFLUXDB_API_BUCKET;
	});

	it('samples item statistics from a batch of item records', async () => {
		warframes.forEach((frame, idx) => {
			itemStatisticsStub.onCall(idx).resolves({
				status: 200,
				statusText: 'OK',
				data: {
					payload: payloads[`${MARKET_ENDPOINT}/items/${frame.toLowerCase()}_prime_set/statistics`]
				}
			});
		})

		const handler = lambda(deps);
		const response = await handler(batch);

		expect(deps.market.get.itemStatistics).to.have.callCount(warframes.length);
		expect(writePointsStub).to.have.been.calledOnce;
		expect(closeStub).to.have.been.calledOnce;
		expect(response).to.deep.equal({ 
			message: 'Item batch sampled successfully.', 
			event: batch
		});
	});
});