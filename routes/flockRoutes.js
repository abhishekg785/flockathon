var express = require('express');
var router = express.Router();

var flock = require('flockos');
var flockConig = require('../config/flockConfig');

flock.setAppId(flockConig.appId);
flock.setAppSecret(flockConig.appSecret);

// flock
router.use(flock.events.tokenVerifier);

router.get('/events', function(req, res) {
	res.end('<h1>Hi</h1>');
});

router.post('/events', flock.events.listener);

module.exports = router;
