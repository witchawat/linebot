var request = require("request");
const axios = require("axios");
var emoji = require("node-emoji");
var CronJob = require("cron").CronJob;
const util = require("util");
const events = require("events");
const _redis = require("redis");
var redisClient = _redis.createClient(process.env.REDISCLOUD_URL, {
  no_ready_check: true
});
const Cmd = function(app) {
  events.EventEmitter.call(this);
  var lastUpdate = new Date("2017-01-01"),
    vidStat = "error",
    imgStat = "error",
    imgTmb = "",
    imgUrl = "",
    vidTmb = "",
    vidUrl = "";
  const _this = this;
  app.get("/rain/img", (req, res) => {
    axios
      .get(`${process.env.RAIN_IMG}`, {
        responseType: "arraybuffer"
      })
      .then(r => {
        res
          .set({
            "Content-Type": "image/png",
            "Content-Length": r.data.length
          })
          .send(r.data);
      });
  });
  this.handleEvent = async function(evt, cmd, param) {
    var ret = {};
    if (cmd == "rain") {
      if (imgStat == "error")
        ret = {
          type: "text",
          text: `ไม่สามารถ load รูปได้ รบกวนไปดูเองที่\r\n${process.env.RAIN_IMG}`
        };
      else
        ret = {
          type: "image",
          originalContentUrl: imgUrl,
          previewImageUrl: imgTmb
        };
      var [altText, contents] = await rainFlex(evt);
      ret = {
        type: "flex",
        altText,
        contents
      };
      //console.log(JSON.stringify(ret, null, 2));
    }
    if (cmd == "rainvid") {
      if (vidStat == "error")
        ret = {
          type: "text",
          text: `ไม่สามารถ load gif ได้ รบกวนไปดูเองที่\r\n${process.env.RAIN_VID}`
        };
      else
        ret = {
          type: "video",
          originalContentUrl: vidUrl,
          previewImageUrl: imgStat == "error" ? vidTmb : imgTmb
        };
    }
    if (cmd == "rain_change_loc") {
      var uInfo = {
        addr: evt.message.title || evt.message.address || "สถานที่ไม่ทราบชื่อ",
        lat: evt.message.latitude,
        lng: evt.message.longitude
      };
      redis(`rain${evt.source.userId}`, uInfo);
      ret = {
        type: "text",
        text: `เปลี่ยนพิกัดเป็น ${uInfo.addr} แล้ว`
      };
    }
    _this.emit("replyMessage", {
      replyToken: evt.replyToken,
      message: ret
    });
  };

  function gfyAuth() {
    return new Promise((resolve, reject) => {
      var data = {
        client_id: process.env.GFY_ID,
        client_secret: process.env.GFY_SECRET,
        grant_type: "client_credentials"
      };
      request(
        {
          headers: {
            "Content-Type": "application/json"
          },
          url: "https://api.gfycat.com/v1/oauth/token",
          method: "POST",
          body: data,
          json: true
        },
        function(err, _res, body) {
          if (err) reject("");
          if (body) resolve(body.access_token);
          reject("");
        }
      );
    });
  }

  function getGfy(gfyname, token) {
    return new Promise((resolve, reject) => {
      var _this = this;
      request(
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer " + token
          },
          url: "https://api.gfycat.com/v1/gfycats/" + gfyname,
          method: "GET",
          json: true
        },
        function(err, _res, body) {
          if (err) reject("");
          if (body.gfyItem) {
            //console.log(body.gfyItem);
            resolve(body.gfyItem);
          } else {
            reject("");
          }
        }
      );
    });
  }

  function getGfyStat(gfyname, token) {
    return new Promise((resolve, reject) => {
      request(
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer " + token
          },
          url: "https://api.gfycat.com/v1/gfycats/fetch/status/" + gfyname,
          method: "GET",
          json: true
        },
        function(err, _res, body) {
          if (err) {
            reject("");
          }
          if (body) {
            if (body.gfyName) {
              resolve(body.gfyName);
            }
            if (body.gfyname) {
              resolve(body.gfyname);
            }
            reject(body.time);
          }
        }
      );
    });
  }

  function gfyPost(url) {
    return new Promise((resolve, reject) => {
      var data = {
        fetchUrl: url + "?v=" + new Date().getTime(),
        title: "Bangkok Weather " + new Date().getTime()
      };
      request(
        {
          headers: {
            "Content-Type": "application/json"
          },
          url: "https://api.gfycat.com/v1/gfycats",
          method: "POST",
          body: data,
          json: true
        },
        function(err, _res, body) {
          if (err) {
            reject("");
          }
          if (body) {
            resolve(body.gfyname);
          }
          reject("");
        }
      );
    });
  }
  async function genWeatherImgAndVid() {
    console.log("genWeatherImgAndVid");
    var gfyname, token, gfyObj;
    var checkCount;
    try {
      token = await gfyAuth();
      //post img
      gfyname = await gfyPost(process.env.RAIN_IMG);
      checkCount = 0;
      while (checkCount < 10) {
        checkCount++;
        try {
          //console.log('-- wait 4 gfy to process img --');
          gfyname = await getGfyStat(gfyname, token);
          gfyObj = await getGfy(gfyname, token);
          //console.log('got img');
          //console.log(gfyObj);
          imgTmb = gfyObj.mobilePosterUrl;
          imgUrl = gfyObj.posterUrl;
          imgStat = "ok";
          break;
        } catch (e) {
          await new Promise(resolve => setTimeout(resolve, 20000));
        }
      }
      if (checkCount == 10) {
        imgStat = "error";
      }
      //post vid
      gfyname = await gfyPost(process.env.RAIN_VID);
      checkCount = 0;
      //check 10 times
      while (checkCount < 10) {
        checkCount++;
        try {
          //console.log('-- wait 4 gfy to process gif --');
          gfyname = await getGfyStat(gfyname, token);
          gfyObj = await getGfy(gfyname, token);
          //console.log('got vid');
          //console.log(gfyObj);
          vidUrl = gfyObj.mobileUrl;
          vidTmb = gfyObj.mobilePosterUrl;
          vidStat = "ok";
          break;
        } catch (e) {
          await new Promise(resolve => setTimeout(resolve, 20000));
        }
      }
      if (checkCount == 10) {
        vidStat = "error";
      }
      /*
      console.log(imgTmb);
      console.log(imgUrl);
      console.log(vidUrl);
      */
    } catch (e) {
      console.log("error genWeatherImgAndVid !!");
      console.log(e);
      return "";
    }
    return "ok";
  }

  // copy from weather darksky
  async function rainFlex(evt) {
    var duration = 6,
      lat = 13.731213,
      lng = 100.541458,
      addr = "สวนลุมพินี";

    var uInfo = await redis(`rain${evt.source.userId}`);
    if (uInfo) {
      addr = uInfo.addr;
      lat = uInfo.lat;
      lng = uInfo.lng;
      //console.log("has uinfo ", JSON.stringify(uInfo));
    }

    // สวนพริกอันตร้า 13.781143,100.650343
    // สวนหลวง ร.9 13.689716, 100.669553

    return new Promise(resolve => {
      var uInfo;
      var url =
        imgStat == "error" ? `https://linerain.herokuapp.com/rain/img?${Math.random()}` : imgUrl;
      var uri = imgStat == "error" ? `${process.env.RAIN_IMG}` : imgUrl;
      var ret = {
        type: "bubble",
        size: "giga",
        hero: {
          type: "image",
          url,
          size: "full",
          aspectRatio: "1:1",
          aspectMode: "cover",
          action: {
            type: "uri",
            uri
          }
        },
        footer: {
          type: "box",
          layout: "vertical",
          spacing: "sm",
          contents: [
            {
              type: "button",
              style: "primary",
              height: "sm",
              color: "#d1115b",
              action: {
                type: "message",
                label: "เปลี่ยนพิกัด",
                text: "!rain_change_loc"
              }
            }
          ]
        }
      };
      var contents = [];
      axios
        .all([
          axios.get(
            `https://api.darksky.net/forecast/e3609d95c9670e7e3adc450f54e9c21e/${lat},${lng}`
          ),
          axios.get(
            `https://api.waqi.info/feed/geo:${lat};${lng}/?token=${process.env.AIRQUALITY_TOKEN}`
          )
        ])
        .then(
          axios.spread((weather, air) => {
            // air
            // console.log(JSON.stringify(air.data.data, null, 2));

            let airData = air.data.data,
              uTime = airData.time.s
                .split("-")
                .pop()
                .split(" "),
              city =
                airData.city.name
                  .split("Thailand")
                  .pop()
                  .split("(")
                  .slice(1)
                  .join("(")
                  .split(")")
                  .slice(0, -1)
                  .join(")")
                  .trim() || airData.city.name,
              pm25 = airData.iaqi.pm25 ? airData.iaqi.pm25.v * 1 : 0,
              pm25_warning = `${emoji.get(":white_check_mark:")} Good`;
            console.log("cityName " + airData.city.name);

            uTime = ordSfx(uTime[0]) + " " + uTime[1].substring(0, 5);
            if (pm25 > 51) {
              pm25_warning = `${emoji.get(":small_orange_diamond:")} Moderate`;
            }
            if (pm25 > 101) {
              pm25_warning = `${emoji.get(
                ":large_orange_diamond:"
              )} Unhealthy for Sensitive Groups`;
            }
            if (pm25 > 151) {
              pm25_warning = `${emoji.get(":bangbang:")} Unhealthy`;
            }
            if (pm25 > 201) {
              pm25_warning = `${emoji.get(":sos:")} Very Unhealthy`;
            }
            if (pm25 > 300) {
              pm25_warning = `${emoji.get(":skull:")} Hazardous`;
            }
            if (pm25 == 0) {
              pm25_warning = "";
              pm25 = "no data";
            }
            contents.push({
              type: "box",
              layout: "vertical",
              margin: "none",
              spacing: "sm",
              contents: [
                {
                  type: "box",
                  layout: "horizontal",
                  contents: [
                    {
                      type: "text",
                      text: addr,
                      weight: "bold",
                      color: "#1DB446",
                      size: "sm",
                      flex: 0
                    },
                    {
                      type: "text",
                      text: `🏠 ${city}`,
                      size: "sm",
                      color: "#111111",
                      align: "end"
                    }
                  ]
                },
                {
                  type: "box",
                  layout: "horizontal",
                  contents: [
                    {
                      type: "text",
                      text: `PM2.5 @ ${uTime}`,
                      weight: "bold",
                      size: "sm",
                      color: "#555555",
                      flex: 0
                    },
                    {
                      type: "text",
                      text: `${pm25} ${pm25_warning}`,
                      weight: "bold",
                      size: "sm",
                      color: "#111111",
                      align: "end"
                    }
                  ]
                }
              ]
            });
            // weather
            //console.log(JSON.stringify(resp.data, null, 2));
            var dat = weather.data.hourly.data.slice(0, duration);
            var isFirstForecast = true;
            if (!dat.length) return resolve([`สภาพอากาศ ณ ${addr}`, ret]);
            dat.forEach(v => {
              contents.push({
                type: "text",
                text: forecast2string(v),
                color: "#555555",
                size: "sm",
                margin: isFirstForecast ? "md" : "none"
              });
              isFirstForecast = false;
            });
            ret.body = {
              type: "box",
              layout: "vertical",
              contents,
              paddingAll: "10px"
            };
            return resolve([`สภาพอากาศ ณ ${addr}`, ret]);
          })
        )
        .catch(err => {
          //console.log(err);
          console.log("api error naja");
          return resolve([`สภาพอากาศ ณ ${addr}`, ret]);
        });
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

    ret += emoji.get("clock" + t);
    ret += " " + f2c(inp.temperature) + "° ";
    ret += 59 <= realFeel ? emoji.get(":skull:") : "";
    ret += 52 <= realFeel && realFeel <= 58 ? emoji.get(":skull:") : "";
    ret += 40 <= realFeel && realFeel <= 51 ? emoji.get(":sos:") : "";
    ret += 33 <= realFeel && realFeel <= 39 ? emoji.get(":large_orange_diamond:") : "";
    ret += realFeel <= 32 ? emoji.get(":white_check_mark:") : "";
    ret += " " + realFeel + "° ";
    ret +=
      emoji.get(":rain_cloud:") +
      " " +
      (" " + (inp.precipProbability * 100).toFixed(0)).slice(-2) +
      "%";
    ret += " " + inp.summary;
    return ret;
  }
  function f2c(f) {
    return (((f - 32) / 9) * 5).toFixed(0);
  }
  function redis() {
    var varName = arguments[0];
    var val = arguments[1];
    return new Promise(resolve => {
      if (val === undefined) {
        redisClient.get(varName, function(err, _) {
          if (err || !_) {
            resolve({});
            return;
          }
          try {
            resolve(JSON.parse(_));
          } catch (e) {
            resolve({});
          }
        });
        return;
      } else {
        redisClient.set(varName, JSON.stringify(val), "EX", 20 * 60 * 60);
        resolve(true);
      }
    });
  }
  function ordSfx(i) {
    i *= 1;
    var j = i % 10,
      k = i % 100;
    if (j == 1 && k != 11) {
      return i + "st";
    }
    if (j == 2 && k != 12) {
      return i + "nd";
    }
    if (j == 3 && k != 13) {
      return i + "rd";
    }
    return i + "th";
  }
  util.inherits(Cmd, events.EventEmitter);
  new CronJob({
    cronTime: "56 1,11,21,31,41,51 * * * *",
    onTick: genWeatherImgAndVid,
    start: true,
    timeZone: "Asia/Bangkok",
    runOnInit: true
  });
  //genWeatherImgAndVid();
};
module.exports = Cmd;
