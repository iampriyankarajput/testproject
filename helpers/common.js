/*******************************************************************************
 * Common Helper
 ******************************************************************************/
'use strict';
const crypto = require('crypto');
const Config = require('../config/config');
const algorithm = 'aes-256-ctr';
const privateKey = Config.key.privateKey;
const knox = require('knox');
const fs = require('fs');
// exports.getDaysBackDate = (months) => {
//     return new Date(new Date().getTime() - months*24 * 60 * 60 * 1000);
// };
exports.getFileExtension = (filename) => {
    return (/[.]/.exec(filename)) ? /[^.]+$/.exec(filename)[0] : undefined;
};

exports.decrypt = (password) => {
    return decrypt(password);
};

exports.encrypt = (password) => {
    return encrypt(password);
};

exports.uploadFileOnS3 = async (path, image, contentType) => {
    let client = knox.createClient({
        key: Config.s3.AWS_ACCESS_KEY,
        secret: Config.s3.AWS_SECRET_ACCESS_KEY,
        bucket: Config.s3.bucketName
    });
    return new Promise((resolve, reject) => {
        client.putFile(path + image, image, {
            'Content-Type': contentType,
            'x-amz-acl': 'public-read',
        }, (err, result) => {
            if (err) {
                return resolve(false);
            }
            if (result.req.url) {
                fs.unlink(path + image, function (err) {});
            }
            return resolve(result.req.url);
        })
    });
};

exports.removeFileFromS3 = async (image) => {
    let client = knox.createClient({
        key: Config.s3.AWS_ACCESS_KEY,
        secret: Config.s3.AWS_SECRET_ACCESS_KEY,
        bucket: Config.s3.bucketName
    });
    return new Promise((resolve, reject) => {
        client.del(image).on('response', function (res) {
            return resolve(true);
        }).end();
    });
};

// method to decrypt data(password)
const decrypt = (password) => {
    let decipher = crypto.createDecipher(algorithm, privateKey);
    let dec = decipher.update(password, 'hex', 'utf8');
    dec += decipher.final('utf8');
    return dec;
};

// method to encrypt data(password)
const encrypt = (password) => {
    let cipher = crypto.createCipher(algorithm, privateKey);
    let crypted = cipher.update(password, 'utf8', 'hex');
    crypted += cipher.final('hex');
    return crypted;
};

exports.uploadFile = (fileObject, target, fileName, callback) => {
    var data = fileObject;
    var path = target + fileName;
    var file = fs.createWriteStream(path);

    file.on('error', function (err) {
        if(err)
        callback(false);
    });
    data.pipe(file);
    data.on('end', function (err) {
        if(!err) {
            callback(fileName);
        } else {
            callback(false);
        }
    });
};

exports.uploadTOS3 = (fileData, filename, callback) => {
    //Create S3 Client
    var client = knox.createClient({
        key: Config.s3.AWS_ACCESS_KEY,
        secret: Config.s3.AWS_SECRET_ACCESS_KEY,
        bucket: Config.s3.bucketName
    });
    var s3ClientOptions = { 'x-amz-acl': 'public-read' };
    client.putFile(fileData, filename, s3ClientOptions, function (err, result) {
        if(result && result.req.url) {
            callback(err, result.req.url)
        } else {
            callback(null)
        }
    });
};
