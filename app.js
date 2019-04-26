"use strict";
require("dotenv").config();
const LineEventHandler = require("./commands/EventHandler.js");
const Rain = require("./commands/Rain.js");
const Air = require("./commands/Air.js");
const MyLog = require("./commands/MyLog.js");
const WolframSolve = require("./commands/WolframSolve.js");
const WeatherDarkSky = require("./commands/WeatherDarkSky.js");
const Weather = require("./commands/Weathery.js");
const Manga = require("./commands/Manga.js");
const ThairunFaceSearch = require("./commands/ThairunFaceSearch.js");
//const UTMF = require('./commands/Utmf.js');
//const PYT = require("./commands/Pyt.js");
const Zmn = require("./commands/Zmn.js");
const FitnessFirst = require("./commands/FitnessFirst.js");
const SuanPruek = require("./commands/SuanPruek.js");
const ZmnAuto = process.env.NODE_ENV == "production" ? require("./commands/ZmnAuto.js") : null;
const jsdom = require("jsdom");
const { JSDOM } = jsdom;
const express = require("express");
const bodyParser = require("body-parser");
var CronJob = require("cron").CronJob;
const line = require("@line/bot-sdk");
//================================
//        KEYS
//================================
//Line API
const config = {
  channelAccessToken: process.env.LINEACCESS,
  channelSecret: process.env.LINESECRET
};
const client = new line.Client(config);
var eventHandler = new LineEventHandler(client);
eventHandler.add(["rain", "rainvid"], new Rain());
var airHandler = new Air();
eventHandler.add("air", airHandler);
eventHandler.add("airloc", airHandler, "location");
eventHandler.add("log", new MyLog());
eventHandler.add("solve", new WolframSolve());
eventHandler.add(
  ["weather", "w", "w1", "w2", "w3", "w4", "w5", "w6", "w7", "w8", "w9", "w10"],
  new WeatherDarkSky()
);
eventHandler.add(
  ["wweather", "ww", "ww1", "ww2", "ww3", "ww4", "ww5", "ww6", "ww7", "ww8", "ww9", "ww10"],
  new Weathery()
);
eventHandler.add(["icmm"], new ThairunFaceSearch(), "image");
//eventHandler.add('utmf', new UTMF());
//eventHandler.add("pyt", new PYT());
eventHandler.add("zmn", new Zmn());
eventHandler.add("ff", new FitnessFirst());
var suanPruekHandler = new SuanPruek();
eventHandler.add(["settime", "gettime"], suanPruekHandler);
eventHandler.add("__", suanPruekHandler, "special");

if (process.env.NODE_ENV == "production") eventHandler.add("zmnauto", new ZmnAuto());
const app = express();
app.use(express.static("public"));
app.use(
  "/manga",
  bodyParser.urlencoded({
    extended: true
  })
);
app.use("/manga", bodyParser.json());
app.set("port", process.env.PORT || 5000);
app.post("/webhook", line.middleware(config), (req, res) => {
  req.body.events.forEach(evt => eventHandler.handleEvent(evt));
  res.send("");
});
var mangaHandler = new Manga(app);
eventHandler.add("manga", mangaHandler);
//eventHandler.logRules();
app.get("/to/:usrId/:msg", (req, res) => {
  if (process.env.NODE_ENV != "development") {
    client
      .pushMessage(req.params.usrId, {
        type: "text",
        text: req.params.msg
      })
      .catch(err => {
        console.log(err);
      });
  }
  res.send("send msg to " + req.params.usrId);
});
app.get("/test/:q", (req, res) => {
  if (process.env.NODE_ENV == "development") {
    eventHandler.handleEvent({
      type: "message",
      replyToken: "0",
      source: {
        userId: "1",
        type: "user"
      },
      timestamp: 1524631288368,
      message: {
        type: "text",
        id: "2",
        text: req.params.q
      }
    });
  }
  res.send("Ong Line Bot");
});
app.get("/utmfRunner", (req, res) => {
  // let url = 'https://utmb.livetrail.net/coureur.php?rech=' + req.query.bib;
  let url = "https://utmf.livetrail.net/coureur.php?rech=" + req.query.bib;
  console.log(url);
  let web = JSDOM.fromURL(url)
    .then(dom => {
      console.log(dom.window.document);
      let data = dom.window.document;
      if (!data.querySelector("state")) {
        res.status(404).send(";)");
        console.log("not found");
        return;
      }
      let state = data.querySelector("state").getAttribute("code");
      if (state === "a") {
        state = "DNF";
      } else if (state === "f") {
        state = "FINISHED";
      } else {
        state = null;
      }
      let last = -1;
      let cp = [];
      let pts = data.querySelectorAll("pts pt").forEach(row => {
        cp.push({
          idpt: row.getAttribute("idpt"),
          n: row.getAttribute("n"),
          nc: row.getAttribute("nc"),
          km: row.getAttribute("km"),
          nc: row.getAttribute("nc")
        });
      });
      let pass = data.querySelectorAll("pass e").forEach((row, i) => {
        Object.assign(cp[i], {
          racetime: row.getAttribute("tps"),
          rank: row.getAttribute("clt"),
          worldtime: row.getAttribute("hd") || row.getAttribute("ha")
        });
        last = i;
      });
      // Last CP REACHED
      let runner = {
        name:
          data.querySelector("identite").getAttribute("prenom") +
          " " +
          data.querySelector("identite").getAttribute("nom"),
        course: data
          .querySelector("fiche")
          .getAttribute("c")
          .toUpperCase(),
        country: data.querySelector("identite").getAttribute("nat"),
        status: state,
        last_update: cp[last] || undefined
      };
      res.status(200).json({
        runner,
        data: cp
      });
    })
    .catch(error => {
      console.log(error);
    });
});
app.get("*", function(req, res) {
  res.send("Ong Line Bot");
});
//Heroku setting
app.listen(app.get("port"), function() {
  console.log("Node app is running on port", app.get("port"));
});

// new CronJob({
//   cronTime: '0 0,10,20,30,40,50 * * * *',
//   onTick: function(){
//     var http = require('http');
//     http.get('http://linerain.herokuapp.com/');
//     console.log('-- prevent sleep cron --');
//   },
//   start: true,
//   timeZone: 'Asia/Bangkok',
//   runOnInit: true
// });
