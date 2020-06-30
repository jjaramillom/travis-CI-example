const mongoose = require('mongoose');
const util = require('util');

const redis = require('redis');
const redisURL = 'redis://0.0.0.0:6379';
const client = redis.createClient(redisURL);

client.hget = util.promisify(client.hget);

// extra function for toggling the data caching
mongoose.Query.prototype.cache = function (options = {}) {
	this.useCache = true;
	this.hashKey = JSON.stringify(options.key || 'default');
	this.expiration = options.expiration;
	return this;
};

const exec = mongoose.Query.prototype.exec;

//overriding the exec function
mongoose.Query.prototype.exec = async function () {
	// if cache is not toggled
	if (!this.useCache) {
		return exec.apply(this, arguments);
	}

	const key = JSON.stringify({
		...this.getQuery(),
		collection: this.mongooseCollection.name,
	});

	// See if we have a value for 'key' in redis
	const cacheValue = await client.hget(this.hashKey, key);

	// If we do, return it
	if (cacheValue) {
		const parsedCache = JSON.parse(cacheValue);
		if (Array.isArray(parsedCache)) {
			console.log('cached Array: ', this.mongooseCollection.name);
			return parsedCache.map((value) => new this.model(value));
		}
		console.log('cached element: ', this.mongooseCollection.name);
		return new this.model(parsedCache);
	}

	// Otherwise issue the query and store the result in redis
	const result = await exec.apply(this, arguments);
	console.log('mongo data: ', this.mongooseCollection.name);
	client.hset(this.hashKey, key, JSON.stringify(result), 'EX', 10);

	return result;
};

module.exports.clearHash = (hashKey) => {
	client.del(JSON.stringify(hashKey));
};
