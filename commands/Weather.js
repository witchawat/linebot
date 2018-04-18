var axios = require('axios');
var emoji = require('node-emoji');
const util = require('util');
const events = require('events');
const Cmd = function() {
  events.EventEmitter.call(this);
  const _this = this;

  axios.defaults.headers.common['Authorization'] = 'Bearer ' + process.env.TMD_TOKEN;
  this.handleEvent = function(evt, cmd, param) {
    var duration = 1;
    duration = (cmd == 'w2') ? 2 : duration;
    duration = (cmd == 'w3') ? 3 : duration;
    duration = (cmd == 'w4') ? 4 : duration;
    duration = (cmd == 'w5') ? 5 : duration;
    duration = (cmd == 'w6') ? 6 : duration;
    if (!param) {
      weatherInfo(duration).then(r => {
        _this.emit('replyMessage', {
          replyToken: evt.replyToken,
          message: {
            type: "text",
            text: r
          }
        });
      });
    } else {
      axios.get('https://maps.googleapis.com/maps/api/geocode/json?address=' + encodeURI(param) + '&key=' + process.env.STATIC_MAP_API_KEY + '&language=th').then(r => {
        if (r.data.results.length) {
          var formatted_address = r.data.results[0].formatted_address;
          weatherInfo(duration, r.data.results[0].geometry.location.lat, r.data.results[0].geometry.location.lng).then(r => {
            _this.emit('replyMessage', {
              replyToken: evt.replyToken,
              message: {
                type: "text",
                text: `[ ${formatted_address} ]\n\n` + r
              }
            });
          });
        }
      }).catch();
    }
  }

  function weatherInfo(duration, lat, lng) {
    //default is บ่อขยะอ่อนนุช
    lat = lat || 13.7070603;
    lng = lng || 100.6801283;
    return axios.get("http://data.tmd.go.th/nwpapi/v1/forecast/location/hourly/at?lat=" + lat + "&lon=" + lng + "&fields=tc,wd10m,cond&duration=" + duration).then(resp => {
      console.log(JSON.stringify(resp.data, null, 2));
      return resp.data.WeatherForecasts[0].forecasts.map(v => forecast2string(v)).join(`\n`);
    }).catch(err => {
      return 'API Error'
    });
  }

  function forecast2string(inp) {
    var ret = '',
      t, dir, sunnyEmoji;
    dir = inp.data.wd10m / 22.5;
    t = (new Date(inp.time)).getHours();
    sunnyEmoji = (6 <= t && t <= 18) ? emoji.get('sunny') : emoji.get('night_with_stars');
    t %= 12;
    t = (t < 1) ? 12 : t;
    ret += emoji.get('clock' + t) + ' ';
    ret += (inp.data.cond == 1) ? sunnyEmoji : '';
    ret += (inp.data.cond == 2) ? emoji.get('mostly_sunny') : '';
    ret += (inp.data.cond == 3) ? emoji.get('barely_sunny') : '';
    ret += (inp.data.cond == 4) ? emoji.get('cloud') : '';
    ret += (inp.data.cond == 5) ? emoji.get('partly_sunny_rain') : '';
    ret += (inp.data.cond == 6) ? emoji.get('rain_cloud') : '';
    ret += (inp.data.cond == 7) ? emoji.get('lightning') : '';
    ret += (inp.data.cond == 8) ? emoji.emojify(':lightning::lightning:') : '';
    ret += (9 <= inp.data.cond && resp.data.cond <= 11) ? emoji.get('snowflake') : '';
    ret += (inp.data.cond == 12) ? emoji.get('fire') : '';
    ret += ' ';
    ret += (dir >= 15 || dir < 1) ? emoji.get('arrow_down') : '';
    ret += (1 <= dir && dir < 3) ? emoji.get('arrow_lower_left') : '';
    ret += (3 <= dir && dir < 5) ? emoji.get('arrow_left') : '';
    ret += (5 <= dir && dir < 7) ? emoji.get('arrow_upper_left') : '';
    ret += (7 <= dir && dir < 9) ? emoji.get('arrow_up') : '';
    ret += (9 <= dir && dir < 11) ? emoji.get('arrow_upper_right') : '';
    ret += (11 <= dir && dir < 13) ? emoji.get('arrow_right') : '';
    ret += (13 <= dir && dir < 15) ? emoji.get('arrow_lower_right') : '';
    ret += ' ' + inp.data.tc.toFixed(0) + '°C';
    return ret;
  }
  util.inherits(Cmd, events.EventEmitter);
}
module.exports = Cmd;
