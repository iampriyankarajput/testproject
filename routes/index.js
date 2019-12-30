/*******************************************************************************
 * All Routes
 ******************************************************************************/

'use strict';
const path = require('path');
const fs = require('fs');

const routes = (server) => {
    fs.readdirSync(__dirname).filter((file) => {
        return path.join(__dirname, file) != __filename;
    }).forEach((file) => {
        require('./' + path.basename(file))(server);
    });
};

module.exports = routes;
