/*******************************************************************************
 * User Controller
 ******************************************************************************/
'use strict';
const mongoose = require('mongoose');
// const Product = mongoose.model('Category');
const Config = require('../config/config');
const path = require('path');
const reformatErrors = require('../lib/mongoose-errors');
const Product = require('../models/Product');
// var Jwt = require('jsonwebtoken');
const CommonHelper = require('../helpers/common')

module.exports = {
    getProducts: function (req, res) {
        Product.find({}, function (err, product) {
            if (!err) {
                res.status(200).send({
                    success: true,
                    message: 'success',
                    data: product
                });
            } else {
                res.status(404).send({
                    success: false,
                    message: 'Data not found',
                    data: null
                });
            }
        });
    },
    addProduct: function (req, res) {
        var body = req.body;
        var product = new Product(body);
        product.save(function (err, product) {
            if (!err) {
                res.status(200).send({
                    success: true,
                    message: 'success',
                    data: product

                });
            } else {
                res.status(500).send({
                    success: false,
                    message: 'Error in save product',
                    data: err
                });
            }
        })
    },

    getProductDetail: function (req, res) {
        Product.findOne({ _id: req.params.id }, function (err, product) {
            if (!err) {
                res.status(200).send({
                    success: true,
                    message: 'success',
                    data: product
                });
            } else {
                res.status(500).send({
                    success: false,
                    message: 'Error in save product',
                    data: err
                });
            }
        });
    }
}
