const EventHandler = function (_client) {
  var client = _client;
  var rules = [];
  var gpsHandler, gpsHandlerCmd, gpsTimer, imgHandler, imgHandlerCmd, imgTimer;
  this.add = function (cmd, cmdHandler, _type) {
    var type = _type || 'text';
    if (Array.isArray(cmd)) {
      cmd.forEach(aCmd => rules.push({
        cmd: aCmd.toLowerCase(),
        type: type,
        handler: cmdHandler
      }));
    } else {
      rules.push({
        cmd: cmd.toLowerCase(),
        type: type,
        handler: cmdHandler
      });
    }
    cmdHandler.removeListener('replyMessage', replyMessage);
    cmdHandler.removeListener('pushMessage', pushMessage);
    cmdHandler.on('replyMessage', replyMessage);
    cmdHandler.on('pushMessage', pushMessage);
  };

  function replyMessage(obj) {
    if (process.env.NODE_ENV == 'development') {
      console.log(obj);
    } else {
      client.replyMessage(obj.replyToken, obj.message).catch(err => {
        console.log(err);
      });
    }
  }

  function pushMessage(obj) {
    if (process.env.NODE_ENV == 'development') {
      console.log(obj);
    } else {
      client.pushMessage(obj.to, obj.message).catch(err => {
        console.log(err);
      });
    }
  }

  function isCmdMatched(evt, r) {
    if (evt.type == 'message' && evt.message && evt.message.type) {
      if (evt.message.type == 'text') {
        if (!evt.message.text || evt.message.text.charAt(0) != '!') return;
        var msg = evt.message.text.trim();
        var regTest = RegExp('^\\!(' + r.cmd + '$|' + r.cmd + '[\\s]+(.*)*)', 'i').exec(msg);
        if (regTest) {
          if (r.type == 'image') {
            replyMessage({
              replyToken: evt.replyToken,
              message: {
                type: 'text',
                text: 'waiting for img'
              }
            });
            imgHandler = r;
            clearTimeout(imgTimer);
            setTimeout(function () {
              imgHandler = null;
            }, 60000); //wait 1 minute for image
          }
          if (r.type == 'position') {
            gpsHandler = r;
            clearTimeout(gpsTimer);
            setTimeout(function () {
              gpsHandler = null;
            }, 60000); //wait 1 minute for image
          }
          if (r.type == 'text') r.handler.handleEvent(evt, r.cmd, regTest[2]);
        }
      }
      if (evt.message.type == 'image' && imgHandler) {
        clearTimeout(imgTimer);
        imgHandler = null;
        imgHandler.handler.handleEvent(evt, imgHandler.cmd, null);
      }
    }
  }
  //ตอนนี้จัดกา่รเฉพาะ message, พวกรูปกับ location ยังไม่ได้คิด
  this.handleEvent = function (evt) {
    console.log(evt);
    rules.forEach(r => isCmdMatched(evt, r));
  };
  this.logRules = function () {
    console.log(rules);
  };
};
module.exports = EventHandler;
