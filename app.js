/*
Sound มาเยือน
*/
require('dotenv').config()
const express = require('express');
const bodyParser = require('body-parser');
var urlencodedParser = bodyParser.urlencoded({
  extended: false
});
const line = require('@line/bot-sdk');
var CronJob = require('cron').CronJob;
var request = require('request');
var fs = require('fs');
var path = require('path');
var gfy = new(require('./gfy.js'));
gfy.init(process.env.GFY_ID, process.env.GFY_SECRET);
//================================
//        KEYS
//================================
//Line API
const config = {
  channelAccessToken: process.env.LINEACCESS,
  channelSecret: process.env.LINESECRET
};
const app = express();
app.use(express.static('public'))
app.set('port', (process.env.PORT || 5000));
app.post('/webhook', line.middleware(config), (req, res) => {
  Promise.all(req.body.events.map(handleEvent)).then(
    (result) => res.json(result), (reject) => {
      console.log('handleEvent func rejected');
      res.send('');
    });
});
const client = new line.Client(config);
const redis = require("redis");
var redisClient;
if (app.get('env') == 'development') {
  redisClient = redis.createClient();
} else {
  redisClient = redis.createClient(process.env.REDISCLOUD_URL, {
    no_ready_check: true
  });
}

function handleEvent(event) {
  //console.log('--- handleEvent ---');
  //console.log(event);
  //!สล
  var hasMatchedCommand = false;
  if (!hasMatchedCommand && (event.type !== 'message' || event.message.type !== 'text')) {
    hasMatchedCommand = true;
    return Promise.resolve(null);
  }
  //!rain - jpg
  if (!hasMatchedCommand && (event.type == 'message' && event.message.text == '!rain')) {
    hasMatchedCommand = true;
    console.log('gfy img stat ' + gfy.imgStat);
    if (gfy.imgStat == 'error') {
      return client.replyMessage(event.replyToken, {
        "type": "text",
        "text": "ไม่สามารถ load รูปได้ รบกวนไปดูเองที่\r\nhttp://203.155.220.231/Radar/pics/nkzfiltered.jpg"
      });
    } else {
      return client.replyMessage(event.replyToken, {
        "type": "image",
        "originalContentUrl": gfy.imgUrl,
        "previewImageUrl": gfy.imgTmb
      });
    }
  }
  //!rainvid
  if (!hasMatchedCommand && (event.type == 'message' && event.message.text == '!rainvid')) {
    hasMatchedCommand = true;
    console.log('gfy vid stat ' + gfy.vidStat);
    if (gfy.vidStat == 'error') {
      return client.replyMessage(event.replyToken, {
        "type": "text",
        "text": "ไม่สามารถ load gif ได้ รบกวนไปดูเองที่\r\nhttp://203.155.220.231/Radar/pics/nkradar.gif"
      });
    } else {
      return client.replyMessage(event.replyToken, {
        "type": "video",
        "originalContentUrl": gfy.vidUrl,
        "previewImageUrl": (gfy.imgStat == 'error') ? gfy.vidTmb : gfy.imgTmb
      })
    }
  }
  //!solve <text>
  if (event.message.text) {
    var txt = event.message.text.trim().toLowerCase();
    if (!hasMatchedCommand && txt.indexOf('!solve') == 0) {
      hasMatchedCommand = true;
      txt = txt.replace('!solve', '');
      request.get('https://api.wolframalpha.com/v1/simple?i=' + encodeURIComponent(txt) + '&appid=WYLR8V-YQWE8APE6A', {
        encoding: 'binary'
      }, function (err, response, body) {
        if (body.length < 100) {
          return client.replyMessage(event.replyToken, {
            "type": "text",
            "text": ";)*"
          });
        } else {
          var solveImg = 'solve_' + (new Date().getTime()) + '.png';
          fs.writeFile(path.join(process.cwd(), '/./public/', solveImg), body, 'binary', function (err) {
            if (err) return reject('');
            return client.replyMessage(event.replyToken, {
              "type": "image",
              "originalContentUrl": 'https://linerain.herokuapp.com/' + solveImg,
              "previewImageUrl": 'https://linerain.herokuapp.com/' + solveImg
            })
          });
        }
      });
    }
  }
  // end solve
  //!log
  if (!hasMatchedCommand && (event.type == 'message' && event.message.text == '!log')) {
    hasMatchedCommand = true;
    console.log('--- event ---');
    console.log(event);
    return Promise.resolve(null);
  }
  // end log
  /*!sound*/
  if (!hasMatchedCommand && (event.type == 'message' && event.message.text == '!sound')) {
    hasMatchedCommand = true;
    var resTxt = '#Next race IRONMAN Gurye 10.09.17';
    return client.replyMessage(event.replyToken, {
      "type": "text",
      "text": resTxt
    })
  }
  /*End !sound*/
};
// change service from Cloudinary to Gfycat
new CronJob('56 1,11,21,31,41,51 * * * *', fetchImageAndVidFromGfy, null, true, 'Asia/Bangkok');

function fetchImageAndVidFromGfy() {
  console.log('You will see this message every 11 mins');
  gfy.genWeatherImgAndVid().then(r => {
    console.log('done process img/gif');
  });
}
fetchImageAndVidFromGfy();
app.get("*", function (req, res) {
  res.send("Ong Line Bot");
});
//Heroku setting
app.listen(app.get('port'), function () {
  console.log('Node app is running on port', app.get('port'));
});
// self prevent sleep every 10 mins
var sleepCron = new CronJob({
  cronTime: '0 0,10,20,30,40,50 * * * *',
  onTick: function () {
    var http = require('http');
    http.get('http://linerain.herokuapp.com/');
    console.log('-- prevent sleep cron --');
  },
  start: true,
  timeZone: 'Asia/Bangkok',
  runOnInit: true
});
