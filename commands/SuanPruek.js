const util = require("util");
const events = require("events");
const redis = require("redis");
var redisClient = redis.createClient(process.env.REDISCLOUD_URL, {
  no_ready_check: true
});
var parkDist = 2.1;
var cords = [
  100.64938589784336,
  13.782185185185185,
  100.65083552326902,
  13.780299740740741,
  100.6528378183882,
  13.776865222222222,
  100.65311868331442,
  13.776989148148148,
  100.6531911645857,
  13.777653037037037,
  100.6493315368899,
  13.784150296296296,
  100.64802687400682,
  13.784415851851852,
  100.64778224971624,
  13.784008666666667,
  100.64938589784336,
  13.782185185185185
];
var segDist = [
  0.26104760176547065,
  0.4375539473648667,
  0.03333128402078494,
  0.07391002202779123,
  0.8316135777512473,
  0.144136459886679,
  0.05226687084621212,
  0.26614023633694783
];
var accumDist = [
  0,
  0.26104760176547065,
  0.6986015491303373,
  0.7319328331511222,
  0.8058428551789135,
  1.6374564329301609,
  1.7815928928168399,
  1.833859763663052
];

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
    if (!cmd) {
      console.log(`${evt.message.latitude}, ${evt.message.longitude}`);

      redisClient.get("suanPruek", function(err, _) {
        if (err || !_) {
          return;
        }
        var t = _ * 1;
        var d = new Date();
        var ret = getPos(
          evt.message.longitude * 1,
          evt.message.latitude * 1,
          (t - d.getTime()) / 1000
        );
        _this.emit("replyMessage", {
          replyToken: evt.replyToken,
          message: {
            type: "text",
            text: [
              `race will end in ${msToHMS(t - d.getTime())}`,
              `dist left: ${ret.distLeft}`,
              ret.res
            ].join("\n")
          }
        });
      });
    }
  };
  function getPos(x, y, remainingTime) {
    var i = 0,
      minDist = 1000000,
      tmp,
      xx,
      yy,
      pp,
      idx = -1;
    while (i < cords.length - 2) {
      tmp = pDistance(x, y, cords[i], cords[i + 1], cords[i + 2], cords[i + 3]);
      if (tmp.d < minDist) {
        idx = i / 2;
        minDist = tmp.d;
        xx = tmp.x;
        yy = tmp.y;
        pp = tmp.p;
      }
      i += 2;
    }
    var lap = 1,
      pace,
      res = "",
      dist = parkDist - accumDist[idx] - segDist[idx] * pp;
    if (dist > 0) {
      pace = remainingTime / dist;
      while (pace > 360) {
        if (pace < 1200) {
          if (res != "") res += ", ";
          res += lap + "-" + sec2pace(pace);
        }
        lap++;
        dist += parkDist;
        pace = remainingTime / dist;
      }
    }
    return {
      distLeft: Math.floor((parkDist - accumDist[idx] - segDist[idx] * pp) * 100) / 100,
      res
    };
  }
  function sec2pace(sp) {
    var deci = Math.floor(sp % 60) + "";
    while (deci.length < 2) {
      deci = "0" + deci;
    }
    return Math.floor(sp / 60) + ":" + deci;
  }
  function pDistance(x, y, x1, y1, x2, y2) {
    var A = x - x1;
    var B = y - y1;
    var C = x2 - x1;
    var D = y2 - y1;

    var dot = A * C + B * D;
    var len_sq = C * C + D * D;
    var param = -1;
    if (len_sq != 0)
      //in case of 0 length line
      param = dot / len_sq;

    var xx, yy;

    if (param < 0) {
      xx = x1;
      yy = y1;
      param = 0;
    } else if (param > 1) {
      xx = x2;
      yy = y2;
      param = 1;
    } else {
      xx = x1 + param * C;
      yy = y1 + param * D;
    }

    var dx = x - xx;
    var dy = y - yy;
    return { d: Math.sqrt(dx * dx + dy * dy), x: xx, y: yy, p: param };
  }
  function msToHMS(ms) {
    var seconds = ms / 1000;
    var hours = parseInt(seconds / 3600);
    seconds = seconds % 3600;
    var minutes = parseInt(seconds / 60);
    seconds = parseInt(seconds % 60);
    return `${("0" + hours).slice(-2)}:${("0" + minutes).slice(-2)}:${("0" + seconds).slice(-2)}`;
  }

  util.inherits(Cmd, events.EventEmitter);
};
module.exports = Cmd;
