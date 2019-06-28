var request = require("request");
var CronJob = require("cron").CronJob;
const util = require("util");
const events = require("events");
const Cmd = function() {
  events.EventEmitter.call(this);
  var lastUpdate = new Date("2017-01-01"),
    vidStat = "error",
    imgStat = "error",
    imgTmb = "",
    imgUrl = "",
    vidTmb = "",
    vidUrl = "";
  const _this = this;
  this.handleEvent = function(evt, cmd, param) {
    var ret = {};
    if (cmd == "rain") {
      if (imgStat == "error")
        ret = {
          type: "text",
          text:
            "ไม่สามารถ load รูปได้ รบกวนไปดูเองที่\r\nhttp://weather.bangkok.go.th/Images/Radar/nkradar.jpg"
        };
      else
        ret = {
          type: "image",
          originalContentUrl: imgUrl,
          previewImageUrl: imgTmb
        };
    }
    if (cmd == "rainvid") {
      if (vidStat == "error")
        ret = {
          type: "text",
          text:
            "ไม่สามารถ load gif ได้ รบกวนไปดูเองที่\r\nhttp://203.155.220.231/Radar/pics/nkradar.gif"
        };
      else
        ret = {
          type: "video",
          originalContentUrl: vidUrl,
          previewImageUrl: imgStat == "error" ? vidTmb : imgTmb
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
      gfyname = await gfyPost(
        "http://weather.bangkok.go.th/FTPCustomer/radar/pics/zfiltered.jpg"
      );
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
      gfyname = await gfyPost("http://203.155.220.231/Radar/pics/nkradar.gif");
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
