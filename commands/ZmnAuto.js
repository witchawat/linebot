var axios = require('axios');
var emoji = require('node-emoji');
const util = require('util');
const events = require('events');
var cron = require('cron');
const FBadmin = require('firebase-admin');

FBadmin.initializeApp({
  credential: FBadmin.credential.cert({
    type: 'service_account',
    project_id: 'rainbot-f24dd',
    private_key_id: process.env.FB_PRIVATE_KEY_ID,
    private_key: process.env.FB_PRIVATE_KEY.replace(/\\n/g, '\n'),
    client_email: process.env.FB_CLIENT_EMAIL,
    client_id: process.env.FB_CLIENT_ID,
    auth_uri: 'https://accounts.google.com/o/oauth2/auth',
    token_uri: 'https://accounts.google.com/o/oauth2/token',
    auth_provider_x509_cert_url: 'https://www.googleapis.com/oauth2/v1/certs',
    client_x509_cert_url:
      'https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-a0u2y%40rainbot-f24dd.iam.gserviceaccount.com'
  }),
  databaseURL: 'https://rainbot-f24dd.firebaseio.com'
});

const FBDB = FBadmin.firestore();

var ZMN_PRICE_TRACK = false;
var ZMN_ALERT_LOW_PRICE = [3, 3.3, 3.4, 3.5, 3.6, 3.7]; //LOWER BOUND , Lowest value to High
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
    _this.emit('pushMessage', {
      to: 'Uf1763382b8cc53af0669ca2d44f880a0', // to Ong
      message: {
        type: 'text',
        text: zmnMsg
      }
    });
  };

  var zmnJob = new cron.CronJob({
    cronTime: '59 * * * * *',
    onTick: function() {
      axios
        .get('https://bx.in.th/api/')
        .then(res => {
          let zmnTick = {
            last: res.data[32].last_price,
            change: res.data[32].change
          };

          //save to Firebase
          FBDB.collection('zmn')
            .add({
              datetime: new Date(),
              price: zmnTick.last
            })
            .then(ref => {
              // console.log('Saved to FB with ID = ', ref.id);
            })
            .catch(err => {
              console.log('FB DB ERROR >> ', err);
            });

          //lower than lower bound or higher than higher bound
          outerloop_low: for (let i of ZMN_ALERT_LOW_PRICE) {
            if (zmnTick.last <= i && last_tick_price != i) {
              last_tick_price = i; //Set zmnP to LOW_PRICE
              console.log('Last tick price =', last_tick_price);
              console.log('i =', i);
              console.log('zmn last =', zmnTick.last);
              // price_alert = true;
              zmnAlertMsg(zmnTick);
              break outerloop_low;
            }
          }

          outerloop_high: for (let i of ZMN_ALERT_HIGH_PRICE) {
            if (zmnTick.last >= i && last_tick_price != i) {
              last_tick_price = i;
              // price_alert = true;
              zmnAlertMsg(zmnTick);
              break outerloop_high;
            }
          }

          // for (let i of ZMN_ALERT_LOW_CHANGE) {
          //   if (zmnTick.change <= i) {
          //     //Low % Change Alert
          //     last_tick_change = i;
          //     change_alert = true;
          //     break;
          //   }
          // }

          // for (let i of ZMN_ALERT_HIGH_CHANGE) {
          //   if (zmnTick.change >= i) {
          //     last_tick_change = i;
          //     change_alert = true;
          //     break;
          //   }
          // }

          //send msg
          // if (price_alert) {
          //   price_alert = false;
          //   var zmnMsg = emoji.emojify(
          //     `:money_with_wings::money_with_wings::money_with_wings::money_with_wings::money_with_wings: \nZMN Auto Price Alert\nLast: ${
          //       zmnTick.last
          //     }\nChange: ${zmnTick.change}%`
          //   );

          //   _this.emit('pushMessage', {
          //     to: 'C9484e01ebf9cc46a2f17a523354704f9', //EE Classified
          //     // to: 'Uf1763382b8cc53af0669ca2d44f880a0', // to Ong
          //     message: {
          //       type: 'text',
          //       text: zmnMsg
          //     }
          //   });
          // }
        })
        .catch();
    },
    start: false,
    timeZone: 'Asia/Bangkok'
  });
  function zmnAlertMsg(zmnTick) {
    let zmnMsg = emoji.emojify(
      `:money_with_wings::money_with_wings::money_with_wings::money_with_wings::money_with_wings: \nZMN Auto Price Alert\nLast: ${
        zmnTick.last
      }\nChange: ${zmnTick.change}%`
    );

    _this.emit('pushMessage', {
      // to: 'C9484e01ebf9cc46a2f17a523354704f9', //EE Classified
      to: 'Uf1763382b8cc53af0669ca2d44f880a0', // to Ong
      message: {
        type: 'text',
        text: zmnMsg
      }
    });
  }
  console.log('>>> ZMN Job Status >>> ', zmnJob.running);

  util.inherits(Cmd, events.EventEmitter);
};
module.exports = Cmd;
