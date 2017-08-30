/*
Sound มาเยือน
*/
require('dotenv').config()
const express = require('express');
const bodyParser = require('body-parser');
var urlencodedParser = bodyParser.urlencoded({
  extended: false
});
const redis = require("redis");
var redisClient = redis.createClient(process.env.REDISCLOUD_URL, {
  no_ready_check: true
});
const line = require('@line/bot-sdk');
var CronJob = require('cron').CronJob;
var cloudinary = require('cloudinary'); //gif to mp4
var htmlparser = require("htmlparser2");//ไว้ parse ผลหวย
var request = require('request');
var fs = require('fs');
var path = require('path');
var utmbRunner = require('./utmbrunner.js');
var utmbImg = require('./utmbimg.js');
var utmbVideo = require('./utmbVideo.js');
//================================
//        KEYS
//================================
//Convert GIF to MP4
var cloudconvert = new (require('cloudconvert'))(process.env.CLOUDCONVERT);
//Line API
const config = {
  channelAccessToken: process.env.LINEACCESS,
  channelSecret: process.env.LINESECRET
};
//Cloudinary GIF to MP4
cloudinary.config({ 
  cloud_name: process.env.CLOUDINARY_NAME, 
  api_key: process.env.CLOUDINARY_KEY, 
  api_secret: process.env.CLOUDINARY_SECRET 
});
//================================
 
//================================
//  OPTIONS
//================================

const app = express();
app.use(express.static('public'))
app.set('port', (process.env.PORT || 5000));



app.post('/webhook', line.middleware(config), (req, res) => {
  Promise
    .all(req.body.events.map(handleEvent))
    .then(
      (result) => res.json(result),
      (reject)=>{
        console.log('handleEvent func rejected');
        res.send('');
      }
    );
});

app.post('/fb', bodyParser.urlencoded({
  extended: true
}), (req, res) => {
  if (req.body.fbId && req.body.fbToken && req.body.fbId == process.env.EXPECTED_FB_ID) {
    request.get("https://graph.facebook.com/oauth/access_token?grant_type=fb_exchange_token&client_id=" + process.env.FB_APP_ID + "&client_secret=" + process.env.FB_APP_SECRET + "&fb_exchange_token=" + req.body.fbToken, function (err, response, body) {
      var ret = JSON.parse(body);
      if (!ret.error) {
        console.log('-- saving fb long token --');
        redisClient.set('fbToken', ret.access_token, 'EX', ret.expires_in - 60 * 60);
        fbCron.start();
      }
      res.send('ok');
    });
  } else {
    res.send('ok');
  }
});
const client = new line.Client(config);
var url_radarvid = "";
var url_radar240 = "";
var url_radar800 = "";

