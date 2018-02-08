/*
Sound มาเยือน
*/
'use strict';
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
var moment = require('moment');
// var mongoose = require('mongoose');
var rp = require('request-promise-native');
var emoji = require('node-emoji');

const AIRQUALITY_TOKEN = process.env.AIRQUALITY_TOKEN;
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
      console.log(reject)
      res.send('');
    });
});
const client = new line.Client(config);
// const redis = require("redis");
// var redisClient;
// if (app.get('env') == 'development') {
//   redisClient = redis.createClient();
// } else {
//   redisClient = redis.createClient(process.env.REDISCLOUD_URL, {
//     no_ready_check: true
//   });
// }
////////////////////
// MONGO DB by mLab via mongoose
////////////////////
// mongoose.Promise = global.Promise;
// var uristring = process.env.MONGODB_URI;
// mongoose.connect(uristring, { useMongoClient: true, promiseLibrary: global.Promise });
// var db = mongoose.connection;
// db.on('error', console.error.bind(console, 'connection error:'));
// db.once('open', function() {
//   console.log("Successfully connected to mLab Mongo DB.")
// });


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
  /*!air */
  if (!hasMatchedCommand && (event.type == 'message' && event.message.text == '!air')) {
    hasMatchedCommand = true;
    var airOptions = {
      uri: 'https://api.waqi.info/feed/geo:13.73;100.54/',
      qs: {
          token: AIRQUALITY_TOKEN // -> uri + '?token=xxxxx%20xxxxx'
      },
      headers: {
          'User-Agent': 'Request-Promise'
      },
      json: true
    };
    rp(airOptions).then(function(r){
      let city = r.data.city.name,
          city_url = r.data.city.url,
          pm25 = parseInt(r.data.iaqi.pm25.v,10),
          temp = r.data.iaqi.t.v,
          humidity = r.data.iaqi.h.v,
          time = r.data.time.s,
          pm25_warning = "\u2705Good";

      if(pm25 > 51) {
        pm25_warning = "\u1F536Moderate";
      } else if (pm25 > 101){
        pm25_warning = "\u2049Unhealthy for Sensitive Groups";
      } else if (pm25 > 151){
        pm25_warning = "\u203CUnhealthy";
      }else if (pm25 > 201){
        pm25_warning = "\u1F6ABVery Unhealthy";
      }else if (pm25 > 300){
        pm25_warning = "\u2623Hazardous";
      };

      return client.replyMessage(event.replyToken, {
        type : "text",
        text : 
`Air Quality Index by AQICN
${emoji.get(':house:')}${city}
\u1F32BPM2.5 = ${pm25}
${pm25_warning}
\u1F321 ${temp} °C Humidity = ${humidity}

Updated At \uDBC0\uDC84${time}`
      });
    })
    .catch(function(err){
      return client.replyMessage(event.replyToken, {
        type : "text",
        text : "API Call to AQICN Error"
      });
    });
    };
  
  /*End !air*/
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
// // self prevent sleep every 10 mins
// var sleepCron = new CronJob({
//   cronTime: '0 0,10,20,30,40,50 * * * *',
//   onTick: function () {
//     var http = require('http');
//     http.get('http://linerain.herokuapp.com/');
//     console.log('-- prevent sleep cron --');
//   },
//   start: true,
//   timeZone: 'Asia/Bangkok',
//   runOnInit: true
// });
