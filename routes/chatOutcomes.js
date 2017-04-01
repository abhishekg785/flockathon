// handles the chat outcomes
var express = require('express');
var router = express.Router();

router.get('/outcomes', (req, res) => {
  res.render('chatOutcomes');
});

module.exports = router;
