import { MARKET_ENDPOINT } from '../../src/lib/WarframeMarketAPI';

const payloads = {
	[`${MARKET_ENDPOINT}/items`]: {
		items: [
			{
				url_name: "axi_c1_intact",
				id: "5835a4564b0377e226bdc360",
				thumb: "icons/en/thumbs/Axi_C1_Intact.99413ebefc5b87d57d9e5314265b56de.128x128.png",
				item_name: "Axi C1 Intact"
			},
			{
				url_name: "meso_s3_intact",
				id: "5835a4dd4b0377e226bdc380",
				thumb: "icons/en/thumbs/Meso_S3_Intact.caee59471a7b06ca040f2d257083e008.128x128.png",
				item_name: "Meso S3 Intact"
			},
			{
				url_name: "lith_n2_exceptional",
				id: "58d8f31c11efe42a5e523215",
				thumb: "icons/en/thumbs/Lith_N2_Exceptional.b82a140ba17908be7226fddcecd7bf62.128x128.png",
				item_name: "Lith N2 Exceptional"
			}
		]
	}
}

export const warframes = ['Atlas', 'Limbo', 'Chroma', 'Nekros', 'Rhino'];

warframes.forEach((frame, idx) => {
	const lowerFrame = frame.toLowerCase();
	payloads[`${MARKET_ENDPOINT}/items/${lowerFrame}_prime_set/statistics`] =	{
		statistics_closed: {
			['48hours']: [
				{
					datetime: "2020-04-02T00:00:00.000+00:00",
					volume: 5 + idx,
					min_price: 50,
					max_price: 64,
					open_price: 64,
					closed_price: 55,
					avg_price: 57,
					wa_price: 57.8,
					median: 57.5,
					moving_avg: 58.8,
					donch_top: 70,
					donch_bot: 40,
					id: `5e8539ab27cb11002210441${idx}`
				},
				{
					datetime: "2020-04-02T01:00:00.000+00:00",
					volume: 6,
					min_price: 50,
					max_price: 70,
					open_price: 60,
					closed_price: 50,
					avg_price: 60,
					wa_price: 58.333,
					median: 60,
					moving_avg: 59.8,
					donch_top: 70,
					donch_bot: 50,
					id: `5e8547bc27cb1100210e9166${idx}`
				},
				{
					datetime: "2020-04-02T02:00:00.000+00:00",
					volume: 5,
					min_price: 60,
					max_price: 70,
					open_price: 67,
					closed_price: 70,
					avg_price: 65,
					wa_price: 66.4,
					median: 67,
					moving_avg: 61.8,
					donch_top: 70,
					donch_bot: 50,
					id: `5e8555db27cb1100210ea47${idx}`
				},
			]
		}
	};
});

export default payloads;
