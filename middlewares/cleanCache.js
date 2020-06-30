const { clearHash } = require('../services/cache');

module.exports = async (req, res, next) => {
	// Waiting the route handler to execute
	console.log('waiting for route to be handled');
	await next();
    
    // After the route has been handled, if no error occured (statusCode < 400), the cache is cleaned
	if (res.statusCode < 400) {
        console.log('clearing cache');
		clearHash(req.user.id);
	}
};
