var axios = require('axios');
var emoji = require('node-emoji');
const util = require('util');
const events = require('events');
const Cmd = function() {
  events.EventEmitter.call(this);
  const _this = this;
  this.handleEvent = function(evt, cmd, param) {
    axios
      .get('https://bx.in.th/api/')
      .then(res => {
        let zmn = res.data[32];
        let last24 = Math.floor(zmn.volume_24hours).toLocaleString();
        let sign = zmn.change < 0 ? ':bangbang:' : ':smile::smile:';
        _this.emit('replyMessage', {
          replyToken: evt.replyToken,
          message: {
            type: 'text',
            text: emoji.emojify(
              `:beginner:ZMN\nLast: ${zmn.last_price}\nChange: ${
                zmn.change
              }% ${sign}\n24Hr Vol: ${last24} ZMN`
            )
          }
        });
      })
      .catch(console.log('ZMN CMD ERROR'));
  };

  util.inherits(Cmd, events.EventEmitter);
};
module.exports = Cmd;
