/**
 * Created by knandula on 7/17/2015.
 */

var request = require('request');
var qs = require('querystring');
var jwt = require('./jwt.js');
var moment = require('moment');
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
                User.findOne({facebookId:profile.id},function(err,existingUser){
                    if(existingUser)
                        createSendToken(existingUser,res);
                    else {
                        var newUser = new User();
                        console.log(profile);
                        newUser.facebookId = profile.id;
                        newUser.displayName = profile.name;
                        newUser.save(function (err) {
                            createSendToken(newUser, res);
                        })
                    }
                });
        })
    });


    function createSendToken(user,res){
        var payload = {
            sub:user._id,
            exp: moment().add(10,'days').unix()
        }
        var token  = jwt.encode(payload,'shhh...');

        res.status(200).send({
            user:user.toJSON(),
            token: token
        });
    }
};