const util = require("util");
const events = require("events");
const Cmd = function() {
  events.EventEmitter.call(this);
  const _this = this;
  this.handleEvent = function(evt, cmd, param) {
    if (cmd == "settime") {
      var raceClk = param.split(":").map(v => v * 1);
      var t = 10 * 60 * 60 * 1000 - ((raceClk[0] * 60 + raceClk[1]) * 60 + raceClk[2]) * 1000;
      var d = new Date();
      console.log(d);
      d.setTime(d.getTime() + t);
      console.log(d);
      _this.emit("replyMessage", {
        replyToken: evt.replyToken,
        message: {
          type: "text",
          text: d.toISOString()
        }
      });
    }
  };
  util.inherits(Cmd, events.EventEmitter);
};
module.exports = Cmd;
