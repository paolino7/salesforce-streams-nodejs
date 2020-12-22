const { promisify } = require('util');

const PG_REDIS_STORE = 'salesforce-pg-list';

async function pgStreams(redisClient) {
    if (redisClient == null) {
        throw new Error('Requires redisClient');
    }

    const lrangeAsync = promisify(redisClient.lrange).bind(redisClient);
    const delAsync = promisify(redisClient.del).bind(redisClient);

    return lrangeAsync(PG_REDIS_STORE, 0, -1).then((res) => {
        console.log(`lrageAsync ${JSON.stringify(res)}`);
        // return delAsync(PG_REDIS_STORE).then(rem => {
        //     console.log(`lremAsync ${JSON.stringify(rem)}`);
        //     return res;
        // }).catch(e => {
        //     console.error(e);
        // });

        const entries = [];
        res.forEach((item) => {
            entries.push(JSON.parse(item));
        });
        return entries;
    }).catch(e => {
        console.error(e);
    });

}

module.exports = pgStreams;
