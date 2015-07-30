/**
 * Created by knandula on 7/30/2015.
 */

var mongoose = require('mongoose');

var StreamSchema = new mongoose.Schema({
    userId:String,
    stamp: { type : Date, default: Date.now },
    comment: String
})

module.exports = mongoose.model('Stream',StreamSchema)