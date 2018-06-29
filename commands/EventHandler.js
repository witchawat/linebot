const EventHandler = function (_client) {
  var client = _client;
  var rules = [];
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
      if (evt.message.type == 'text' && r.type == 'text') {
        if (!evt.message.text || evt.message.text.charAt(0) != '!') return;
        var msg = evt.message.text.trim();
        var regTest = RegExp('^\\!(' + r.cmd + '$|' + r.cmd + '[\\s]+(.*)*)', 'i').exec(msg);
        if (regTest) r.handler.handleEvent(evt, r.cmd, regTest[2]);
      }
      // image handler will dispatch to all 'image' listener
      if (evt.message.type == 'image' && r.type == 'image') {
        r.handler.handleEvent(evt, r.cmd, null);
      }
    }
  }
  //ตอนนี้จัดกา่รเฉพาะ message, พวกรูปกับ location ยังไม่ได้คิด
  this.handleEvent = function (evt) {
    rules.forEach(r => isCmdMatched(evt, r));
  };
  this.foo = function () {
    console.log(rules);
  };
};
module.exports = EventHandler;