function handleEvent(event) {
  //console.log('--- handleEvent ---');
  //console.log(event);
  //!สล
  var hasMatchedCommand = false;
  if(!hasMatchedCommand && (event.type == 'message' && event.message.type == 'location')){
    hasMatchedCommand = true;
    di2suanlum(event.message.latitude, event.message.longitude).then(
      resp => {
        return client.replyMessage(event.replyToken, [
          {
          "type": "text",
          "text": 'ขับรถไปสวนลุม :: '+resp.txt
          },{
            "type": "image",
            "originalContentUrl": 'https://linerain.herokuapp.com/'+resp.img,
            "previewImageUrl": 'https://linerain.herokuapp.com/'+resp.img
          }
        ])
      },
      rej => { return Promise.resolve(null) }
    );
  }
  if (!hasMatchedCommand && (event.type !== 'message' || event.message.type !== 'text')) {
    hasMatchedCommand = true;
    return Promise.resolve(null);
  }
  //!demo - jpg
  if (!hasMatchedCommand && (event.type == 'message' && event.message.text == '!demo')){ 
    hasMatchedCommand = true;
  var message = {
    "type": "template",
    "altText": "ตัวอย่าง ตัวอย่าง",
    "template": {
      "type": "buttons",
      "text": "ตัวอย่าง ตัวอย่าง",
      "thumbnailImageUrl":"https://linerain.herokuapp.com/radar.jpg",
      "actions": [{
        "type": "uri",
        "label": "เปิดดู google",
        "uri": "http://google.com"
      },{
        "type": "uri",
        "label": "เปิดดู facebook",
        "uri": "http://facebook.com"
      }]
    }
  };
    return client.replyMessage(event.replyToken, message);
  }
  //!rain - jpg
  if (!hasMatchedCommand && (event.type == 'message' && event.message.text == '!rain')){ 
    hasMatchedCommand = true;
    return client.replyMessage(event.replyToken, {
      "type": "image",
      "originalContentUrl": url_radar800.secure_url,
      "previewImageUrl": url_radar240.secure_url
    })
  }
    //!rainvid
  if (!hasMatchedCommand && (event.type == 'message' && event.message.text == '!rainvid')){ 
    hasMatchedCommand = true;
    return client.replyMessage(event.replyToken, {
      "type": "video",
      "originalContentUrl": url_radarvid.secure_url.replace(".gif", ".mp4"),
      "previewImageUrl": url_radar240.secure_url
    })
  }
  
//!lotto <lottoNum>
if (event.message.text) {
  var lottoParam = event.message.text.trim().replace(/\s\s+/g, ' ').toLowerCase().split(' ');
  if (!hasMatchedCommand && (lottoParam[0] == '!lotto' || lottoParam[0] == '!หวย')) {
    hasMatchedCommand = true;
    lottoResult(lottoParam[1]).then(resolve => {
      console.log('-- lottoResult --');
      console.log(resolve);
      var resTxt = '';
      if (resolve.res && resolve.res.length > 0) {
        resTxt = lottoParam[1] + ':: ถูกรางวัล ';
        for (var i in resolve.res) {
          resTxt += (resolve.res[i].message + ' มูลค่า ' + resolve.res[i].prize + ' บาท ');
        }
      }
      if (resolve.res && resolve.res.length==0 && resolve.remark) resTxt = lottoParam[1] + ' :: ' + resolve.remark;
      if (resTxt != '') {
        return client.replyMessage(event.replyToken, {
          "type": "text",
          "text": resTxt
        })
      } else {
        return Promise.resolve(null)
      }
    });
  }
}
// end lotto
  
  //!ฝากบอก <text>
  if(event.message.text){
  var lottoParam = event.message.text.trim().replace(/\s\s+/g, ' ').toLowerCase().split(' ');
    if (!hasMatchedCommand && (lottoParam[0] == '!ฝากบอก')) {
      hasMatchedCommand = true;
      var txt=event.message.text.replace('!ฝากบอก ','');
      return client.pushMessage(process.env.LINE_PAGER_ID, {
        type: 'text',
        'text': txt
      });
    }
  }
  // end ฝากบอก
//UTMB RUNNER
  //!utmb <bib>
if(event.message.text){
var lottoParam = event.message.text.trim().replace(/\s\s+/g, ' ').toLowerCase().split(' ');
  if (!hasMatchedCommand && (lottoParam[0] == '!utmb')) {
    hasMatchedCommand = true;
    var bib=event.message.text.replace('!utmb ','');
    utmbRunner(bib, function(err,runner){
       if(err){
         console.log(err);
       } else {
         return client.replyMessage(event.replyToken, {
           type: 'text',
           'text': runner
          });
        }
    });
  }
};
  // end UTMB RUNNER

//UTMB VIDEO
  //!utmbvid <bib>
if(event.message.text){
var lottoParam = event.message.text.trim().replace(/\s\s+/g, ' ').toLowerCase().split(' ');
  if (!hasMatchedCommand && (lottoParam[0] == '!utmbvid')) {
    hasMatchedCommand = true;
    var bib=event.message.text.replace('!utmbvid ','');
         return client.replyMessage(event.replyToken, {
	      "type": "video",
	      "originalContentUrl": utmbVideo(bib),
	      "previewImageUrl": ""
          });
        }
    });
  }
};
  // end UTMB VIDEO	
	
//UTMBimg - SCREENSHOT
	
  //!utmbimg <bib>
