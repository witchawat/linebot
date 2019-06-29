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
             type: "bubble",
             hero: {
               type: "image",
               url: "https://aoiaoi.herokuapp.com/img/hightImg.jpg",
               size: "full",
               aspectRatio: "20:13",
               aspectMode: "cover",
               action: {
                 type: "uri",
                 uri: "https://aoiaoi.herokuapp.com/vid.html"
               }
             },
             styles: {
               footer: {
                 separator: true
               }
             },
             body: {
               type: "box",
               layout: "vertical",
               contents: [
                 {
                   type: "text",
                   text: "ชุดข้อมูล",
                   weight: "bold",
                   color: "#1DB446",
                   size: "sm"
                 },
                 {
                   type: "text",
                   text: "13.69480975 , 100.67254996",
                   size: "xs",
                   color: "#aaaaaa",
                   wrap: true
                 },
                 {
                   type: "separator",
                   margin: "xxl"
                 },
                 {
                   type: "box",
                   layout: "vertical",
                   margin: "xxl",
                   spacing: "sm",
                   contents: [
                     {
                       type: "box",
                       layout: "horizontal",
                       contents: [
                         {
                           type: "text",
                           text: "Brix",
                           size: "sm",
                           color: "#555555",
                           flex: 0
                         },
                         {
                           type: "text",
                           text: "26.7",
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
                           text: "น้ำหนัก (Kg)",
                           size: "sm",
                           color: "#555555",
                           flex: 0
                         },
                         {
                           type: "text",
                           text: "0.65",
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
                           text: "Note",
                           size: "sm",
                           color: "#555555",
                           flex: 0
                         }
                       ]
                     },
                     {
                       type: "text",
                       text:
                         "some long long long long long long long long long long long long long long long long long long long long long long long long long long long long long long long long long long note",
                       wrap: true,
                       color: "#aaaaaa",
                       size: "xxs"
                     }
                   ]
                 }
               ]
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
                   color: "#009900",
                   action: {
                     type: "uri",
                     uri: "line://app/1526734026-V3AxnYZl",
                     label: "lifff"
                   }
                 },
                 {
                   type: "button",
                   style: "link",
                   height: "sm",
                   action: {
                     type: "message",
                     label: "บันทึก",
                     text: "บันทึก"
                   }
                 },
                 {
                   type: "button",
                   style: "link",
                   height: "sm",
                   color: "#aa0000",
                   action: {
                     type: "message",
                     label: "ยกเลิก",
                     text: "ยกเลิก"
                   }
                 },
                 {
                   type: "spacer",
                   size: "sm"
                 }
               ],
               flex: 0
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
