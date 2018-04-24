var axios = require('axios');
const util = require('util');
const events = require('events');
const Cmd = function() {
  events.EventEmitter.call(this);
  const _this = this;
  this.handleEvent = function(evt, cmd, param) {
    if (!param) {
      _this.emit('replyMessage', {
        replyToken: evt.replyToken,
        message: {
          type: 'text',
          text: 'Please input BIB Number.'
        }
      });
    } else {
      axios
        .get(
          'https://linerain.herokuapp.com/utmfRunner?bib=' + encodeURI(param)
        )
        .then(r => {
          console.log(r);
          if (r) {
            _this.emit('replyMessage', {
              replyToken: evt.replyToken,
              message: {
                type: 'text',
                text: `${r.runner.name}`
              }
            });
          }
        })
        .catch();
    }
  };

  util.inherits(Cmd, events.EventEmitter);
};
module.exports = Cmd;
