import crypto from 'crypto';

/**
 * Stub implementation of SQS.sendMessageBatch(), allowing for dynamic responses.
 * 
 * @param {Array} items - A collection of batch items. Each must have an Id
 *   and a MessageBody.
 * @param {Function} succeedsIf - A function accepting an item, returning true
 *   if the item should be returned as successful.
 * 
 * @returns {Object} - A response object with two Arrays, Successful and Failed.
 *   Successful items are objects with the keys Id, MessageId, MD5OfMessageBody.
 *   Failed items are objects with an Id, a SenderFault of false, and a Code of
 *   ERROR_CODE. Items succeed or fail based on the succeedsIf condition.
 */
export const sendMessageBatchStubImpl = (items, succeedsIf) => {
	const success = ({ Id, MessageBody }) => ({
		Id,
		MessageId: Date.now(),
		MD5OfMessageBody: crypto.createHash('md5').update(MessageBody)
	});
	const fail = ({ Id }) => ({
		Id,
		SenderFault: false,
		Code: 'ERROR_CODE'
	});
	return items.reduce(({ Successful, Failed }, item) => {
		return succeedsIf(item)
			? { Successful: [ ...Successful, success(item) ], Failed }
			: { Successful, Failed: [ ...Failed, fail(item) ] };
	}, {Successful: [], Failed: []});
}