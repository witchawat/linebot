var axios = require("axios");
var emoji = require("node-emoji");
const util = require("util");
const events = require("events");

const Cmd = function() {
  events.EventEmitter.call(this);
  const _this = this;
  var header = { headers: { Authorization: "Bearer " + process.env.TMD_TOKEN } };
  this.handleEvent = function(evt, cmd, param) {
    var duration = 1;
    duration = cmd == "w2" ? 2 : duration;
    duration = cmd == "w3" ? 3 : duration;
    duration = cmd == "w4" ? 4 : duration;
    duration = cmd == "w5" ? 5 : duration;
    duration = cmd == "w6" ? 6 : duration;
    duration = cmd == "w7" ? 7 : duration;
    duration = cmd == "w8" ? 8 : duration;
    duration = cmd == "w9" ? 9 : duration;
    duration = cmd == "w10" ? 10 : duration;
    if (!param) {
      weatherInfo(duration).then(r => {
        _this.emit("replyMessage", {
          replyToken: evt.replyToken,
          message: {
            type: "text",
            text: r
          }
        });
      });
    } else {
      axios
        .get(
          "https://maps.googleapis.com/maps/api/geocode/json?address=" +
            encodeURI(param) +
            "&key=" +
            process.env.STATIC_MAP_API_KEY +
            "&language=th"
        )
        .then(r => {
          if (r.data.results.length) {
            var formatted_address = r.data.results[0].formatted_address;
            weatherInfo(
              duration,
              r.data.results[0].geometry.location.lat,
              r.data.results[0].geometry.location.lng
            ).then(r => {
              _this.emit("replyMessage", {
                replyToken: evt.replyToken,
                message: {
                  type: "text",
                  text: `[ ${formatted_address} ]\n\n` + r
                }
              });
            });
          }
        })
        .catch();
    }
  };

  function weatherInfo(duration, lat, lng) {
    // //default is บ่อขยะอ่อนนุช
    // lat = lat || 13.7070603;
    // lng = lng || 100.6801283;

    //default is สวนพริกอันตร้า
    lat = lat || 13.781143;
    lng = lng || 100.650343;
    return axios
      .get(
        `https://api.darksky.net/forecast/e3609d95c9670e7e3adc450f54e9c21e/13.7070603,100.6801283`
      )
      .then(resp => {
        console.log(JSON.stringify(resp.data, null, 2));
        var ret = resp.data.hourly.data
          .slice(0, duration)
          .map(v => forecast2string(v))
          .join(`\n`);
        return ret || "no forecast data";
      })
      .catch(err => {
        //console.log(err);
        console.log("api error naja");
        return "API Error";
      });
  }

  function forecast2string(inp) {
    if (!inp) return "ไม่มีข้อมูล";
    var ret = "",
      t,
      sunnyEmoji;
    t = new Date(inp.time * 1000).getHours();
    sunnyEmoji = 6 <= t && t <= 18 ? emoji.get("sunny") : emoji.get("moon");
    t %= 12;
    t = t < 1 ? 12 : t;

    var realFeel = f2c(inp.apparentTemperature);

    ret += emoji.get("clock" + t) + " ";
    ret += " " + f2c(inp.temperature) + "°C ";
    ret += 59 <= realFeel ? emoji.get(":skull:") : "";
    ret += 52 <= realFeel && realFeel <= 58 ? emoji.get(":skull:") : "";
    ret += 40 <= realFeel && realFeel <= 51 ? emoji.get(":sos:") : "";
    ret += 33 <= realFeel && realFeel <= 39 ? emoji.get(":large_orange_diamond:") : "";
    ret += realFeel <= 32 ? emoji.get(":white_check_mark:") : "";
    ret += " " + realFeel + "°C ";
    ret += inp.summary;
    ret += " " + emoji.get(":rain:") + inp.precipProbability;
    return ret;
  }
  function f2c(f) {
    return (((f - 32) / 9) * 5).toFixed(0);
  }
  util.inherits(Cmd, events.EventEmitter);
};
module.exports = Cmd;
