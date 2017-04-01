var express = require('express');
var router = express.Router();

// abhinandan token
var tokens = {
    'u:oc3mjgmsekn3g3cn': '1a3835a4-b09c-47eb-914c-102e8e147c4d',
    'u:v54u6u66b90qo05o' : 'ec99497d-f54c-45be-ab88-b50843fd0e69'
};

var userToGroupMap = {};

// watson functionality
var watson = require('./watson');

var flock = require('flockos');
var flockConig = require('../config/flockConfig');

var Globals = {
    userIDArray: [],
    userMessageArr: [],
    entireMessageArr: []
}

flock.setAppId(flockConig.appId);
flock.setAppSecret(flockConig.appSecret);

// flock
router.use(flock.events.tokenVerifier);

// router.get('/events', function(req, res) {
//     watson('Yo');
//     res.end('Yo');
// });

// get user message webhook
router.post('/messages', function(req, res) {
    var data = req.body;
    var senderID = data.from,
        text = data.text;
    Globals.entireMessageArr.push(text);
    if (Globals.userIDArray.indexOf(senderID) == -1) { // no such entry
        Globals.userIDArray.push(senderID);
        Globals.userMessageArr.push([]);
    }
    var userIdIndex = Globals.userIDArray.indexOf(senderID);
    Globals.userMessageArr[userIdIndex].push(text);
    console.log(Globals.userMessageArr);
    watson.toneAnalyzerAPI(Globals.entireMessageArr, function(data) {
        global.io.emit('mood detect', {'mood' : JSON.stringify(data)});
    });
    // console.log('calling natural language api');
    // watson.naturalLanguageAPI(Globals.entireMessageArr);
});

router.post('/events', flock.events.listener);

// install the app
flock.events.on('app.install', function(event) {
    console.log('fvflvnflv');
    tokens[event.userId] = event.token;
});

// delete tokens on app.uninstall
flock.events.on('app.uninstall', function(event) {
    delete tokens[event.userId];
});

flock.events.on('chat.receiveMessage', function(event) {
    console.log(event.message);
});

// attachment picker for tagging functionality
router.get('/events/attachment', function(req, res) {
    var data = JSON.parse(req.query.flockEvent);
    var userId = data.userId;
    var groupId = data.chat;
    userToGroupMap[userId] = groupId;
    res.render('tagger.html', {
        'userId': userId
    });
});

router.post('/api/v0.1/tagger', function(req, res, next) {
    console.log(req.body);
    var message = req.body.message;
    var userId = req.body.userId;

    console.log("userto: " + userToGroupMap[userId]);
    console.log("token: " + tokens[userId]);

    sendMessage(userId, message);
    res.send(200);
});

// using ingoing call api to send message to the group by the user
function sendMessage(userId, message) {
    var request = require('request');
    request.post(
        'https://api.flock.co/v1/users.getPublicProfile', {
            json: {
                token: tokens[userId],
                userId: userId
            }
        },
        function(error, response, body) {
            if (!error && response.statusCode == 200) {
                console.log(body)
                request.post(
                    'https://api.flock.co/hooks/sendMessage/b52b6e11-f94c-494e-a08f-45de6758afc0', {
                        json: {
                            token: tokens[userId],
                            to: userToGroupMap[userId],
                            text: message,
                            sendAs: {
                                name: body.firstName,
                                profileImage: body.profileImage
                            }
                        }
                    },
                    function(error, response, body) {
                        if (!error && response.statusCode == 200) {
                            console.log(body)
                        }
                    }
                );
            }
        }
    );
}

module.exports = router;
