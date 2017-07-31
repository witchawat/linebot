require('dotenv').config()
const express = require('express');
const line = require('@line/bot-sdk');
var CronJob = require('cron').CronJob;
var cloudinary = require('cloudinary'); //gif to mp4
var htmlparser = require("htmlparser2");//ไว้ parse ผลหวย
var request = require('request');
var fs = require('fs');
var path = require('path');
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
        /*
        var pushTo=event.source.userId;
        if(event.source.roomId)pushTo=event.source.roomId;
        if(event.source.groupId)pushTo=event.source.groupId;
        client.pushMessage(pushTo, {
          "type": "text",
          "text": 'ขับรถไปสวนลุม :: '+resp.txt
        }).then(()=>{
          return client.pushMessage(pushTo, {
            "type": "image",
            "originalContentUrl": 'https://linerain.herokuapp.com/'+resp.img,
            "previewImageUrl": 'https://linerain.herokuapp.com/'+resp.img
          });
        });
        */
      },
      rej => { return Promise.resolve(null) }
    );
  }
  if (!hasMatchedCommand && (event.type !== 'message' || event.message.type !== 'text')) {
    hasMatchedCommand = true;
    return Promise.resolve(null);
  }
  //!rain - jpg
  if (!hasMatchedCommand && (event.type == 'message' && event.message.text == '!rain')){ 
    hasMatchedCommand = true;
    return client.replyMessage(event.replyToken, {
      "type": "image",
      "originalContentUrl": url_radar800,
      "previewImageUrl": url_radar240
    })
  }
    //!rainvid
  if (!hasMatchedCommand && (event.type == 'message' && event.message.text == '!rainvid')){ 
    hasMatchedCommand = true;
    return client.replyMessage(event.replyToken, {
      "type": "video",
      "originalContentUrl": url_radarvid,
      "previewImageUrl": url_radar240
    })
  }
  
  //!lotto <lottoNum>
  if(event.message.text){
  var lottoParam = event.message.text.trim().replace(/\s\s+/g, ' ').toLowerCase().split(' ');
  if (!hasMatchedCommand && (lottoParam[0] == '!lotto' || lottoParam[0] == '!หวย')) {
    hasMatchedCommand = true;
    lottoResult(lottoParam[1]).then(resolve => {
      if (resolve != '') {
        return client.replyMessage(event.replyToken, {
          "type": "text",
          "text": resolve
        })
      };
    });
  }
  }
  // end lotto
};

//ตรวจหวย
function lottoResult(lottoNum) {
  return new Promise((resolve, reject) => {
    var dd = new Date();
    console.log('hh:mm '+dd.getHours()+':'+dd.getMinutes());
    var ldate = dd.getFullYear() + '-' + ('0' + (dd.getMonth() + 1)).slice(-2) + '-' + (dd.getDate() < 16 ? '01' : '16');
    lottoNum = lottoNum.trim();
    if (isNaN(lottoNum) || lottoNum.length != 6) resolve('');
    request.post({
      url: 'http://www.glo.or.th/glo_seize/lottary/check_lottary.php',
      form: {
        kuson: 1,
        ldate: ldate,
        lnumber: lottoNum,
        c_set: ''
      }
    }, function (err, res, body) {
      if(err) resolve('');
      var _res = body.substring(body.indexOf('id="dCheckLotto">') + 18, body.indexOf('id="dCheckLotto">') + 1000).trim();
      if(body.indexOf('value="'+ldate+'"')<0) resolve('หวยยังไม่ออกจ้า');
      _res = _res.substring(0, _res.indexOf('</table>') + 8);
      var parserRes = '';
      var parser = new htmlparser.Parser({
        ontext: function (text) {
          parserRes += text.trim() + ' ';
        }
      });
      parser.write(_res);
      parser.end();
      resolve(parserRes.trim().replace('ขอขอบคุณที่ร่วมเป็นส่วนหนึ่งในการพัฒนาสังคมอย่างยั่งยืน  ช่วยราษฎร์  เสริมรัฐ ยืนหยัดยุติธรรม', ''));
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
      diTxt = ret.routes[0].legs[0].duration_in_traffic.text + ', ' + ret.routes[0].legs[0].distance.text;
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
    //UPLOAD GIF TO CLOUDINARY
    cloudinary.v2.uploader.upload("http://203.155.220.231/Radar/pics/nkradar.gif",{use_filename: true, unique_filename : true}, function(error, result) { 
      if(error){
        console.log("=====GIF UPLOADED FAILED ?!? =====")
        console.log(error);
        return;
      }
      console.log("=====GIF UPLOADED=====")
      console.log(result.secure_url) 
      url_radarvid = result.secure_url.replace(".gif", ".mp4");
    });
    //UPLOAD Img & Resize to 800x800
    cloudinary.v2.uploader.upload("http://203.155.220.231/Radar/pics/nkzfiltered.jpg", {width:800, height: 800, crop: "scale", public_id: "radar800", use_filename: true, unique_filename : true}, function(error, result) { 
    console.log("=====IMAGE 800 UPLOADED=====")
    console.log(result.secure_url) 
    url_radar800 = result.secure_url;
    });
    //UPLOAD Img & Resize to 240x240
    cloudinary.v2.uploader.upload("http://203.155.220.231/Radar/pics/nkzfiltered.jpg", {width:240, height: 240, crop: "scale", public_id: "radar240", use_filename: true, unique_filename : true}, function(error, result) { 
    console.log("=====IMAGE 240 UPLOADED=====")
    console.log(result.secure_url) 
    url_radar240 = result.secure_url;
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
