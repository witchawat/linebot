var axios = require("axios");
const util = require("util");
const events = require("events");
const Cmd = function() {
  events.EventEmitter.call(this);
  const _this = this;
  this.handleEvent = function(evt, cmd, param) {
    console.log(evt);
    axios
      .get(`https://api.line.me/v2/bot/room/${evt.source.roomId}/members/ids`, {
        headers: {
          Authorization: "Bearer " + process.env.LINEACCESS
        }
      })
      .then(r => {
        _this.emit("replyMessage", {
          replyToken: evt.replyToken,
          message: {
            type: "text",
            text:
              "userId : " +
              evt.source.userId +
              "\nroomId : " +
              evt.source.roomId +
              "\ngroupId : " +
              evt.source.groupId +
              "\nparam : " +
              param +
              "\nres : " +
              JSON.stringify(r.data)
          }
        });
      })
      .catch(e => console.error(e));
  };
  util.inherits(Cmd, events.EventEmitter);
};
module.exports = Cmd;
