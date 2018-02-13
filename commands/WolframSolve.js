var axios = require('axios');
var fs = require('fs');
var path = require('path');
const util = require('util');
const events = require('events');
const Cmd = function () {
  events.EventEmitter.call(this);
  const _this = this;
  this.handleEvent = function (evt, cmd, param) {
    axios.get('https://api.wolframalpha.com/v1/simple?i=' + encodeURIComponent(param) + '&appid=WYLR8V-YQWE8APE6A', {
      responseType: 'arraybuffer'
    }).then(r => {
      var ret = {}
      if (r.data.length < 100) {
        _this.emit('replyMessage', {
          replyToken: evt.replyToken,
          message: {
            "type": "text",
            "text": ";)*"
          }
        });
      } else {
        var solveImg = 'solve_' + (new Date().getTime()) + '.png';
        fs.writeFile(path.join(process.cwd(), '/./public/', solveImg), r.data, 'binary', function (err) {
          console.log(err);
          if (err) return;
          _this.emit('replyMessage', {
            replyToken: evt.replyToken,
            message: {
              "type": "image",
              "originalContentUrl": 'https://linerain.herokuapp.com/' + solveImg,
              "previewImageUrl": 'https://linerain.herokuapp.com/' + solveImg
            }
          });
        });
      }
    });
  }
  util.inherits(Cmd, events.EventEmitter);
}
module.exports = Cmd;
