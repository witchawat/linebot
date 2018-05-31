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
      .then(data => {
        let zmn = data[32];
        _this.emit('replyMessage', {
          replyToken: evt.replyToken,
          message: {
            type: 'text',
            text: `ZMN
              Last: ${zmn.last_price}
              24Hr Vol: ${zmn.volume_24hours}`
          }
        });
      })
      .catch();
  };

  util.inherits(Cmd, events.EventEmitter);
};
module.exports = Cmd;
