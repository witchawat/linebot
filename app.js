require('dotenv').config()
const express = require('express');
const line = require('@line/bot-sdk');
var CronJob = require('cron').CronJob;
const download = require('image-downloader')
const fs = require('fs'); //resize
const fss = require('fs'); //resize

const resizeImg = require('resize-img'); //resize

//Convert GIF to MP4
var cloudconvert = new (require('cloudconvert'))(process.env.CLOUDCONVERT);
//Line API
const config = {
  channelAccessToken: process.env.LINEACCESS,
  channelSecret: process.env.LINESECRET
};
//For Image Downloader
const options = {
  url: 'http://weather.bangkok.go.th/FTPCustomer/radar/pics/nkradar.jpg',
  dest: './public/radar.jpg'        // Save to /path/to/dest/photo.jpg 
};

const optionsgif = {
  url: 'http://203.155.220.231/Radar/pics/radar.gif',
  dest: './public/radar.gif'        // Save to /path/to/dest/photo.jpg 
};

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
        "originalContentUrl": "https://node-test-witchawat.c9users.io/radar.jpg",
        "previewImageUrl": "https://node-test-witchawat.c9users.io/radar-preview.jpg"
      })};
    //!rainvid
  if (event.type == 'message' && event.message.text == '!rainvid'){ 
      return client.replyMessage(event.replyToken, {
        "type": "video",
        "originalContentUrl": "https://node-test-witchawat.c9users.io/radar.mp4",
        "previewImageUrl": "https://node-test-witchawat.c9users.io/radar-preview.jpg"
      })};
};

//Download Image to /public/radar.jpg every xx minute
new CronJob('0 */10 * * * *', function() { // sec min hr
    console.log('You will see this message every 11 mins');
    //DL Image
    download.image(options)
    .then(({ filename, image }) => {
    console.log('File saved to', filename)
    }).catch((err) => {
    throw err
    })
    //DL GIF
    download.image(optionsgif)
    .then(({ filename, image }) => {
    console.log('File saved to', filename)
    }).catch((err) => {
    throw err
    })
    //Resize
    resizeImg(fs.readFileSync('./public/radar.jpg'), {width: 240, height: 240}).then(buf => {
    fs.writeFileSync('./public/radar-preview.jpg', buf);});
    //Convert GIF to MP4 by CloudConvert
    fss.createReadStream('./public/radar.gif')
    .pipe(cloudconvert.convert({
        inputformat: 'gif',
        outputformat: 'mp4',
        input: 'upload'
    }))
    .pipe(fss.createWriteStream('./public/radar.mp4'));
        
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
