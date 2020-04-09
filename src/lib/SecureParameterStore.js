import AWS from 'aws-sdk';

AWS.config.apiVersions = {
  ssm: '2014-11-06'
};

function SecureParameterStoreFactory(ssm) {
	const _ssm = ssm;
	const _cache = {};

	async function _getParam(Name) {
		try {
			const res = await _ssm.getParameter({
				Name,
				WithDecryption: true
			}).promise();
			return res.Parameter.Value;
		}
		catch(e) {
			throw new Error(`Unable to get parameter from SSM store: ${e.message}`);
		}
	}

	return {
		async getParam(path) {
			const args = JSON.stringify(arguments);
			try {
				_cache[args] = _cache[args] || await _getParam(path);
				return _cache[args];
			}
			catch(e) {
				throw e;
			}
		},
		clearCache() {
			Object.entries(_cache).forEach(([ key, value ]) => {
				delete _cache[key];
			});
		} 
	}
}

export default {
	create(ssm) {
		return SecureParameterStoreFactory(ssm);
	}
}