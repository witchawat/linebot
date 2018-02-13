const EventHandler = function (_client) {
  var client = _client;
  var rules = [];
  this.add = function (cmd, cmdHandler, _type) {
    var type = _type || 'message';
    if (Array.isArray(cmd)) {
      cmd.forEach(aCmd => rules.push({
        'cmd': aCmd.toLowerCase(),
        'type': type,
        'handler': cmdHandler
      }));
    } else {
      rules.push({
        'cmd': cmd.toLowerCase(),
        'type': type,
        'handler': cmdHandler
      });
    }
    cmdHandler.on('replyMessage', replyMessage);
    cmdHandler.on('pushMessage', pushMessage);
  }

  function replyMessage(obj) {
    if (process.env.NODE_ENV == 'development') {
      console.log(obj);
    } else {
      client.replyMessage(obj.replyToken, obj.message).catch((err) => {
        console.log(err);
      });
    }
  }

  function pushMessage(obj) {
    if (process.env.NODE_ENV == 'development') {
      console.log(obj);
    } else {
      client.pushMessage(obj.to, obj.message).catch((err) => {
        console.log(err);
      });
    }
  }

  function isCmdMatched(evt, r) {
    if (evt.type != r.type) return;
    if (r.type == 'message') {
      if (!evt.message || !evt.message.text || evt.message.text.toLowerCase().indexOf(r.cmd) != 0) return;
      r.handler.handleEvent(evt, r.cmd, evt.message.text.slice(r.cmd.length).trim());
    }
  }
  //ตอนนี้จัดกา่รเฉพาะ message, พวกรูปกับ location ยังไม่ได้คิด
  this.handleEvent = function (evt) {
    rules.forEach(r => isCmdMatched(evt, r));
  }
  this.foo = function () {
    console.log(rules);
  }
}
module.exports = EventHandler;
