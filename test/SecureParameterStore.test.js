import AWS from 'aws-sdk';
import chai, { expect } from 'chai';
import sinon from 'sinon';
import sinonChai from 'sinon-chai';
import chaiAsPromised from 'chai-as-promised';
import SecureParameterStore from '../src/lib/SecureParameterStore';

chai.use(sinonChai);
chai.use(chaiAsPromised);

AWS.config.apiVersions = {
	ssm: '2014-11-06',
};

describe('Secure Parameter Store API', () => {
	const SSM = new AWS.SSM();
	const Store = SecureParameterStore.create(SSM);
	const Name = 'path/to/secret';
	const expectedArg = {
		Name,
		WithDecryption: true,
	};
	let getParamStub;

	beforeEach(() => {
		getParamStub = sinon.stub(SSM, 'getParameter');
	});

	afterEach(() => {
		sinon.restore();
		Store.clearCache();
	});

	it('securely retrieves parameters from the AWS SSM Parameter Store', async () => {
		getParamStub.withArgs(expectedArg).returns({
			promise: () => Promise.resolve({
				Parameter: {
					Value: 'SecureSecret',
				},
			}),
		});

		const value = await Store.getParam(Name);

		expect(value).to.equal('SecureSecret');
	});

	it('handles errors returned by the AWS SSM Parameter Store', async () => {
		const message = 'An error has occurred.';
		getParamStub.returns({
			promise: () => Promise.reject(new Error(message)),
		});

		return expect(Store.getParam(Name)).to.eventually.be.rejectedWith(`Unable to get parameter from SSM store: ${message}`);
	});

	it('memoizes the response received from the AWS SSM Parameter Store', async () => {
		getParamStub.withArgs(expectedArg).returns({
			promise: () => Promise.resolve({
				Parameter: {
					Value: 'SecureSecret',
				},
			}),
		});

		const firstValue = await Store.getParam(Name);
		const secondValue = await Store.getParam(Name);

		expect(firstValue).to.equal('SecureSecret');
		expect(secondValue).to.equal('SecureSecret');
		expect(getParamStub).to.have.callCount(1);
	});

	it('flushes the entire cache', async () => {
		getParamStub.withArgs(expectedArg).returns({
			promise: () => Promise.resolve({
				Parameter: {
					Value: 'SecureSecret',
				},
			}),
		});

		const firstValue = await Store.getParam(Name);
		Store.clearCache();
		const secondValue = await Store.getParam(Name);

		expect(firstValue).to.equal('SecureSecret');
		expect(secondValue).to.equal('SecureSecret');
		expect(getParamStub).to.have.callCount(2);
	});
});
