var axios = require("axios");
const util = require("util");
var mysql = require("mysql");
const events = require("events");
const jsdom = require("jsdom");
const { JSDOM } = jsdom;
var emoji = require("node-emoji");
var CronJob = require("cron").CronJob;
const redis = require("redis");
var redisClient = redis.createClient(process.env.REDISCLOUD_URL, {
  no_ready_check: true
});
const Cmd = function() {
  events.EventEmitter.call(this);
  const _this = this;
  this.handleEvent = async function(evt, cmd, param) {
    if (!param) {
      _this.emit("replyMessage", {
        replyToken: evt.replyToken,
        message: {
          type: "text",
          text: "Please input BIB Number."
        }
      });
    } else {
      var [cmCmd, ...bibs] = param.toLowerCase().split(/[\s,]+/);
      var replyId = evt.source.userId;
      replyId = evt.source.roomId ? evt.source.roomId : replyId;
      replyId = evt.source.groupId ? evt.source.groupId : replyId;
      if (["add", "list", "del"].indexOf(cmCmd) >= 0) {
        var settings = await getSettings();
        var runners = await getRunnersInfo();
        var isSettingChange = false;
        var isRunnersChange = false;
        var ret = [];
        //console.log('settings ' + JSON.stringify(settings, null, 2));
        if (cmCmd == "add") {
          var checkedBibs = await Promise.all(
            bibs.map(async _ => {
              return await runnerInfo(_);
            })
          );
          checkedBibs.map(_ => {
            if (!_.runner) return;
            var bib = _.runner.bib;
            settings[bib] = settings[bib] || [];
            if (settings[bib].indexOf(replyId) === -1) {
              ret.push("added :: " + formatInfo(_));
              settings[bib].push(replyId);
              isSettingChange = true;
            }
            if (!runners[bib]) {
              isRunnersChange = true;
              runners[bib] = _;
            }
          });
        }
        if (cmCmd == "del") {
          bibs.map(bib => {
            if (!settings[bib]) return;
            var idx = settings[bib].indexOf(replyId);
            if (idx !== -1) {
              ret.push(
                "deleted :: " +
                  (runners[bib] != undefined
                    ? `[${runners[bib].runner.bib}] ${runners[bib].runner.name}`
                    : bib)
              );
              settings[bib].splice(idx, 1);
              if (settings[bib].length == 0) delete settings[bib];
              isSettingChange = true;
            }
          });
        }
        if (cmCmd == "list") {
          var trackingBibs = [];
          for (var k in settings) {
            if (settings[k].indexOf(replyId) !== -1) trackingBibs.push(k);
          }
          var trackingRunners = await Promise.all(
            trackingBibs.map(async _ => {
              return await runnerInfo(_);
            })
          );
          if (trackingRunners.length) {
            ret.push("Tracking...");
            trackingRunners.map(_ =>
              ret.push(`${_.runner.course}[${_.runner.bib}] ${_.runner.name}`)
            );
          } else {
            ret.push("Tracking list is empty");
          }
        }
        if (isSettingChange) {
          //console.log('settings changed to ' + JSON.stringify(settings, null, 2));
          redisClient.set(
            "cm",
            JSON.stringify(settings),
            "EX",
            30 * 24 * 60 * 60
          );
        }
        if (isRunnersChange) {
          //console.log('runners changed to ' + JSON.stringify(runners, null, 2));
          redisClient.set(
            "cmRunnerInfo",
            JSON.stringify(runners),
            "EX",
            30 * 24 * 60 * 60
          );
        }
        if (!ret.length) return;
        _this.emit("replyMessage", {
          replyToken: evt.replyToken,
          message: {
            type: "text",
            text: ret.join(`\n`)
          }
        });
      } else {
        //search runner by name
        var info = await searchRunners(cmCmd);
        _this.emit("replyMessage", {
          replyToken: evt.replyToken,
          message: {
            type: "text",
            text: info
          }
        });
      }
    }
  };

  async function searchRunners(qStr) {
    var ret = [];
    var rows = await q(
      "select * from cm where runnerName like ? limit 10",
      `%${qStr}%`
    );
    rows.forEach(r => {
      ret.push(`${r.course}[${r.bib}] ${r.runnerName}`);
    });
    if (ret) return ret.join(`\n`);
    return "search not found";
  }

  function getSettings() {
    return new Promise((resolve, reject) => {
      redisClient.get("cm", function(err, _) {
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
    });
  }

  function getRunnersInfo() {
    return new Promise((resolve, reject) => {
      redisClient.get("cmRunnerInfo", function(err, _) {
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
    });
  }
  async function updateRunnersInfo() {
    try {
      var settings = await getSettings();
      var runners = await getRunnersInfo();
      var bibs = [];
      var isRunnersChange = false;
      for (var k in settings)
        if (!runners[k] || runners[k].runner.status == "") bibs.push(k);
      for (var k in runners)
        if (!settings[k]) {
          isRunnersChange = true;
          delete runners[k];
        }

      var currInfo = await Promise.all(
        bibs.map(async _ => {
          return await runnerInfo(_);
        })
      );
      //console.log(JSON.stringify(currInfo, null, 1));
      currInfo.map(info => {
        if (!info || !info.runner) return;
        var bib = info.runner.bib;
        // new runner, แบบว่าเพิ่ง check ครั้งแรกงี้
        if (
          !runners[bib] ||
          runners[bib].runner.lastCp != info.runner.lastCp ||
          runners[bib].runner.status != info.runner.status
        ) {
          isRunnersChange = true;
          runners[bib] = info;
          notify(info, settings[bib]);
        }
      });
      if (isRunnersChange) {
        //console.log('runners changed to ' + JSON.stringify(runners, null, 2));
        redisClient.set(
          "cmRunnerInfo",
          JSON.stringify(runners),
          "EX",
          30 * 24 * 60 * 60
        );
      }
    } catch (e) {
      console.log(" -=* Error UpdateRunnersInfo *=- ");
    }
    console.log(" -=* updateRunnersInfo *=- " + bibs.length);
  }
  // notify to subscribers
  function notify(info, replyIds) {
    var replyTxt = formatInfo(info);
    replyIds.map(replyId => {
      _this.emit("pushMessage", {
        to: replyId,
        message: {
          type: "text",
          text: replyTxt
        }
      });
    });
    console.log("notifying ", info.runner.name, replyIds);
  }

  function formatInfo(info) {
    var runner = info.runner;
    var runnerEmoji = emoji.get("runner");
    var pinEmoji = emoji.get("pushpin");
    var ret = `[${runner.bib}] ${runnerEmoji} ${runner.name} (${
      runner.course
    })`;
    ret += runner.status ? ` -- ${runner.status}` : "";
    if (runner.lastCp) {
      ret += `${pinEmoji} (${runner.lastCp}) [${runner.km} / ${
        runner.maxKM
      } km]`;
    }
    return ret;
  }

  function runnerInfo(_bib) {
    return new Promise((resolve, reject) => {
      let url = "https://race.chillingtrail.run/cm6/r/" + encodeURI(_bib);
      let web = JSDOM.fromURL(url)
        .then(dom => {
          let tbls = dom.window.document.querySelectorAll("table");
          if (!tbls || tbls.length != 2) {
            resolve({});
            return;
          }
          let tbl2tds = tbls[1].querySelectorAll("td");
          let bib = tbls[0].querySelectorAll("td")[0].textContent;
          let name = tbls[0].querySelectorAll("td")[1].textContent;
          let course = tbls[0].querySelectorAll("td")[2].textContent;
          let status = tbls[0].querySelectorAll("td")[4].textContent;
          let maxKM = tbl2tds[tbl2tds.length - 4].textContent;
          let i = 0,
            lastCp = "",
            km = 0,
            raceTime = "",
            action = "";
          while (i < tbl2tds.length) {
            if (tbl2tds[i + 2].textContent != "-") {
              lastCp = tbl2tds[i].textContent;
              km = tbl2tds[i + 1].textContent;
              raceTime = tbl2tds[i + 2].textContent;
              action = tbl2tds[i + 3].textContent;
            }
            i += 5;
          }
          let runner = {
            bib,
            name,
            course,
            status,
            maxKM,
            lastCp,
            km,
            raceTime,
            action
          };
          resolve({
            runner
          });
        })
        .catch(error => {
          //console.log(error);
          resolve({});
        });
    });
  }
  function q() {
    var qStr = arguments[0];
    var dat = arguments[1];
    return new Promise(resolve => {
      var connection = mysql.createConnection(process.env.JAWSDB_URL);
      connection.connect();
      connection.query(qStr, dat, function(error, results, fields) {
        if (error) {
          console.log(error);
          resolve(null);
        } else {
          resolve(results);
        }
      });
      connection.end();
    });
  }
  new CronJob({
    cronTime: "59 * * * * *",
    onTick: updateRunnersInfo,
    start: true,
    timeZone: "Asia/Bangkok",
    runOnInit: true
  });
  util.inherits(Cmd, events.EventEmitter);
};
module.exports = Cmd;
