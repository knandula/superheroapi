/**
 * Created by knandula on 7/10/2015.
 */

var express = require('express');
var bodyParser = require('body-parser');
var mongoose = require('mongoose');
var User = require('./models/User.js');
var Profile = require('./models/Profile.js');
var Stream = require('./models/Stream.js');
var facebookAuth = require('./services/facebookAuth.js');
var jwt = require('./services/jwt.js');
var request = require('request');
var moment = require('moment');
var fs = require('fs');
var multer = require('multer');
var util = require("util");
var upload = multer({ dest: 'uploads/' });
var Schema = mongoose.Schema;
var conn = mongoose.connection;
var Grid = require('gridfs-stream');
var path = require('path');
var multiparty = require('connect-multiparty');
var formidable = require('formidable');
var cors = require('cors');
var buffer = "";
var cloudinary = require('cloudinary');




Grid.mongo = mongoose.mongo;

var port = process.env.PORT || 7203;

var app = express();

var whitelist = ['https://fictiontree.herokuapp.com', 'http://fictiontree.herokuapp.com','http://res.cloudinary.com','https://res.cloudinary.com'];
var corsOptions = {
    credentials:true,
    origin: function(origin, callback){
        var originIsWhitelisted = whitelist.indexOf(origin) !== -1;
        callback(null, originIsWhitelisted);
    }
};
app.use(cors(corsOptions));
app.use(express.static(path.join(__dirname,'./public')));
app.use(bodyParser({defer: true}));
app.use(bodyParser.json({limit: '50mb'}));
app.use(bodyParser.urlencoded({limit: '50mb', extended: true}));

cloudinary.config({
    cloud_name: 'hcjzx8ghq',
    api_key: '692468465875989',
    api_secret: 'MI-P3fwDrgCUctZ1bfXzi-9UTAQ'
});

var multipartyMiddleware = multiparty({ uploadDir: 'public/img/' });



//app.all('/', function(req, res, next){
//    if (!req.get('Origin')) return next();
//    res.set('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
//    res.set('Access-Control-Allow-Credentials', 'true');
//    res.set('Access-Control-Allow-Headers', 'Origin,Accept,Content-Type, Authorization, Content-Length, X-Requested-With');
//    if ('OPTIONS' == req.method) return res.send(200);
//    next();
//});

app.get('/getStream', function (req, res) {
    Stream.find({},{},{sort:{stamp:-1}},function(err,col){
        res.send({posts:col});
    })
})

app.post('/post',function(req,res){
    var user = req.body.user;
    var comment = req.body.msg;

    var  post = new Stream();
    post.userId = user._id;
    post.comment = comment;

    post.save(function(err){
        if(err) throw err;
    })
})


app.post('/uploadimage',multipartyMiddleware,function(req,res){
    var user = JSON.parse(req.body.data);
    var imgtype = user.imgtype;
    var rfile = req.files.file;


    cloudinary.uploader.upload(req.files.file.path,function(result) {
            console.log(result);
            var fpath = result.secure_url;
            Profile.findOne({userId: user.userdata._id},function(err, foundProfile){
                if(foundProfile){
                    if(imgtype == 'cover') {
                        foundProfile.coverpictype = rfile.type;
                        foundProfile.coverpath = fpath;
                    }else if(imgtype == 'profile')
                    {
                        foundProfile.profilepictype = rfile.type;
                        foundProfile.profilepath = fpath;
                    }
                    foundProfile.save();
                    res.send(fpath);
                }else {
                    var prof = new Profile();
                    prof.userId = user.userdata._id;
                    if(imgtype == 'cover') {
                        prof.coverpictype = rfile.type;
                        prof.coverpath = fpath;
                    }else if(imgtype == 'profile'){
                        foundProfile.profilepictype = rfile.type;
                        foundProfile.profilepath = fpath;
                    }
                    prof.save(function (err) {
                        if (err) throw err;
                    })
                }
            })
        },
        {
            public_id: 'sample_id',
            crop: 'limit',
            width: 2000,
            height: 2000,
            eager: [
                { width: 200, height: 200, crop: 'thumb', gravity: 'face',
                    radius: 20, effect: 'sepia' },
                { width: 100, height: 150, crop: 'fit', format: 'png' }
            ],
            tags: ['special', 'for_homepage']
        }
    )


})

app.get('/public/img/:id',cors(corsOptions),function(req, res) {
    var url = '/img/' + req.params.id;
    res.redirect(url);
});
app.get('/data/:image', function(req, res) {
    fileRepository.getFile( function(error,data) {
        res.writeHead('200', {'Content-Type': 'image/png'});
        res.end(data,'binary');
    }, req.params.imgtag );
});

app.post('/getprofilepicdata',cors(corsOptions),function(req,res) {
    var user = req.body;
    Profile.findOne({userId: user._id},function(err, foundProfile){
        if(foundProfile){
            res.send(foundProfile.profilepath);
        }
    })
});
app.post('/getcoverpicdata',cors(corsOptions),function(req,res) {
    var user = req.body;
    Profile.findOne({userId: user._id},function(err, foundProfile){
        if(foundProfile){
            res.send(foundProfile.coverpath);
        }
    })
});

app.post('/register',cors(corsOptions),function(req,res){
    var user = req.body;

    var newUser = new User({
        email: user.email,
        password: user.password
    })
    newUser.save(function(err){
        createSendToken(newUser,res);
    })
})
app.post('/login',cors(corsOptions),function(req,res){
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

var server = app.listen(port,function(){
    console.log('api listening on',port);
})