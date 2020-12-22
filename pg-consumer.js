require("dotenv").config();
const redis = require('redis');
const pgp = require('pg-promise')();

const postgressStreams = require('./lib/postgress-streams');

postgressStreams();
// Call postgress Stream every 50 seconds
setInterval(() => postgressStreams(), 50000);