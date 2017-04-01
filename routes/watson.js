// contains all the routes for the watson api
var watson = require('watson-developer-cloud');
var watsonConfig = require('../config/watsonConfig');

var tone_analyzer = watson.tone_analyzer({
  username: watsonConfig.toneAnalyzerConfig.username,
  password: watsonConfig.toneAnalyzerConfig.password,
  version: 'v3',
  version_date: '2016-05-19 '
});

var NaturalLanguageUnderstandingV1 = require('watson-developer-cloud/natural-language-understanding/v1.js');
var natural_language_understanding = new NaturalLanguageUnderstandingV1({
  'username': watsonConfig.naturalLanguageConfig.username,
  'password': watsonConfig.naturalLanguageConfig.password,
  'version_date': '2017-02-27'
});

module.exports = {

  toneAnalyzerAPI: function(data) {
    console.log(data);
    data = data.join(". ");
    tone_analyzer.tone({
        text: data
      },
      function(err, tone) {
        if (err)
          console.log(err);
        else
          console.log(JSON.stringify(tone, null, 2));
      });
  },

  naturalLanguageAPI: function(data) {
    var parameters = {
      'text': 'facebook is awesome',
      'features': {
        'entities': {
          'emotion': true,
          'sentiment': true,
          'limit': 2
        },
        'keywords': {
          'emotion': true,
          'sentiment': true,
          'limit': 2
        }
      }
    }
    natural_language_understanding.analyze(parameters, function(err, response) {
      if (err)
        console.log('error:', err);
      else
        console.log(JSON.stringify(response, null, 2));
    });
  }
}
