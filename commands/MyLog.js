const util = require('util');
const events = require('events');
const Cmd = function () {
  events.EventEmitter.call(this);
  const _this = this;
  this.handleEvent = function (evt, cmd, param) {
    console.log(evt);
    _this.emit('replyMessage', {
      replyToken: evt.replyToken,
      message: {
        "type": "text",
        "text": evt.message.text
      }
    });
  }
  util.inherits(Cmd, events.EventEmitter);
}
module.exports = Cmd;
