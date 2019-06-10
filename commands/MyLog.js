const util = require("util");
const events = require("events");
const Cmd = function() {
  events.EventEmitter.call(this);
  const _this = this;
  this.handleEvent = function(evt, cmd, param) {
    console.log(evt);
    _this.emit("replyMessage", {
      replyToken: evt.replyToken,
      message: {
        type: "text",
        text:
          "userId : " +
          evt.source.userId +
          "\nroomId : " +
          evt.source.roomId +
          "\ngroupId : " +
          evt.source.groupId +
          "\nparam : " +
          param
      }
    });
  };
  util.inherits(Cmd, events.EventEmitter);
};
module.exports = Cmd;
