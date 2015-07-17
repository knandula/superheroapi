/**
 * Created by knandula on 7/17/2015.
 */

var request = require('request');
var qs = require('querystring');
var createSendToken = require('./common.js');
var config= require('./config.js');
var User =require('.././models/User.js');

module.exports = function(req,res){
    var accessTokenurl = 'https://graph.facebook.com/oauth/access_token';
    var graphApiUrl = 'https://graph.facebook.com/me';

    var params = {
        client_id: req.body.clientId,
        redirect_uri: req.body.redirectUri,
        client_secret: config.FACEBOOK_SECRET,
        code: req.body.code
    }

    request.get({url:accessTokenurl,qs:params},function(err,response,accessToken){
        accessToken = qs.parse(accessToken);

        request.get({url:graphApiUrl,qs:accessToken,json:true},function(err,response,profile){
                console.log(accessToken);
                console.log(profile);
                User.findOne({facebookId:profile.id},function(err,existingUser){
                    if(existingUser)
                        createSendToken(existingUser,res);
                    var newUser = new User();
                    newUser.facebookId = profile.id;
                    newUser.displayName = profile.name;
                    newUser.save(function(err){
                        createSendToken(newUser,res);
                    })
                });
        })
    });
};