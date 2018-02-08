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
var axios = require('axios');
var emoji = require('node-emoji');
const AIRQUALITY_TOKEN = process.env.AIRQUALITY_TOKEN;
const UVINDEX_TOKEN = process.env.OPENWEATHERMAP_API_KEY;
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
    airInfo().then(r => {
      return client.replyMessage(event.replyToken, {
        type: "text",
        text: r
      })
    });
  }
  /*End !air*/
  /*air by location */
  if (!hasMatchedCommand && (event.type == 'message' && event.message.type == 'location')) {
    hasMatchedCommand = true;
    airInfo(event.message.latitude, event.message.longitude).then(r => {
      return client.replyMessage(event.replyToken, {
        type: "text",
        text: r
      })
    });
  }
  /*End air by location */
}

function airInfo(lat, lng) {
  lat = lat || 13.73;
  lng = lng || 100.5;
  return axios.all(
    [
      axios.get('https://api.waqi.info/feed/geo:' + lat + ';' + lng + '/?token=' + AIRQUALITY_TOKEN),
      axios.get('http://api.openweathermap.org/data/2.5/uvi?appid=' + UVINDEX_TOKEN + '&lat=' + lat + '&lon=' + lng)
    ]).then(axios.spread(
    (air, uv) => {
      let airData = air.data.data,
        uvindex = uv.data.value * 1,
        uvindex_warning = `${emoji.get(':white_check_mark:')} Low`,
        city = airData.city.name,
        city_url = airData.city.url,
        pm25 = parseInt(airData.iaqi.pm25.v, 10),
        temp = airData.iaqi.t.v,
        humidity = airData.iaqi.h.v,
        time = airData.time.s,
        pm25_warning = `${emoji.get(':white_check_mark:')} Good`;
      if (pm25 > 51) {
        pm25_warning = `${emoji.get(':small_orange_diamond:')} Moderate`;
      };
      if (pm25 > 101) {
        pm25_warning = `${emoji.get(':large_orange_diamond:')} Unhealthy for Sensitive Groups`;
      };
      if (pm25 > 151) {
        pm25_warning = `${emoji.get(':bangbang:')} Unhealthy`;
      };
      if (pm25 > 201) {
        pm25_warning = `${emoji.get(':sos:')} Very Unhealthy`;
      };
      if (pm25 > 300) {
        pm25_warning = `${emoji.get(':skull:')} Hazardous`;
      };
      if (uvindex > 3) {
        uvindex_warning = `${emoji.get(':small_orange_diamond:')} Moderate`;
      };
      if (uvindex > 6) {
        uvindex_warning = `${emoji.get(':large_orange_diamond:')} High`;
      };
      if (uvindex > 8) {
        uvindex_warning = `${emoji.get(':bangbang:')} Very High`;
      };
      if (uvindex > 11) {
        uvindex_warning = `${emoji.get(':sos:')} Extreme`;
      };
      return `Air Quality Index by AQICN
${emoji.get(':house:')} ${city}

${emoji.get(':vertical_traffic_light:')} PM2.5 = ${pm25} ${pm25_warning}

${emoji.get('thermometer')} ${temp}°C  Humidity = ${humidity}
${emoji.get('sunglasses')} UV Index ${uvindex} ${uvindex_warning}

Updated At ${emoji.get(':clock2:')} ${time}`;
    })).catch(err => {
    return 'API Error'
  });
}
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