if(event.message.text){
var lottoParam = event.message.text.trim().replace(/\s\s+/g, ' ').toLowerCase().split(' ');
  if (!hasMatchedCommand && (lottoParam[0] == '!utmbimg')) {
    hasMatchedCommand = true;
    var bib=event.message.text.replace('!utmbimg ','');
    utmbImg(bib, function(err,runnerImg){
       if(err){
         console.log(err);
       } else {
         return client.replyMessage(event.replyToken, {
            "type": "image",
            "originalContentUrl": 'https://linerain.herokuapp.com/'+runnerImg,
            "previewImageUrl": 'https://linerain.herokuapp.com/'+runnerImg
          });
        }
    });
  }
};
//END OF UTMBimg - SCREENSHOT
  
  //!sticker <text>
  if(event.message.text){
  var txt = event.message.text.trim().toLowerCase();
    if (!hasMatchedCommand && txt.indexOf('!sticker')==0) {
      hasMatchedCommand = true;
      txt=txt.replace('!sticker','');
      request.get('http://chaichana.org/linebot/sticker.php?txt='+encodeURIComponent(txt),{
        encoding: 'binary'
      }, function (err, response, body) {
        var stickerImg = 'sticker_'+(new Date().getTime()) + '.png';
        fs.writeFile(path.join(process.cwd(), '/./public/', stickerImg), body, 'binary', function (err) {
          if (err) return reject('');
          return client.replyMessage(event.replyToken, {
            "type": "image",
            "originalContentUrl": 'https://linerain.herokuapp.com/'+stickerImg,
            "previewImageUrl": 'https://linerain.herokuapp.com/'+stickerImg
          })
        });
      });
    }
  }
  // end sticker
	
  //!buff1 <text>
  if(event.message.text){
  var txt = event.message.text.trim();
    if (!hasMatchedCommand && txt.indexOf('!buff1')==0) {
      hasMatchedCommand = true;
      txt=txt.replace('!buff1','');
      request.get('http://chaichana.org/linebot/buffPlain.php?txt='+encodeURIComponent(txt),{
        encoding: 'binary'
      }, function (err, response, body) {
        var stickerImg = 'buff1_'+(new Date().getTime()) + '.png';
        fs.writeFile(path.join(process.cwd(), '/./public/', stickerImg), body, 'binary', function (err) {
          if (err) return reject('');
          return client.replyMessage(event.replyToken, {
            "type": "image",
            "originalContentUrl": 'https://linerain.herokuapp.com/'+stickerImg,
            "previewImageUrl": 'https://linerain.herokuapp.com/'+stickerImg
          })
        });
      });
    }
  }
  // end buff1
  //!buff2 <text>
  if(event.message.text){
  var txt = event.message.text.trim();
    if (!hasMatchedCommand && txt.indexOf('!buff2')==0) {
      hasMatchedCommand = true;
      txt=txt.replace('!buff2','');
      request.get('http://chaichana.org/linebot/buffMoutain.php?txt='+encodeURIComponent(txt),{
        encoding: 'binary'
      }, function (err, response, body) {
        var stickerImg = 'buff2_'+(new Date().getTime()) + '.png';
        fs.writeFile(path.join(process.cwd(), '/./public/', stickerImg), body, 'binary', function (err) {
          if (err) return reject('');
          return client.replyMessage(event.replyToken, {
            "type": "image",
            "originalContentUrl": 'https://linerain.herokuapp.com/'+stickerImg,
            "previewImageUrl": 'https://linerain.herokuapp.com/'+stickerImg
          })
        });
      });
    }
  }
  // end buff2
	
  //!log
  if (!hasMatchedCommand && (event.type == 'message' && event.message.text == '!log')){ 
    hasMatchedCommand = true;
    console.log('--- event ---');
    console.log(event);
    return Promise.resolve(null);
  }
  // end log
	
  /*!sound*/
  if (!hasMatchedCommand && (event.type == 'message' && event.message.text == '!sound')){ 
    hasMatchedCommand = true;
	var resTxt='#Next race IRONMAN Gurye 10.09.17';
	return client.replyMessage(event.replyToken, {
    "type": "text",
    "text": resTxt
  })
  }
  /*End !sound*/
   
};

