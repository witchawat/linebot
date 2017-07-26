require('dotenv').config()
const express = require('express');
const line = require('@line/bot-sdk');
var CronJob = require('cron').CronJob;
const download = require('image-downloader')
const fs = require('fs'); //resize
const fss = require('fs'); //resize
var cloudinary = require('cloudinary'); //gif to mp4
const resizeImg = require('resize-img'); //resize

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
//For Image Downloader
// const options = {
//   url: 'http://203.155.220.231/Radar/pics/nkzfiltered.jpg',
//   dest: './public/radarfull.jpg'        // Save to /path/to/dest/photo.jpg 
// };

// const optionsgif = {
//   url: 'http://203.155.220.231/Radar/pics/radar.gif',
//   dest: './public/radar.gif'        // Save to /path/to/dest/photo.jpg 
// };

const app = express();
app.use(express.static('public'))
app.set('port', (process.env.PORT || 5000));


app.post('/webhook', line.middleware(config), (req, res) => {
  Promise
    .all(req.body.events.map(handleEvent))
    .then((result) => res.json(result));
});

const client = new line.Client(config);

function handleEvent(event) {
  if (event.type !== 'message' || event.message.type !== 'text') {
    return Promise.resolve(null);
  }
  //!rain - jpg
  if (event.type == 'message' && event.message.text == '!rain'){ 
      return client.replyMessage(event.replyToken, {
        "type": "image",
        "originalContentUrl": "https://res.cloudinary.com/witchawat/image/upload/radar800.jpg",
        "previewImageUrl": "https://res.cloudinary.com/witchawat/image/upload/radar240.jpg"
      })};
    //!rainvid
  if (event.type == 'message' && event.message.text == '!rainvid'){ 
      return client.replyMessage(event.replyToken, {
        "type": "video",
        "originalContentUrl": "https://res.cloudinary.com/witchawat/image/upload/radar.mp4",
        "previewImageUrl": "https://res.cloudinary.com/witchawat/image/upload/radar240.jpg"
      })};
};

//Download Image to /public/radar.jpg every xx minute
new CronJob('56 * * * * *', function() { // sec min hr
    console.log('You will see this message every 11 mins');
    //UPLOAD GIF TO CLOUDINARY
    cloudinary.v2.uploader.upload("http://203.155.220.231/Radar/pics/radar.gif",{use_filename: true, unique_filename : false}, function(error, result) { 
    console.log("=====GIF UPLOADED=====")
    console.log(result) 
    });
    //UPLOAD Img & Resize to 800x800
    cloudinary.v2.uploader.upload("http://203.155.220.231/Radar/pics/nkzfiltered.jpg", {width:800, height: 800, crop: "scale", public_id: "radar800" use_filename: true, unique_filename : false}, function(error, result) { 
    console.log("=====IMAGE 800 UPLOADED=====")
    console.log(result) 
    });
    //UPLOAD Img & Resize to 240x240
    cloudinary.v2.uploader.upload("http://203.155.220.231/Radar/pics/nkzfiltered.jpg", {width:240, height: 240, crop: "scale", public_id: "radar240", use_filename: true, unique_filename : false}, function(error, result) { 
    console.log("=====IMAGE 240 UPLOADED=====")
    console.log(result) 
    });
    //Convert GIF to MP4 by CloudConvert
    // fss.createReadStream('./public/radar.gif')
    // .pipe(cloudconvert.convert({
    //     inputformat: 'gif',
    //     outputformat: 'mp4',
    //     input: 'upload'
    // }))
    // .pipe(fss.createWriteStream('./public/radar.mp4'));
    //Convert GIF to MP4 by CloudConvert
        
    }, null, true, 'Asia/Bangkok');

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
