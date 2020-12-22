require("dotenv").config();
const redis = require('redis');
const pgp = require('pg-promise')();

const pgRedisHelper = require("./pg-redis-helper");

const {
    DB_USERNAME,
    DB_HOST,
    DB_DATABASE,
    DB_PASSWORD,
    DB_PORT,
    REDIS_URL
} = process.env;
if (
    !(
        DB_USERNAME &&
        DB_HOST &&
        DB_DATABASE &&
        DB_PASSWORD &&
        DB_PORT &&
        REDIS_URL
    )
) {
    console.error(
        "Cannot start app: missing mandatory configuration. Check your .env file."
    );
    process.exit(-1);
}

const PG_TABLE_STORE = 'logging_cdc';

const pg_client = pgp({
    user: DB_USERNAME,
    host: DB_HOST,
    database: DB_DATABASE,
    password: DB_PASSWORD,
    port: DB_PORT,
    ssl: {
        rejectUnauthorized: false
    }
});

// Setup column

const cs = new pgp.helpers.ColumnSet(['replayid', 'channelname', 'commitnumber', 'entityname', 'changetype', 'transactionkey', 'committimestamp', 'payload', 'numofrecords'], { table: PG_TABLE_STORE });

function convertForPg(data) {
    return {
        replayid: data.event.replayId,
        channelname: 'channel',
        commitnumber: data.payload.ChangeEventHeader.commitNumber,
        entityname: data.payload.ChangeEventHeader.entityName,
        changetype: data.payload.ChangeEventHeader.changeType,
        transactionkey: data.payload.ChangeEventHeader.transactionKey,
        committimestamp: data.payload.ChangeEventHeader.commitTimestamp,
        payload: JSON.stringify(data),
        numofrecords: data.payload.ChangeEventHeader.recordIds.length
    }
}

async function postgressStreams() {

    console.log(`************ Start postgressStreams`);

    await pg_client.any('SELECT NOW() as now').then(res => {
        console.log(res[0]);
    }).catch(err => {
        console.error(err.stack);
    });

    // Setup Redis datastore to receive messages
    const redisStream = redis.createClient(REDIS_URL, { tls: { requestCert: true, rejectUnauthorized: false } });
    redisStream.on("error", function (err) {
        console.error(`redis stream error: ${err.stack}`);
        process.exit(1);
    });
    redisStream.subscribe('heartbeat', 'status', 'salesforce');

    // Setup Redis datastore to perform queries (separate from subscriber)
    const redisQuery = redis.createClient(REDIS_URL, { tls: { requestCert: true, rejectUnauthorized: false } });
    redisQuery.on("error", function (err) {
        console.error(`redis query error: ${err.stack}`);
        process.exit(1);
    });

    const rowsToPersit = await pgRedisHelper(redisQuery).then(async rowsToPersit => {
        // console.log(`DEBUG -- Rows to persist: ${JSON.stringify(rowsToPersit)}`);

        if (rowsToPersit && rowsToPersit.length > 0) {
            const values = rowsToPersit.map(convertForPg);
            // console.log(`DEBUG -- values : ${JSON.stringify(values)}`);

            const query = pgp.helpers.insert(values, cs);

            pg_client.none(query).then(res => {
                console.log(`Rows persisted correctly`);
            }).catch(e => {
                console.error(`Error during persist ${e}`);
            });
        }
    });

};

module.exports = postgressStreams;