//ตรวจหวย
function lottoResult(lottoNum) {
  return new Promise((resolve, reject) => {
    lottoNum += '';
    lottoNum = lottoNum.trim();
    var res = [];
    if (isNaN(lottoNum) || lottoNum.length != 6) {
      resolve([]);
      return;
    }
    var dd = new Date();
    var ldate = (dd.getDate() < 16 ? '01' : '16') + ('0' + (dd.getMonth() + 1)).slice(-2) + (dd.getFullYear() + 543);
    redisClient.get('lottoRes' + ldate, function (err, _lottoRes) {
      if (err) {
        resolve([]);
        return;
      }
      lottoRes = JSON.parse(_lottoRes);
      var isResultComplete=(_lottoRes.indexOf('x')<0);
      var totalNoResult=(_lottoRes.match(/xxxxxx/g) || []).length;
      var remark=(totalNoResult==168)?'หวยยังไม่ออกจ้า':'ลุ้นต่อ หวยยังออกไม่ครบ';
      for (var i in lottoRes.prize) {
        if (lottoRes.prize[i].indexOf(lottoNum) >= 0) {
          res.push(lottoRes.wording[i]);
        }
      }
      //first 3
      var chk = lottoNum.substring(0, 3);
      if (lottoRes.prize['prize_first3'].indexOf(chk) >= 0) {
        res.push(lottoRes.wording['prize_first3']);
      }
      //last 3
      var chk = lottoNum.substring(3);
      if (lottoRes.prize['prize_last3'].indexOf(chk) >= 0) {
        res.push(lottoRes.wording['prize_last3']);
      }
      //last 2
      chk = chk.substring(1);
      if (lottoRes.prize['prize_last2'].indexOf(chk) >= 0) {
        res.push(lottoRes.wording['prize_last2']);
      }
      if (res.length == 0 && isResultComplete){
	  res.push({
            message: 'หวยแดก',
            prize: '0'
          });
      }
      if(isResultComplete)
        resolve({'res':res});
      else
        resolve({'res':res,'remark':remark});
    });
  });
}

// map to สวนลุม

function di2suanlum(lat, lng) {
  return new Promise((resolve, reject) => {
    var diTxt, diImg;
    request.get("https://maps.googleapis.com/maps/api/directions/json?origin=" + lat + ',' + lng + "&destination=13.732587,100.545527&key=AIzaSyDJQ3f8DxNjNkokV7T5PoV-EA1_iUUFCw8&language=th&departure_time=now", function (err, response, body) {
      if (err) return reject('');
      var ret = JSON.parse(body);
      if (ret.routes.length == 0) return reject('');
      if(ret.routes[0].legs[0].duration){
        diTxt = ret.routes[0].legs[0].duration.text + ', ' + ret.routes[0].legs[0].distance.text;
      }
      if(ret.routes[0].legs[0].duration_in_traffic){
        diTxt = ret.routes[0].legs[0].duration_in_traffic.text + ', ' + ret.routes[0].legs[0].distance.text;
      }
      request.get('https://maps.googleapis.com/maps/api/staticmap?size=600x600&key=AIzaSyDJQ3f8DxNjNkokV7T5PoV-EA1_iUUFCw8&markers=color:crimson%7C13.732587,100.545527&path=enc:' + ret.routes[0].overview_polyline.points, {
        encoding: 'binary'
      }, function (err, response, body) {
        if (err) return reject('');
        diImg = (new Date().getTime()) + '.png';
        fs.writeFile(path.join(process.cwd(), '/./public/', diImg), body, 'binary', function (err) {
          if (err) return reject('');
          return resolve({
            'txt': diTxt,
            'img': diImg
          });
        });
      });
    });
  });
}
//Upload Radar Images to CLOUDINARY every 11th min 
new CronJob('56 1,11,21,31,41,51 * * * *', fetchImageAndVid, null, true, 'Asia/Bangkok');
function fetchImageAndVid() { // sec min hr
    console.log('You will see this message every 11 mins');
    //DELETE OLD IMAGES & VID
    console.log('!!!!!Begin DELETE of old images & video!!!!!')
    cloudinary.v2.uploader.destroy('url_radar240.public_id', 
    {invalidate: true }, function(error, result) {console.log(result)});
    cloudinary.v2.uploader.destroy('url_radar800.public_id', 
    {invalidate: true }, function(error, result) {console.log(result)});
    cloudinary.v2.uploader.destroy('url_radarvid.public_id', 
    {invalidate: true }, function(error, result) {console.log(result)});
    console.log('>>>>>Begin DOWNLOADING new images<<<<<')
    //UPLOAD GIF TO CLOUDINARY
    cloudinary.v2.uploader.upload("http://203.155.220.231/Radar/pics/nkradar.gif",{public_id: "radarvid", use_filename: true, unique_filename : true}, function(error, result) { 
      if(error){
        console.log("=====GIF UPLOADED FAILED ?!? =====")
        console.log(error);
        return;
      }
      console.log("=====GIF UPLOADED=====")
      if(result){
        url_radarvid = result;
      }

//      url_radarvid = result.secure_url.replace(".gif", ".mp4");
    });
    //UPLOAD Img & Resize to 800x800
    cloudinary.v2.uploader.upload("http://203.155.220.231/Radar/pics/nkzfiltered.jpg", {width:800, height: 800, crop: "scale", public_id: "radar800", use_filename: true, unique_filename : true}, function(error, result) { 
    console.log("=====IMAGE 800 UPLOADED=====")
      if(result){
        url_radar800 = result;
      }
//    url_radar800 = result.secure_url;
    });
    //UPLOAD Img & Resize to 240x240
    cloudinary.v2.uploader.upload("http://203.155.220.231/Radar/pics/nkzfiltered.jpg", {width:240, height: 240, crop: "scale", public_id: "radar240", use_filename: true, unique_filename : true}, function(error, result) { 
    console.log("=====IMAGE 240 UPLOADED=====")
      if(result){
        url_radar240 = result;
      }
//    url_radar240 = result.secure_url;
    });
        
}
fetchImageAndVid();
app.get("*", function(req,res){
    res.send("Ong Line Bot");
});

