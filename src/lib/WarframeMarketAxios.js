import axios from 'axios';
import axiosRateLimit from 'axios-rate-limit';

const defaultInstance = axiosRateLimit(axios.create(), { maxRequests: 3, perMilliseconds: 1000 });

// The Warframe Market API has a 3/sec rate limit on requests.
export default {
	...defaultInstance,
	create(config = {}) {
		return axiosRateLimit(axios.create(config), { maxRequests: 3, perMilliseconds: 1000 });
	},
};
