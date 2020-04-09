import { InfluxDB } from '@influxdata/influxdb-client';

export default {
	create(initObj) {
		return new InfluxDB(initObj);
	}
}