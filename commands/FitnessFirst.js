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
          let m = findClassByName(cls.Morning[0].Classes, searchClass);
          let a = findClassByName(cls.Afternoon[0].Classes, searchClass);
          let e = findClassByName(cls.Evening[0].Classes, searchClass);

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
              text: resultText
            }
          });
        });
    } else {
      // with params here
    }
  };
  util.inherits(Cmd, events.EventEmitter);
};
module.exports = Cmd;

function findClassByName(classes, name) {
  let result = [];
  classes.forEach(c => {
    c.ClassTypeTag == name ? result.push(c) : result;
  });
  return result;
}
