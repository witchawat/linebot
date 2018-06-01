var axios = require('axios');
var emoji = require('node-emoji');
const util = require('util');
const events = require('events');
var cron = require('cron');

var ZMN_PRICE_TRACK = false;
var ZMN_ALERT_LOW_PRICE = [3, 3.5]; //LOWER BOUND , Lowest value to High
var ZMN_ALERT_HIGH_PRICE = [6, 5, 4]; //HIGHER BOUND, Highest value to Low
var ZMN_ALERT_LOW_CHANGE = [-10, -5];
var ZMN_ALERT_HIGH_CHANGE = [10, 5];
var last_tick_price = 0;
var last_tick_change = 0;
var price_alert = false;
var change_alert = false;

// EE Classified groupId = C9484e01ebf9cc46a2f17a523354704f9

const Cmd = function() {
  events.EventEmitter.call(this);
  const _this = this;
  this.handleEvent = function(evt, cmd, param) {
    ZMN_PRICE_TRACK = !ZMN_PRICE_TRACK; //Switch
    let zmnMsg = ZMN_PRICE_TRACK
      ? 'ZMN Auto Price Track: ACTIVATE'
      : 'ZMN Auto Price Track: DISABLE';
    if (ZMN_PRICE_TRACK) {
      zmnJob.start();
    } else {
      zmnJob.stop();
    }
    _this.emit('replyMessage', {
      replyToken: evt.replyToken,
      message: {
        type: 'text',
        text: zmnMsg
      }
    });
  };

  var zmnJob = new cron.CronJob({
    cronTime: '59 * * * * *',
    onTick: function() {
      axios.get('https://bx.in.th/api').then(res => {
        let zmnTick = {
          last: res.data[32].last_price,
          change: res.data[32].change
        };
        //lower than lower bound or higher than higher bound
        for (let i of ZMN_ALERT_LOW_PRICE) {
          if (zmnTick.last <= i) {
            last_tick_price = i; //Set zmnP to LOW_PRICE
            price_alert = true;
            break;
          }
        }

        for (let i of ZMN_ALERT_HIGH_PRICE) {
          if (zmnTick.last >= i) {
            last_tick_price = i;
            price_alert = true;
            break;
          }
        }

        for (let i of ZMN_ALERT_LOW_CHANGE) {
          if (zmnTick.change <= i) {
            //Low % Change Alert
            last_tick_change = i;
            change_alert = true;
            break;
          }
        }

        for (let i of ZMN_ALERT_HIGH_CHANGE) {
          if (zmnTick.change >= i) {
            last_tick_change = i;
            change_alert = true;
            break;
          }
        }
        //send msg
        _this.emit('pushMessage', {
          to: 'C9484e01ebf9cc46a2f17a523354704f9', //EE Classified
          message: {
            type: 'text',
            text: alertMsg || 'Alert!'
          }
        });
        // set nearest bound for next loop
      });
    },
    start: false,
    timeZone: 'Asia/Bangkok'
  });

  console.log('>>> ZMN Job Status >>> ', zmnJob.running);

  util.inherits(Cmd, events.EventEmitter);
};
module.exports = Cmd;
