# Cephalon Inata

Cephalon Inata uses Amazon Web Services and the Serverless framework to extract time-series data from Warframe Market's record of closed trades. 

Because Warframe Market only aggregates these details on the hour for 48 hours (and daily for 90 days), it is difficult to account for trends occuring over longer periods of time.

Cephalon Inata solves this problem by sampling item trade statistics every hour, and recording it in an InfluxDB Cloud bucket for further analysis.

## How it Works

Cephalon Inata deploys a Serverless application to AWS. Every hour (except when running on a non-production stage), CloudWatch is used to invoke a Lambda function to collect all items that are currently being traded on the market into an SQS queue. A second Lambda function reads a batch of items from this queue, samples the latest item-level statistics on closed trades from Warframe Market (while respecting the modest rate limits), and records the data into an InfluxDB Cloud database for further analysis. 

What you do with this data is up to you: visualize trends, run time-series regressions, the sky's the limit.

Secrets and configuration settings are stored and retrieved via the SSM Parameter Store, encrypted using a KMS key created by Cephalon Inata during the deployment process.

## Installation and Usage

1. Set up an InfluxDB Cloud account (<https://www.influxdata.com/products/influxdb-cloud/>). Note that due to the series cardinality required, you will likely need to upgrade from a free account to pay as you go.
2. Create a new bucket in your InfluxDB instance. Each stage of your application (dev, prod) should use a separate bucket.
3. Set up your AWS credentials in Serverless: <https://serverless.com/framework/docs/providers/aws/guide/credentials/>
4. Deploy Cephalon Inata to your AWS account using `serverless deploy --stage dev` from the repository root. The `dev` stage will require manual invocation to collect data—replace it with `--stage prod` to enable automatic sampling every hour. The default stage when omitting the `--stage` flag is `dev`.
5. In your AWS console, select Services, then System Manager. In the screen that follows, select "Parameter Store" from the menu that appears to the left.
6. Cephalon Inata requires four parameters to connect to your InfluxDB Cloud bucket. Replace `{STAGE}` with the stage you just deployed (`dev`, `prod`, etc.):
    * **Path:** `/cephalon-inata-serverless/{STAGE}/InfluxDBAPIBucket`<br>**Type:** String<br>**Value:** The name of your InfluxDB bucket in Step 2.
    
    * **Path:** `/cephalon-inata-serverless/{STAGE}/InfluxDBAPIUrl`<br>**Type:** String<br>**Value:** The URL for your InfluxDB Cloud account, available in your InfluxDB account under Data > Client Libraries.

    * **Path:** `/cephalon-inata-serverless/{STAGE}/InfluxDBAPIKey`<br>**Type:** SecureString<br>**Value:** A token with Write access to your InfluxDB bucket. Generate one in your InfluxDB Cloud account under Data > Tokens.<br>**Key:** `alias/cephalon-inata-serverless/{STAGE}/key`

    * **Path:** `/cephalon-inata-serverless/{STAGE}/InfluxDBAPIOrg`<br>**Type:** SecureString<br>**Value:** The organization number of your InfluxDB bucket, available in the client library examples in your InfluxDB account under Data > Client Libraries.<br> **Key:** `alias/cephalon-inata-serverless/{STAGE}/key`

Data collection can be invoked manually by using `sls invoke --stage <STAGE> -f enqueueItems`. Logs are available via AWS CloudWatch for each stage.

To remove Cephalon Inata from your AWS account, simply run `sls remove --stage <STAGE>`. 

Note that if you later choose to redeploy a given stage later, any SecureStrings you've added to the AWS SSM Parameter Store will need to be rotated, as they'll have been created with a KMS key that no longer exists. The alias should point to the newly created key, however.

## Disclaimer

Although designed to be budget-friendly (much of this can be achieved using the free tier of AWS services), the series cardinality necessary currently requires a paid InfluxDB plan. In any event, the maintainer is not responsible for any fees that result from use.

This project is not affiliated with Digital Extremes or Warframe Market. Use at your own risk.