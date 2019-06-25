const util = require("util");
const events = require("events");
var axios = require("axios");
var emoji = require("node-emoji");
let searchBranch = "QHL,SPG,SSQ";
let searchClass = "th-bodystep";

const Cmd = function() {
  events.EventEmitter.call(this);
  const _this = this;

  /*
    evt - เป็น event object เดิมๆจาก line
    cmd - !rain, !air ไรงี้ว่าไป
    param - เป็น text ตามหลัง เช่น
      !air สวนลุม => cmd=!air, param=สวนลุม
  */
  this.handleEvent = function(evt, cmd, param) {
    if (!param) {
      axios
        .get(
          "https://www.fitnessfirst.co.th/fitness-first/web-services/v2/timetable/%7B03D82E6E-083F-4F37-B877-9CAFC75D919C%7D/" +
            searchBranch
        )
        .then(r => {
          const cls = r.data.Timetable;
          // Filter only Today's CLASS
          let mtoday = cls.Morning.filter(c => c.IsToday == true);
          let atoday = cls.Afternoon.filter(c => c.IsToday == true);
          let etoday = cls.Evening.filter(c => c.IsToday == true);

          let m = findClassByName(mtoday[0].Classes, searchClass);
          let a = findClassByName(atoday[0].Classes, searchClass);
          let e = findClassByName(etoday[0].Classes, searchClass);

          let result = m.concat(a, e);
          let resultText = "";
          // Result to Text
          result.forEach(c => {
            let time = c.TimeText.slice(0, 8);
            let club = c.ClubTag;
            let title = c.Title;
            resultText += title + " " + time + " " + club + "\n";
          });
          _this.emit("replyMessage", {
            replyToken: evt.replyToken,
            message: {
              type: "text",
              text: "FF @ " + searchBranch + "\n" + resultText
            }
          });
        });
    } else {
      // with params here
      if (param != "all") {
        let branches = param.toUpperCase().split(/[\s,]+/);
        searchBranch = branches.toString();
        axios
          .get(
            "https://www.fitnessfirst.co.th/fitness-first/web-services/v2/timetable/%7B03D82E6E-083F-4F37-B877-9CAFC75D919C%7D/" +
              searchBranch
          )
          .then(r => {
            const cls = r.data.Timetable;
            // Filter only Today's CLASS
            let mtoday = cls.Morning.filter(c => c.IsToday == true);
            let atoday = cls.Afternoon.filter(c => c.IsToday == true);
            let etoday = cls.Evening.filter(c => c.IsToday == true);

            let m = findClassByName(mtoday[0].Classes, searchClass);
            let a = findClassByName(atoday[0].Classes, searchClass);
            let e = findClassByName(etoday[0].Classes, searchClass);

            let result = m.concat(a, e);
            let resultText = "";
            // Result to Text
            result.forEach(c => {
              let time = c.TimeText.slice(0, 8);
              let club = c.ClubTag;
              let title = c.Title;
              resultText += title + " " + time + " " + club + "\n";
            });
            _this.emit("replyMessage", {
              replyToken: evt.replyToken,
              message: {
                type: "text",
                text: "FF @ " + searchBranch + "\n" + resultText
              }
            });
          });
      }
      if (param == "all") {
        searchBranch =
          "P39,ICS,CTW,AIA,LMP,QHL,SSQ,SPG,CBN,CHW,CBR,RM9,CKK,CPK,RM2,RM3,RTB,CUD,FPK,PKS,MBN,SCS,T21,CRD,CRP,BKP,BKE,KRT,NWW,MTP,PRM";
        axios
          .get(
            "https://www.fitnessfirst.co.th/fitness-first/web-services/v2/timetable/%7B03D82E6E-083F-4F37-B877-9CAFC75D919C%7D/" +
              searchBranch
          )
          .then(r => {
            const cls = r.data.Timetable;
            // Filter only Today's CLASS
            let mtoday = cls.Morning.filter(c => c.IsToday == true);
            let atoday = cls.Afternoon.filter(c => c.IsToday == true);
            let etoday = cls.Evening.filter(c => c.IsToday == true);

            let m = findClassByName(mtoday[0].Classes, searchClass);
            let a = findClassByName(atoday[0].Classes, searchClass);
            let e = findClassByName(etoday[0].Classes, searchClass);

            let result = m.concat(a, e);
            let resultText = "";
            // Result to Text
            result.forEach(c => {
              let time = c.TimeText.slice(0, 8);
              let club = c.ClubTag;
              let title = c.Title;
              resultText += title + " " + time + " " + club + "\n";
            });
            _this.emit("replyMessage", {
              replyToken: evt.replyToken,
              message: {
                type: "text",
                text: "FF @ " + searchBranch + "\n" + resultText
              }
            });
          });
        axios
          .get(
            "https://www.fitnessfirst.co.th/fitness-first/web-services/v2/timetable/%7B03D82E6E-083F-4F37-B877-9CAFC75D919C%7D/" +
              searchBranch
          )
          .then(r => {
            const cls = r.data.Timetable;
            // Filter only Today's CLASS
            let mtoday = cls.Morning.filter(c => c.IsToday == true);
            let atoday = cls.Afternoon.filter(c => c.IsToday == true);
            let etoday = cls.Evening.filter(c => c.IsToday == true);

            let m = findClassByName(mtoday[0].Classes, searchClass);
            let a = findClassByName(atoday[0].Classes, searchClass);
            let e = findClassByName(etoday[0].Classes, searchClass);

            let result = m.concat(a, e);
            let resultText = "";
            // Result to Text
            result.forEach(c => {
              let time = c.TimeText.slice(0, 8);
              let club = c.ClubTag;
              let title = c.Title;
              resultText += title + " " + time + " " + club + "\n";
            });
            _this.emit("replyMessage", {
              replyToken: evt.replyToken,
              message: {
                type: "text",
                text: "FF @ " + searchBranch + "\n" + resultText
              }
            });
          });
      }
    }
  };
  util.inherits(Cmdevents.EventEmitter);
};
module.exports = Cmd;

function findClassByName(classes, name) {
  let result = [];
  classes.forEach(c => {
    c.ClassTypeTag == name ? result.push(c) : result;
  });
  return result;
}

function getClass(branch, workout) {
  axios
    .get(
      "https://www.fitnessfirst.co.th/fitness-first/web-services/v2/timetable/%7B03D82E6E-083F-4F37-B877-9CAFC75D919C%7D/" +
        branch
    )
    .then(r => {
      const cls = r.data.Timetable;
      // Filter only Today's CLASS
      let mtoday = cls.Morning.filter(c => c.IsToday == true);
      let atoday = cls.Afternoon.filter(c => c.IsToday == true);
      let etoday = cls.Evening.filter(c => c.IsToday == true);

      let m = findClassByName(mtoday[0].Classes, workout);
      let a = findClassByName(atoday[0].Classes, workout);
      let e = findClassByName(etoday[0].Classes, workout);

      let result = m.concat(a, e);
      let resultText = "";
      // Result to Text
      result.forEach(c => {
        let time = c.TimeText.slice(0, 8);
        let club = c.ClubTag;
        let title = c.Title;
        resultText += title + " " + time + " " + club + "\n";
      });
      _this.emit("replyMessage", {
        replyToken: evt.replyToken,
        message: {
          type: "text",
          text: "FF @ " + branch + "\n" + resultText
        }
      });
    });
}
