const util = require("util");
const events = require("events");
const redis = require("redis");
var redisClient = redis.createClient(process.env.REDISCLOUD_URL, {
  no_ready_check: true
});
const Cmd = function() {
  events.EventEmitter.call(this);
  const _this = this;
  this.handleEvent = function(evt, cmd, param) {
    if (cmd == "settime") {
      var raceClk = param.split(":").map(v => v * 1);
      var t = 10 * 60 * 60 * 1000 - ((raceClk[0] * 60 + raceClk[1]) * 60 + raceClk[2]) * 1000;
      var d = new Date();
      redisClient.set("suanPruek", d.getTime() + t, "EX", 30 * 24 * 60 * 60);
      _this.emit("replyMessage", {
        replyToken: evt.replyToken,
        message: {
          type: "text",
          text: `race will end in ${msToHMS(t)}`
        }
      });
    }
    if (cmd == "gettime") {
      redisClient.get("suanPruek", function(err, _) {
        if (err || !_) {
          return;
        }
        var t = _ * 1;
        var d = new Date();
        _this.emit("replyMessage", {
          replyToken: evt.replyToken,
          message: {
            type: "text",
            text: `race will end in ${msToHMS(t - d.getTime())}`
          }
        });
      });
    }
  };
  function msToHMS(ms) {
    var seconds = ms / 1000;
    var hours = parseInt(seconds / 3600);
    seconds = seconds % 3600;
    var minutes = parseInt(seconds / 60);
    seconds = seconds % 60;
    return `${("0" + hours).slice(-2)}:${("0" + minutes).slice(-2)}:${("0" + seconds).slice(-2)}`;
  }

  util.inherits(Cmd, events.EventEmitter);
};
module.exports = Cmd;
