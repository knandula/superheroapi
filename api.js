/**
 * Created by knandula on 7/10/2015.
 */

var express = require('express');
var bodyParser = require('body-parser');
var mongoose = require('mongoose');
var User = require('./models/User.js');
var jwt = require('./services/jwt.js');
var cors = require('cors')

var port = process.env.port || 3000;

var app = express();

var allowCrossDomain = function(req, res, next) {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Content-Length, X-Requested-With');

    // intercept OPTIONS method
    if ('OPTIONS' == req.method) {
        res.send(200);
    }
    else {
        next();
    }
};
app.use(allowCrossDomain)
app.use(bodyParser.json());
app.use(cors());

app.post('/register',function(req,res){
    var user = req.body;

    var newUser = new User({
        email: user.email,
        password: user.password
    })
    newUser.save(function(err){
        createSendToken(newUser,res);
    })
})

app.post('/login',function(req,res){
    req.user = req.body;
    var searchUser = {email: req.user.email};
    User.findOne(searchUser,function(err,user){
        if(err) throw err;
        if(!user)  return res.status(401).send({message: "  Wrong email/password  "});
        user.comparePassword(req.user.password,function(err,isMatch){
            if(err) throw err;
            if(!isMatch) return res.status(401).send({message: "  Wrong email/password  "});
            if(isMatch) createSendToken(user,res);
        });
    })
})

function createSendToken(user,res){
    var payload = {
        sub:user._id
    }

    var token  = jwt.encode(payload,'shhh...');

    res.status(200).send({
        user:user.toJSON(),
        token: token
    });
}

mongoose.connect('mongodb://superhero:superhero@ds033429.mongolab.com:33429/startupone');

var server = app.listen(port,function(){
    console.log('api listening on',server.address().port);
})