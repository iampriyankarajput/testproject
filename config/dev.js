/*******************************************************************************
 * Put Server and Plugins configs here
 * ENV: Development
 ******************************************************************************/
'use strict';
const path = require('path');
const projectName = 'My First Project';
const port = 3000;

module.exports = {
    env: 'development',
    server: {
        host: '127.0.0.1',
        port: port
    },
    product: {
        name: projectName
    },
    key: {
        privateKey: 'BbZJjyoXAdr8BUZuiKKARWimKfrSmQ6fv8kZ7OFfc'
    },
    Sendgrid: {
        apiKey: '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',
        from: 'Hullkers noreply@gmail.com',
        username: 'PriyankaRajput',
        password: 'rajput1998'
    },
    db: {
        url: 'mongodb://localhost:27017/product-db',
        options: {
            useNewUrlParser: true
        }
    }
};
