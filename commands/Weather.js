var axios = require("axios");
var emoji = require("node-emoji");
const util = require("util");
const events = require("events");
const hIndex = {
  40: [27, 27, 28, 29, 31, 33, 34, 36, 38, 41, 43, 46, 48, 51, 54, 58],
  45: [27, 28, 29, 31, 32, 34, 36, 38, 40, 43, 46, 48, 51, 54, 58],
  50: [27, 28, 29, 31, 33, 35, 37, 39, 42, 45, 48, 51, 55, 58],
  55: [27, 29, 30, 32, 34, 36, 38, 41, 44, 47, 51, 54, 58],
  60: [28, 29, 31, 33, 35, 38, 41, 43, 47, 51, 54, 58],
  65: [38, 29, 32, 34, 37, 39, 42, 46, 49, 53, 58],
  70: [28, 30, 32, 35, 38, 41, 44, 48, 52, 57],
  75: [29, 31, 33, 36, 39, 43, 47, 51, 56],
  80: [29, 32, 34, 38, 41, 45, 49, 54],
  85: [29, 32, 36, 39, 43, 47, 52, 57],
  90: [30, 33, 37, 41, 45, 50, 55],
  95: [30, 34, 38, 42, 47, 53],
  100: [31, 35, 39, 44, 49, 56]
};

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
        "https://data.tmd.go.th/nwpapi/v1/forecast/location/hourly/at?lat=" +
          lat +
          "&lon=" +
          lng +
          "&fields=tc,rh,rain,wd10m,cond&duration=" +
          duration,
        header
      )
      .then(resp => {
        console.log(JSON.stringify(resp.data, null, 2));
        var ret = resp.data.WeatherForecasts[0].forecasts.map(v => forecast2string(v)).join(`\n`);
        return ret || "no forecast data from tmd.go.th";
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
      dir,
      sunnyEmoji;
    dir = inp.data.wd10m / 22.5;
    t = new Date(inp.time).getHours();
    sunnyEmoji = 6 <= t && t <= 18 ? emoji.get("sunny") : emoji.get("moon");
    t %= 12;
    t = t < 1 ? 12 : t;
    ret += emoji.get("clock" + t) + " ";
    ret += inp.data.cond == 1 ? sunnyEmoji : "";
    ret += inp.data.cond == 2 ? emoji.get("mostly_sunny") : "";
    ret += inp.data.cond == 3 ? emoji.get("barely_sunny") : "";
    ret += inp.data.cond == 4 ? emoji.get("cloud") : "";
    ret += inp.data.cond == 5 ? emoji.get("partly_sunny_rain") : "";
    ret += inp.data.cond == 6 ? emoji.get("rain_cloud") : "";
    ret += inp.data.cond == 7 ? emoji.get("lightning") : "";
    ret += inp.data.cond == 8 ? emoji.emojify(":lightning::lightning:") : "";
    ret += 9 <= inp.data.cond && resp.data.cond <= 11 ? emoji.get("snowflake") : "";
    ret += inp.data.cond == 12 ? emoji.get("fire") : "";
    ret += " ";
    ret += dir >= 15 || dir < 1 ? emoji.get("arrow_down") : "";
    ret += 1 <= dir && dir < 3 ? emoji.get("arrow_lower_left") : "";
    ret += 3 <= dir && dir < 5 ? emoji.get("arrow_left") : "";
    ret += 5 <= dir && dir < 7 ? emoji.get("arrow_upper_left") : "";
    ret += 7 <= dir && dir < 9 ? emoji.get("arrow_up") : "";
    ret += 9 <= dir && dir < 11 ? emoji.get("arrow_upper_right") : "";
    ret += 11 <= dir && dir < 13 ? emoji.get("arrow_right") : "";
    ret += 13 <= dir && dir < 15 ? emoji.get("arrow_lower_right") : "";
    ret += " " + inp.data.tc.toFixed(0) + "°C";
    var realFeel = "Danger !!!";
    if (
      hIndex[Math.round((inp.data.rh * 1) / 5) * 5] &&
      hIndex[Math.round((inp.data.rh * 1) / 5) * 5][Math.round(inp.data.tc) - 27]
    )
      realFeel = hIndex[Math.round((inp.data.rh * 1) / 5) * 5][Math.round(inp.data.tc) - 27];
    ret += " feel like ";
    ret += isNaN(realFeel) ? emoji.get(":skull:") : "";
    ret += !isNaN(realFeel) && realFeel > 51 ? emoji.get(":skull:") : "";
    ret += !isNaN(realFeel) && realFeel > 39 ? emoji.get(":sos:") : "";
    ret += !isNaN(realFeel) && realFeel > 32 ? emoji.get(":bangbang:") : "";
    ret += !isNaN(realFeel) && realFeel > 26 ? emoji.get(":white_check_mark:") : "";
    ret += realFeel + "°C";
    return ret;
  }
  util.inherits(Cmd, events.EventEmitter);
};
module.exports = Cmd;
