/**
 * Created by knandula on 7/27/2015.
 */
var mongoose = require('mongoose');

var ProfileSchema = new mongoose.Schema({
    userId:String,
    coverpicid: String,
    coverpictype: String,
    profilepicid: String,
    profilepictype: String
})

module.exports = mongoose.model('Profile',ProfileSchema)