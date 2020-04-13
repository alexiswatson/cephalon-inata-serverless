import AWS from 'aws-sdk';

AWS.config.apiVersions = {
	ssm: '2014-11-06',
};

function SecureParameterStoreFactory(ssm) {
	const ssmSDK = ssm;
	const cache = {};

	async function getParamPrivate(Name) {
		try {
			const res = await ssmSDK.getParameter({
				Name,
				WithDecryption: true,
			}).promise();
			return res.Parameter.Value;
		} catch (e) {
			throw new Error(`Unable to get parameter from SSM store: ${e.message}`);
		}
	}

	return {
		async getParam(path) {
			const args = JSON.stringify(path);
			cache[args] = cache[args] || await getParamPrivate(path);
			return cache[args];
		},
		clearCache() {
			Object.entries(cache).forEach(([key]) => {
				delete cache[key];
			});
		},
	};
}

export default {
	create(ssm) {
		return SecureParameterStoreFactory(ssm);
	},
};
