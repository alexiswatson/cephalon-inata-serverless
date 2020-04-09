import http from './WarframeMarketAxios'

export const MARKET_ENDPOINT = 'https://api.warframe.market/v1';

const withGetErrorHandling = (getFn) => {
	return async function httpGetErrorHandler(url) {
		try {
			const response = await getFn(url);
			return response;
		}
		catch(e) {
			if (e.response) {
				throw new Error(`Warframe Market API responded with ${e.response.status}`)
				return e.response;
			}
			else if (e.request) {
				throw new Error(`Warframe Market API failed to respond to request: ${e.message}`)
			}
			else {
				throw new Error(`Warframe Market API error: ${e.message}`);
			}
		}
	}
}

// Factory method, binding an Axios instance.
export default {
	getInstance(axiosInstance = http) {
		const API = {
			get: {
				async items() {
					const response = await withGetErrorHandling(axiosInstance.get)(`${MARKET_ENDPOINT}/items`);
					return response;
				},
				async itemStatistics(urlName) {
					const response = await withGetErrorHandling(axiosInstance.get)(`${MARKET_ENDPOINT}/items/${urlName}/statistics`);
					return response;
				}
			}
		}
		return Object.create(API);
	}
} 