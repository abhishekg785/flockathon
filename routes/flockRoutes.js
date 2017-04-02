var express = require('express');
var router = express.Router();

// abhinandan token
var tokens = {
    'u:oc3mjgmsekn3g3cn': '1a3835a4-b09c-47eb-914c-102e8e147c4d',
    'u:v54u6u66b90qo05o': 'ec99497d-f54c-45be-ab88-b50843fd0e69'
};

var tagString = "";

var watson = require('watson-developer-cloud');
var watsonConfig = require('../config/watsonConfig');

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
        console.log(data);
        global.io.emit('mood detect', {
            'mood': JSON.stringify(data)
        });
    });
    watson.naturalLanguageAPI(Globals.entireMessageArr, function(data) {
        if (data.keywords.length == 0) {
            console.log('empty');
            global.io.emit('mood statistics', {
                'mood': 'no data'
            });
        } else {
            global.io.emit('mood statistics', {
                'mood': data
            });
        }
    });
});

router.post('/events', flock.events.listener);

// install the app
flock.events.on('app.install', function(event) {
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

// router.post('/api/v0.1/tagger', function(req, res, next) {
//     console.log(req.body);
//     var message = req.body.message;
//     var userId = req.body.userId;
//
//     console.log("userto: " + userToGroupMap[userId]);
//     console.log("token: " + tokens[userId]);
//
//     sendMessage(userId, message);
//     res.send(200);
// });
router.post('/api/v0.1/tagger', function(req, res, next) {
    console.log(req.body);
    var message = req.body.message;
    var userId = req.body.userId;
    var title = req.body.title;

    console.log("userto: " + userToGroupMap[userId]);
    console.log("token: " + tokens[userId]);

    sendMessage(userId, message, title);
    res.send(200);
});

var NaturalLanguageUnderstandingV1 = require('watson-developer-cloud/natural-language-understanding/v1.js');
var natural_language_understanding = new NaturalLanguageUnderstandingV1({
    'username': watsonConfig.naturalLanguageConfig.username,
    'password': watsonConfig.naturalLanguageConfig.password,
    'version_date': '2017-02-27'
});

router.post('/getTags', function(req, res) {
    res.send(tagString);
});

// api for getting tags from naturalLanguage understanding
router.post('/api/v0.1/get-tags', function(req, res) {
    var text = req.body.text;
    console.log(text);
    var parameters = {
        'text': text,
        'features': {
            'keywords': {
                'emotion': true,
                'sentiment': true,
                'limit': 5
            },
            'entities': {
                'emotion': true,
                'sentiment': true,
                'limit': 5
            },
            'categories': {},
            'concepts': {
                'limit': 1
            },
            'entities': {
                'sentiment': true,
                'limit': 1
            }
        }
    }
    natural_language_understanding.analyze(parameters, doIt);

    function doIt(err, response) {
        if (err)
            console.log('error:', err);
        else
            // var res = JSON.stringify(response, null, 2);
            //   console.log(response.keywords);
            tagString = JSON.stringify(response, null, 2);
        res.end(JSON.stringify(response, null, 2));
    }
    // console.log('TEXT' + text);
    // watson.naturalLanguageAPI(text, function(data) {
    //     console.log('IN THE CALLBACK');
    //     console.log(data);
    //     res.send(JSON.stringify(data));
    // });

});


// using ingoing call api to send message to the group by the user
// function sendMessage(userId, message) {
//     var request = require('request');
//     request.post(
//         'https://api.flock.co/v1/users.getPublicProfile', {
//             json: {
//                 token: tokens[userId],
//                 userId: userId
//             }
//         },
//         function(error, response, body) {
//             if (!error && response.statusCode == 200) {
//                 console.log(body)
//                 request.post(
//                     'https://api.flock.co/hooks/sendMessage/b52b6e11-f94c-494e-a08f-45de6758afc0', {
//                         json: {
//                             token: tokens[userId],
//                             to: userToGroupMap[userId],
//                             text: message,
//                             sendAs: {
//                                 name: body.firstName,
//                                 profileImage: body.profileImage
//                             }
//                         }
//                     },
//                     function(error, response, body) {
//                         if (!error && response.statusCode == 200) {
//                             console.log(body)
//                         }
//                     }
//                 );
//             }
//         }
//     );
// }
// using ingoing call api to send message to the group by the user
function sendMessage(userId, message, title) {

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
                var ts = new Date().getTime();
                request.post(
                    'https://api.flock.co/hooks/sendMessage/b52b6e11-f94c-494e-a08f-45de6758afc0', {
                        json: {
                            token: tokens[userId],
                            to: userToGroupMap[userId],
                            // uid:ts,
                            text: "",
                            sendAs: {
                                name: body.firstName,
                                profileImage: body.profileImage
                            },
                            uid: ts,
                            timestamp: ts,
                            "attachments": [{
                                "title": title,
                                "description": " ",
                                "url": "https://en.wikipedia.org/wiki/ApeScript",
                                "views": {
                                    "html": {
                                        "inline": message,
                                        "width": 400,
                                        "height": 60
                                    }
                                }
                            }]
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
