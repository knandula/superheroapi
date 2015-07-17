
var jwt = require('./jwt.js');
var moment = require('moment');

module.exports = function createSendToken(user,res){
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

