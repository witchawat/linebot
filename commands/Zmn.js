var axios = require('axios');
var emoji = require('node-emoji');
const util = require('util');
const events = require('events');
const Cmd = function() {
  events.EventEmitter.call(this);
  const _this = this;
  this.handleEvent = function(evt, cmd, param) {
    if (!param) {
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
    } else {
      let cmderror = true;
      var [buysell, ...accum] = param.toLowerCase().split(/[\s,]+/);

      if (['buy', 'sell'].indexOf(buysell) >= 0) {
        cmderror = false;
      }

      let total = parseInt(accum[0]);

      if (typeof total == 'number' && !cmderror) {
        axios.get('https://bx.in.th/api/orderbook/?pairing=32').then(res => {
          let data = [];
          let msg = '';
          if (buysell == 'buy') {
            data = res.data.asks;
          } else if (buysell == 'sell') {
            data = res.data.bids;
          }

          let accum_total = 0;

          for (row of data) {
            let price = row[0];
            let vol = row[1];
            accum_total += price * vol;
            if (accum_total >= total) {
              msg = `ZMN Total ${buysell} vol of ${total} @ ${price}`;
              _this.emit('replyMessage', {
                replyToken: evt.replyToken,
                message: {
                  type: 'text',
                  text: msg
                }
              });
              break;
            }
          }
        });
      }
    }
  };

  util.inherits(Cmd, events.EventEmitter);
};
module.exports = Cmd;
