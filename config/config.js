'use strict';

const env = require('get-env')({
    staging: 'staging',
    test: 'test'
});
module.exports = require('./' + env);