//c9.io setting
//app.listen(process.env.PORT, process.env.IP, function(){
//    console.log("Server has started!");
//})

//Heroku setting
app.listen(app.get('port'), function() {
  console.log('Node app is running on port', app.get('port'));
});
  //var lottoRes = {"prize":{"prize_1":"756519","prize_2":["041938","173091","042845","062174","219884"],"prize_3":["267271","275503","395048","632363","007796","946999","484725","878635","569285","083769"],"prize_4":["563783","062733","039972","491283","420988","134990","520884","892796","325835","251024","137645","163593","459671","516477","468365","069686","093823","020121","344126","359454","131825","752516","662429","551240","682387","057379","661963","506953","138420","902349","382981","837031","673149","935699","854714","681124","041809","799366","618387","571436","179457","959667","713643","965006","946172","331560","930813","167502","988721","929369"],"prize_5":["007542","485463","638123","601114","679839","292585","617811","668434","900336","863341","371905","166751","642022","753076","833905","438244","833531","328828","149705","791628","054209","785644","743496","370208","698212","275428","204511","206021","182409","065139","445313","557057","550918","010147","355296","351045","404835","807351","210536","802362","668513","508349","287935","610782","833125","443565","829636","089115","898319","094111","627599","185188","114932","913713","750766","878853","162885","591519","507291","420506","685955","169235","059828","572490","082779","712843","317127","220342","765988","609875","712284","509567","883974","061881","747385","357270","430714","840855","109888","629873","421124","924989","692935","512441","903764","163973","736364","536854","975039","082194","730527","280009","795262","615146","189725","743123","850989","576528","726550","323603"],"prize1_close":["756518","756520"],"prize_last2":"36","prize_last3":["787","989"],"prize_first3":["061","386"]},"wording":{"prize_1":{"message":"\u0e17\u0e35\u0e48 1","prize":"3,000,000"},"prize_2":{"message":"\u0e17\u0e35\u0e48 2","prize":"100,000"},"prize1_close":{"message":"\u0e02\u0e49\u0e32\u0e07\u0e40\u0e04\u0e35\u0e22\u0e07\u0e23\u0e32\u0e07\u0e27\u0e31\u0e25\u0e17\u0e35\u0e48 1","prize":"50,000"},"prize_3":{"message":"\u0e17\u0e35\u0e48 3","prize":"40,000"},"prize_4":{"message":"\u0e17\u0e35\u0e48 4","prize":"20,000"},"prize_5":{"message":"\u0e17\u0e35\u0e48 5","prize":"10,000"},"prize_first3":{"message":"\u0e40\u0e25\u0e02\u0e2b\u0e19\u0e49\u0e32 3 \u0e15\u0e31\u0e27","prize":"2,000"},"prize_last3":{"message":"\u0e40\u0e25\u0e02\u0e17\u0e49\u0e32\u0e22 3 \u0e15\u0e31\u0e27","prize":"2,000"},"prize_last2":{"message":"\u0e40\u0e25\u0e02\u0e17\u0e49\u0e32\u0e22 2 \u0e15\u0e31\u0e27","prize":"1,000"}}};


