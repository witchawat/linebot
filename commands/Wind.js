const util = require('util');
const events = require('events');
const Cmd = function () {
  events.EventEmitter.call(this);
  const _this = this;

  /*
    evt - เป็น event object เดิมๆจาก line
    cmd - !rain, !air ไรงี้ว่าไป
    param - เป็น text ตามหลัง เช่น
      !air สวนลุม => cmd=!air, param=สวนลุม
  */
  this.handleEvent = function (evt,cmd,param) {
    /*
    -- ตัวอย่าง --
    _this.emit('replyMessage', {
      replyToken: evt.replyToken,
      message: {
        type: 'text',
        text: 'Hello World!'
      }
    });
    */

    /*
    -- ตัวอย่าง --
    อาจจะเป็น roomId, groupId ก็ได้
    _this.emit('pushMessage', {
      to: evt.source.userId,
      message: {
        type: 'text',
        text: 'Hello World!'
      }
    });
    */
  }
  util.inherits(Cmd, events.EventEmitter);
}
module.exports = Cmd;
