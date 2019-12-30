/*******************************************************************************
 * Product Model
 ******************************************************************************/
'use strict';
var mongoose = require('mongoose'),
    Schema = mongoose.Schema,
    timestamps = require('mongoose-timestamps');

//Define Product schema
var ProductSchema = new Schema({
    name: { type: String, required: true},
    country: {type:String,default:null}
});

module.exports = mongoose.model('Product', ProductSchema);