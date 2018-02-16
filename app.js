'use strict';
require('dotenv').config()

const LineEventHandler = require('./commands/EventHandler.js');
const Rain = require('./commands/Rain.js');
const Air = require('./commands/Air.js');
const MyLog = require('./commands/MyLog.js');
const WolframSolve = require('./commands/WolframSolve.js');

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
var eventHandler = new LineEventHandler(client);
eventHandler.add(['rain', 'rainvid'], new Rain());
eventHandler.add('air', new Air());
eventHandler.add('log', new MyLog());
eventHandler.add('solve', new WolframSolve());
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
