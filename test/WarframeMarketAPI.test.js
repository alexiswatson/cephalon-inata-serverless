import WarframeMarketAPI, { MARKET_ENDPOINT } from '../src/lib/WarframeMarketAPI';
import axios from 'axios';
import payloads from './helpers/payloads';
import chai, { expect } from 'chai';
import sinon from 'sinon';
import sinonChai from 'sinon-chai';
import chaiAsPromised from 'chai-as-promised';

chai.use(sinonChai);
chai.use(chaiAsPromised);

describe('Warframe Market API Client', () => {
	// We're using a vanilla Axios instance to speed up testing.
	const market = WarframeMarketAPI.getInstance(axios);
	const stubResponse = {
		status: 200,
		statusText: 'OK',
		data: {}
	}
	const stubError = new Error('Unexpected Error');
	const getStubNotAuthdError = (url) => ({
		...stubError,
		message: 'Not Authorized',
		request: {
			_currentUrl: url
		},
		response: {
			status: 401,
			statusText: 'Not Authorized',
			data: {
				error: 'Not Authorized'
			}
		}
	});
	const getStubNoResponseError = (url) => ({
		...stubError,
		message: 'connect ETIMEDOUT',
		request: {
			_currentUrl: url
		},
		response: undefined
	});
	let httpGetStub;
	
	beforeEach(() => {
		httpGetStub = sinon.stub(axios, 'get');
	});
	
	afterEach(() => {
		sinon.restore();
	});

	describe('GET Requests', () => {
		it('gets all items on the market', async () => {
			httpGetStub.resolves({
				...stubResponse,
				data: {
					payload: payloads[`${MARKET_ENDPOINT}/items`]
				}			
			});
			const responseOK = await market.get.items();
		  expect(axios.get).to.have.been.calledWith(`${MARKET_ENDPOINT}/items`);
			expect(responseOK.status).to.equal(200);
			expect(responseOK.statusText).to.equal('OK');
			expect(responseOK.data.payload).to.deep.equal(payloads[`${MARKET_ENDPOINT}/items`]);
		});

		it('throws non-200 responses when getting all items', async () => {
			const notAuthd = getStubNotAuthdError(`${MARKET_ENDPOINT}/items`)
			httpGetStub.rejects(notAuthd);
			return expect(market.get.items()).to.eventually.be.rejectedWith('Warframe Market API responded with 401');
		});

		it('throws non-responses when getting all items', async () => {
			const noResponse = getStubNoResponseError(`${MARKET_ENDPOINT}/items`)
			httpGetStub.rejects(noResponse);
			return expect(market.get.items()).to.eventually.be.rejectedWith('Warframe Market API failed to respond to request: connect ETIMEDOUT');
		});

		it('throws other exceptions when getting all items', async () => {
			httpGetStub.rejects(stubError);
			return expect(market.get.items()).to.eventually.be.rejectedWith('Warframe Market API error: Unexpected Error');
		});

		it('gets the statistics of a specific item on the market', async () => {
			httpGetStub.resolves({
				...stubResponse,
				data: {
					payload: payloads[`${MARKET_ENDPOINT}/items/limbo_prime_set/statistics`]
				}			
			});
			const responseOK = await market.get.itemStatistics('limbo_prime_set');
		  expect(axios.get).to.have.been.calledWith(`${MARKET_ENDPOINT}/items/limbo_prime_set/statistics`);
			expect(responseOK.status).to.equal(200);
			expect(responseOK.statusText).to.equal('OK');
			expect(responseOK.data.payload).to.deep.equal(payloads[`${MARKET_ENDPOINT}/items/limbo_prime_set/statistics`]);
		});

		it('throws non-200 responses when getting item statistics', async () => {
			const notAuthd = getStubNotAuthdError(`${MARKET_ENDPOINT}/items/limbo_prime_set/statistics`)
			httpGetStub.rejects(notAuthd);
			return expect(market.get.itemStatistics('limbo_prime_set')).to.eventually.be.rejectedWith('Warframe Market API responded with 401');
		});

		it('throws non-responses when getting item statistics', async () => {
			const noResponse = getStubNoResponseError(`${MARKET_ENDPOINT}/items/limbo_prime_set/statistics`)
			httpGetStub.rejects(noResponse);
			return expect(market.get.itemStatistics('limbo_prime_set')).to.eventually.be.rejectedWith('Warframe Market API failed to respond to request: connect ETIMEDOUT');
		});

		it('throws other exceptions when getting item statistics', async () => {
			httpGetStub.rejects(stubError);
			return expect(market.get.itemStatistics('limbo_prime_set')).to.eventually.be.rejectedWith('Warframe Market API error: Unexpected Error');
		});
	});
});