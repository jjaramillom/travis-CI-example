/**
 *  In order to execute this file before the test, add this to package.json
 *  "jest": {
    "setupTestFrameworkScriptFile": "./test.setup.js"
  },
 */

 jest.setTimeout(10000)


require('../models/User');

const keys = require('../config/keys');

const mongoose = require('mongoose');

mongoose.Promise = global.Promise;
mongoose.connect(keys.mongoURI, { useMongoClient: true });
