/**
 * Created by knandula on 7/10/2015.
 */

var express = require('express');
var bodyParser = require('body-parser');
var busboy = require('connect-busboy')
var mongoose = require('mongoose');
var User = require('./models/User.js');
var facebookAuth = require('./services/facebookAuth.js');
var jwt = require('./services/jwt.js');
var request = require('request');
var moment = require('moment');
var Grid = require('gridfs-stream');

var port = process.env.PORT || 7200;

var app = express();

app.all('*', function(req, res, next){
    if (!req.get('Origin')) return next();
    // use "*" here to accept any origin
    //res.set('Access-Control-Allow-Origin', 'https://fictiontree.herokuapp.com');
    res.set('Access-Control-Allow-Origin', 'https://streatbeat.herokuapp.com');  // localhost
    res.set('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
    res.set('Access-Control-Allow-Credentials', 'true');
    res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, Content-Length, X-Requested-With');
    // res.set('Access-Control-Allow-Max-Age', 3600);
    if ('OPTIONS' == req.method) return res.send(200);
    next();
});

//app.use(busboyBodyParser());
//app.use(busboy());

app.use(bodyParser.json());
app.use(bodyParser.urlencoded());

//app.use(function parseUploadMW(req,res,next){
//    req.busboy.on('file', function onFile(fieldname, file, filename, encoding, mimetype) {
//        file.fileRead = [];
//        file.on('data', function onData(chunk) {
//            this.fileRead.push(chunk);
//        });
//        file.on('error', function onError(err) {
//            console.log('Error while buffering the stream: ', err);
//            //handle error
//        });
//        file.on('end', function onEnd() {
//            var finalBuffer = Buffer.concat(this.fileRead);
//            req.files = req.files||{}
//            req.files[fieldname] = {
//                buffer: finalBuffer,
//                size: finalBuffer.length,
//                filename: filename,
//                mimetype: mimetype.toLowerCase()
//            };
//        });
//    });
//    req.busboy.on('finish', function onFinish() {
//        next()
//    });
//    req.pipe(req.busboy);
//})




app.post('/location',function(req,res){
    console.log(req.body);
})

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
    console.log(req.user);
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



app.post('/auth/facebook',facebookAuth);

app.post('/auth/google',function(req,res){
    var url =  'https://accounts.google.com/o/oauth2/token';
    var apiUrl = 'https://www.googleapis.com/plus/v1/people/me/openIdConnect';
    var params = {
        client_id: req.body.clientId,
        redirect_uri: req.body.redirectUri,
        code:req.body.code,
        grant_type: 'authorization_code',
        client_secret: 'f2W4QSvL4CdiJrm4VXRiSl4p'
    }
    console.log(params);
    request.post(url,{
        json:true,
        form:params
    },function(err,respose,token){
        var accessToken = token.access_token;
        var headers = {Authorization: 'Bearer ' + accessToken };
        request.get({
            url:apiUrl,
            headers:headers,
            json:true},
                function(err,response,profile){
                    User.findOne({googleId: profile.sub},function(err, foundUser){
                        console.log(foundUser);
                        if(foundUser) return createSendToken(foundUser,res);

                        var newuser = new User();
                        newuser.googleId = profile.sub;
                        newuser.displayName= profile.name;
                        newuser.save(function(err){
                            if(err) throw err;
                            createSendToken(newuser,res);
                        })

                    })
        });
    });
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

mongoose.connect('mongodb://superhero:superhero@ds033429.mongolab.com:33429/startupone');

//var conn = mongoose.connection;
//Grid.mongo = mongoose.mongo;
//
//app.post('/uploadimage',function(req,res){
//    console.log(req.body);
//
//
//       var gfs = Grid(conn.db);
//       var ws = gfs.createWriteStream(req.body);
//
//       ws.on('close',function(file){
//           console.log(file.filename + "written to DB");
//       })
//
//})

var server = app.listen(port,function(){
    console.log('api listening on',port);
})