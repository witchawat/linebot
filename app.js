'use strict';
require('dotenv').config()
const express = require('express');
const bodyParser = require('body-parser');
var urlencodedParser = bodyParser.urlencoded({
  extended: false
});
const line = require('@line/bot-sdk');
//================================
//        KEYS
//================================
//Line API
const config = {
  channelAccessToken: process.env.LINEACCESS,
  channelSecret: process.env.LINESECRET
};
const client = new line.Client(config);
var eventHandler = new(require('./commands/EventHandler.js'))(client);
eventHandler.add(["!rain", '!rainvid'], new(require('./commands/Rain.js')));
eventHandler.add('!air', new(require('./commands/Air.js')));
eventHandler.add('!log', new(require('./commands/MyLog.js')));
eventHandler.add('!solve', new(require('./commands/WolframSolve.js')));
const app = express();
app.use(express.static('public'))
app.set('port', (process.env.PORT || 5000));
app.post('/webhook', line.middleware(config), (req, res) => {
  req.body.events.forEach(evt => eventHandler.handleEvent(evt));
  res.send('');
});
app.get("*", function (req, res) {
  res.send("Ong Line Bot");
});
//Heroku setting
app.listen(app.get('port'), function () {
  console.log('Node app is running on port', app.get('port'));
});
