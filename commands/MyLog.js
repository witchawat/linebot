var axios = require("axios");
const util = require("util");
const events = require("events");
const Cmd = function() {
  events.EventEmitter.call(this);
  const _this = this;
  this.handleEvent = function(evt, cmd, param) {
    console.log(evt);
    if(param=='flex'){
       _this.emit("replyMessage", {
         replyToken: evt.replyToken,
         message: {
           type: "flex",
           altText: "this is flex message",
           contents: {
             type: "bubble", // ①
             body: {
               // ②
               type: "box", // ③
               layout: "horizontal", // ④
               contents: [
                 // ⑤
                 {
                   type: "text", // ⑥
                   text: "Hello,"
                 },
                 {
                   type: "text", // ⑥
                   text: "World!"
                 }
               ]
             }
           }
         }
       });
      return;
    }
    var res = "";
    axios
      .get(`https://api.line.me/v2/bot/profile/${param}`, {
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
      .catch(e => {
        console.log(e);
        
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
              param
          }
        });
      });
  };
  util.inherits(Cmd, events.EventEmitter);
};
module.exports = Cmd;
