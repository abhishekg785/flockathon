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

var Globals = {
  moodCategory: ['emotion_tone', 'language_tone', 'social_tone'],
  moodIDArr: ['anger', 'disgust', 'fear', 'joy', 'sadness']
}

module.exports = {

  toneAnalyzerAPI: function(data, callback) {
    var snappedMood = [];
    data = data.join("\n");
    console.log('Data ' + data);
    tone_analyzer.tone({
        text: data
      },
      function(err, tone) {
        if (err)
          console.log(err);
        else
          // console.log(JSON.stringify(tone, null, 2));
          // console.log(tone.document_tone['tone_categories'][0]);
          var emotionArr = tone.document_tone['tone_categories'][0];
        var emotionTonesArr = emotionArr['tones'];
        // console.log(emotionTonesArr);
        emotionTonesArr.forEach(function(data) {
          // console.log(data);
          if (data.score > 0.5) {
            // console.log(data.tone_id);
            snappedMood.push(data.tone_name);
            // console.log(snappedMood);
          }
        });
        callback(snappedMood);
      });
    // global.io.emit('mood detect', {'mood' : JSON.stringify(snappedMood)});
  },

  naturalLanguageAPI: function(data, callback) {
    console.log('calling natural language api');
    var sendText;
    console.log(typeof(data));
    if(typeof(data) != 'object') {
      sendText = data;
    }
    else {
      console.log('Came here');
      sendText = data[data.length-1];
    }
    console.log(sendText);
    var parameters = {
      'text': sendText,
      // 'features': {
      //   'entities': {
      //     'emotion': true,
      //     'sentiment': true,
      //     'limit': 5
      //   },
      //   'keywords': {
      //     'emotion': true,
      //     'sentiment': true,
      //     'limit': 5
      //   }
      // }
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
    natural_language_understanding.analyze(parameters, function(err, response) {
      if (err)
        console.log('error:', err);
      else
        // var res = JSON.stringify(response, null, 2);
        console.log(JSON.stringify(response));
      // console.log(response);
      callback(response);
    });
  }
}
