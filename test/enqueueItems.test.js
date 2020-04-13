import { lambda } from '../src/enqueueItems';
import { MARKET_ENDPOINT } from '../src/lib/WarframeMarketAPI';
import payloads from './helpers/payloads';
import { sendMessageBatchStubImpl } from './helpers/SQS';
import chai, { expect } from 'chai';
import sinon from 'sinon';
import sinonChai from 'sinon-chai';
import chaiAsPromised from 'chai-as-promised';

chai.use(sinonChai);
chai.use(chaiAsPromised);

describe('enqueueItems Lambda Function', () => {
	const payload = payloads[`${MARKET_ENDPOINT}/items`];
	const event = {
    "version": "0",
    "id": "53dc4d37-cffa-4f76-80c9-8b7d4a4d2eaa",
    "detail-type": "Scheduled Event",
    "source": "aws.events",
    "account": "123456789012",
    "time": "2015-10-08T16:53:06Z",
    "region": "us-east-1",
    "resources": [
        "arn:aws:events:us-east-1:123456789012:rule/my-scheduled-rule"
    ],
    "detail": {}
	};
	let getItemsStub;
	let deps;

	beforeEach(() => {
		getItemsStub = sinon.stub().resolves({
			status: 200,
			statusText: 'OK',
			data: {
				payload
			}
		});

		deps = {
			market: {
				get: {
					items: getItemsStub
				}
			},
			sqs: {
				sendMessageBatch: sinon.stub()
			}
		};
				
		process.env.AWS_ITEMSTATSQUEUE_URL = 'https://www.example.com/queue';
	});

	afterEach(() => {
		sinon.restore();
		delete process.env.AWS_ITEMSTATSQUEUE_URL;
	});

	it('sends the full catalog of items to the SQS queue', async () => {
		deps.sqs.sendMessageBatch.callsFake(({ Entries }) => ({
			promise() {
				return Promise.resolve(
					sendMessageBatchStubImpl(Entries, () => true)
				);
			}
		}));

		const handler = lambda(deps);
		const response = await handler(event);

		expect(deps.market.get.items).to.have.been.calledOnce;
    expect(deps.sqs.sendMessageBatch).to.have.callCount(Math.ceil(payload.items.length / 10));
		expect(response).to.deep.equal({ 
			message: 'Item catalog successfully enqueued for sampling.', 
			event
		});
	});

	it('throws an exception when any message batch has send failures in a 200 response', async () => {
		// Reject every odd Id.	
		deps.sqs.sendMessageBatch.callsFake(({ Entries }) => ({
			promise() {
				return Promise.resolve(
					sendMessageBatchStubImpl(Entries, ({ Id }) => (Id % 2 !== 0))
				);
			}
		}));

		const handler = lambda(deps);

		return expect(handler(event)).to.eventually.be.rejectedWith(`Failed responses received from AWS SQS: 0: ERROR_CODE, 2: ERROR_CODE`);
	});
});