function FBaggregator() {
  //console.log('-- fbCron --');
  console.log(new Date());
  redisClient.get('fbToken', function (err, fbToken) {
    if (err) {
      console.log('redis error');
      return false;
    }
    if (typeof fbToken == 'undefined' || !fbToken) {
      console.log('fbToken is empty');
      return false;
    }
    request.get("https://graph.facebook.com/v2.10/219520224912468/feed?fields=message,permalink_url,updated_time,created_time,full_picture&limit=30&access_token=" + fbToken, function (err, response, body) {
      if (err) {
        console.log(err);
        return;
      }
      var ret = JSON.parse(body);
      if (ret.data) ret.data.forEach(processSalePost);
      if (ret.error) {
        client.pushMessage(process.env.LINE_NOTIFY_ID, {
          type: 'text',
          'text': 'graph api ร่วง'
        });
        fbCron.stop();
      }
    });
  });
}/*
var fbCron = new CronJob({
  cronTime: '0,30 * * * * *',
  onTick: FBaggregator,
  start: true,
  timeZone: 'Asia/Bangkok',
  runOnInit: true
});
*/
function processSalePost(o) {
  var uId = 'sale.' + o.id + '.' + new Date(o.created_time).getTime();
  var message = {
    "type": "template",
    "altText": "",
    "template": {
      "type": "buttons",
      "text": "",
      "actions": [{
        "type": "uri",
        "label": "เปิดดู",
        "uri": ""
      }]
    }
  };
  var msg = o.message.split('\n');
  if (!msg[1]) return;
  if (msg[0].indexOf('ตั้งรับ') >= 0 || msg[0].indexOf('ขายแล้ว') >= 0 || msg[0].toLowerCase().indexOf('sold') >= 0) return;
  if (msg[1].indexOf('฿') < 0 && msg[1].indexOf('FREE') < 0) return;
  message.altText = message.template.text = msg[0] + ' - ' + msg[1].split(' ')[0];
  if (o.permalink_url) message.template.actions[0].uri = o.permalink_url;
  if (o.full_picture) message.template.thumbnailImageUrl = o.full_picture
  redisClient.get(uId, function (err, uIdVal) {
    if (err) {
      console.log('redis error');
      return false;
    }
    if (typeof uIdVal == 'undefined' || !uIdVal) {
      console.log(uId);
      console.log(message);
      client.pushMessage(process.env.LINE_SALE_POST_NOTI_TARGET, message);
      redisClient.set(uId, 1, 'EX', 7 * 24 * 60 * 60);
    }
  });
}

function fetchLottoRes() {
  return new Promise((resolve, reject) => {
    console.log('--- lottoCron ---');
    var dd = new Date();
    var ldate = (dd.getDate() < 16 ? '01' : '16') + ('0' + (dd.getMonth() + 1)).slice(-2) + (dd.getFullYear() + 543);
    redisClient.get('lottoRes' + ldate, function (err, lottoRes) {
      if (err) reject('');
      if (typeof lottoRes == 'undefined' || !lottoRes || lottoRes.indexOf('x') >= 0) {
        console.log('--- fetching lotto result ---');
        request.get('http://news.sanook.com/lotto/check/' + ldate + '/?foo=' + Math.random(), (err, resp, body) => {
          if (err) console.log('error');
          var _res = body.substring(body.indexOf('lottoResult =') + 13, body.indexOf('lottoResult =') + 2500);
          _res = _res.substring(0, _res.indexOf(';')).trim();
          redisClient.set('lottoRes' + ldate, _res, 'EX', 60 * 60 * 24 * 16);
          resolve(_res);
        });
      }else{
        resolve(lottoRes);
      }
    });
  });
}
var lottoCron = new CronJob({
  cronTime: '0 * 0,12-16 1,16 * *',
  onTick: fetchLottoRes,
  start: true,
  timeZone: 'Asia/Bangkok',
  runOnInit: true
});
