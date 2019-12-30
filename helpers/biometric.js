'use strict';
const Config = require('../config/config');
var Fingerprint = require('express-fingerprint')

app.use(Fingerprint({
    parameters:[
        // Defaults
        Fingerprint.useragent,
        Fingerprint.acceptHeaders,
        Fingerprint.geoip,

        // Additional parameters
        function(next) {
            // ...do something...
            next(null,{
            'param1':'value1'
            })
        },
        function(next) {
            // ...do something...
            next(null,{
            'param2':'value2'
            })
        },
    ]
}))

app.get('*',function(req,res,next) {
    // Fingerprint object
    console.log(req.fingerprint)
})
