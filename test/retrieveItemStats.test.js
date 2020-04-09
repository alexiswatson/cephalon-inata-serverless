import { handler } from '../src/retrieveItemStats';
import { MARKET_ENDPOINT } from '../src/lib/WarframeMarketAPI';
import WarframeMarketAxios from '../src/lib/WarframeMarketAxios';
import InfluxDBAPI from '../src/lib/InfluxDBAPI';
import SecureParameterStore from '../src/lib/SecureParameterStore';
import payloads, { warframes } from './helpers/payloads';
import AWS from 'aws-sdk';
import mockAWS from 'aws-sdk-mock';
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

	let httpGetStub;
	let influxDBStub;
	let writePointsStub;
	let closeStub;
	let paramStoreStub;

	beforeEach(() => {
		mockAWS.setSDKInstance(AWS);
		writePointsStub = sinon.stub();
		closeStub = sinon.stub().resolves()
		httpGetStub = sinon.stub(WarframeMarketAxios, 'get');
		paramStoreStub = sinon.stub(SecureParameterStore, 'create').returns({
			getParam: sinon.stub().returnsThis()
		})
		influxDBStub = sinon.stub(InfluxDBAPI, 'create').returns({
			getWriteApi() {
				return {
					writePoints: writePointsStub,
					close: closeStub
				};
			}
		})

		process.env.INFLUXDB_API_KEY_PATH = 'path/to/api/key';
		process.env.INFLUXDB_API_ORG_PATH = 'path/to/api/org';
		process.env.INFLUXDB_API_URL = 'https://www.example.com/path/to/influxdb';
		process.env.INFLUXDB_API_BUCKET = '1234567890';
	});

	afterEach(() => {
		sinon.restore();
		mockAWS.restore();
		delete process.env.INFLUXDB_API_KEY_PATH;
		delete process.env.INFLUXDB_API_ORG_PATH;
		delete process.env.INFLUXDB_API_URL;
		delete process.env.INFLUXDB_API_BUCKET;
	});

	it('samples item statistics from a batch of item records', async () => {
		warframes.forEach((frame, idx) => {
			httpGetStub.onCall(idx).resolves({
				status: 200,
				statusText: 'OK',
				data: {
					payload: payloads[`${MARKET_ENDPOINT}/items/${frame.toLowerCase()}_prime_set/statistics`]
				}
			});
		})

		const getParameterSpy = sinon.spy();
		mockAWS.mock('SSM', 'getParameter', getParameterSpy);

		const response = await handler(batch);

		expect(httpGetStub).to.have.callCount(warframes.length);
		expect(writePointsStub).to.have.been.calledOnce;
		expect(closeStub).to.have.been.calledOnce;
		expect(response).to.deep.equal({ 
			message: 'Item batch sampled successfully.', 
			event: batch
		});
	});
});