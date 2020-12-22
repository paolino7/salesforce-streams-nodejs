require("dotenv").config();
const redis = require('redis');
const { Pool } = require('pg');

const {
    DB_USERNAME,
    DB_HOST,
    DB_DATABASE,
    DB_PASSWORD,
    DB_PORT
} = process.env;
if (
    !(
        DB_USERNAME &&
        DB_HOST &&
        DB_DATABASE &&
        DB_PASSWORD &&
        DB_PORT
    )
) {
    console.error(
        "Cannot start app: missing mandatory configuration. Check your .env file."
    );
    process.exit(-1);
}

const pool = new Pool({
    user: DB_USERNAME,
    host: DB_HOST,
    database: DB_DATABASE,
    password: DB_PASSWORD,
    port: DB_PORT,
    ssl: {
        rejectUnauthorized: false
    }
});

(async () => {

    const pg_client = await pool.connect();

    await pg_client.query('SELECT NOW() as now').then(res => {
        console.log(res.rows[0]);
    }).catch(err => {
        console.error(err.stack);
    })

})().catch((err) => console.error(err));