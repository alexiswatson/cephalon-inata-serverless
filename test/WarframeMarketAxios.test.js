import chai, { expect } from 'chai';
import sinonChai from 'sinon-chai';
import chaiAsPromised from 'chai-as-promised';
import WarframeMarketAxios from '../src/lib/WarframeMarketAxios';

chai.use(sinonChai);
chai.use(chaiAsPromised);

describe('Warframe Market Axios Instance', () => {
	const adapter = (config) => Promise.resolve(config);
	const http = WarframeMarketAxios.create({ adapter });

	it('returns an Axios instance', () => {
		// Axios deliberately breaks the prototype chain, so duck-typing it is.
		expect(typeof http.get === 'function').to.be.equal(true);
		expect(typeof http.request === 'function').to.be.equal(true);
	});

	it('is configured to respect a three request per second rate limit', () => {
		expect(http.getMaxRPS()).to.equal(3);
	});

	it('does not allow more than three requests per second', async () => {
		const start = Date.now();
		const requests = new Array(4).fill(null).map(() => http.get('/users'));
		await Promise.all(requests);
		const end = Date.now();
		expect(end - start).to.be.greaterThan(1000);
	});
});
