var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', {'username' : 'abhishek'});
});

router.post('/', function(req, res) {
  res.end("hello");
});
module.exports = router;
