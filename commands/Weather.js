var axios = require('axios');
var emoji = require('node-emoji');
const util = require('util');
const events = require('events');
const Cmd = function () {
  events.EventEmitter.call(this);
  const _this = this;

  axios.defaults.headers.common['Authorization'] = 'Bearer ' + process.env.TMD_TOKEN;
  this.handleEvent = function (evt, cmd, param) {
    if (!param) {
      weatherInfo().then(r => {
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
          weatherInfo(r.data.results[0].geometry.location.lat, r.data.results[0].geometry.location.lng).then(r => {
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

  function weatherInfo(lat, lng) {
    //default is บ่อขยะอ่อนนุช
    lat = lat || 13.7070603;
    lng = lng || 100.6801283;
    return axios.get("http://data.tmd.go.th/nwpapi/v1/forecast/location/hourly/at?lat="+lat+"&lon="+lng+"&fields=tc,wd10m,cond&duration=5").then(resp => {
var tmp='';

tmp+=emoji.get('sunny');
tmp+=emoji.get('mostly_sunny');
tmp+=emoji.get('barely_sunny');
tmp+=emoji.get('cloud');
tmp+=emoji.get('partly_sunny_rain');
tmp+=emoji.get('rain_cloud');
tmp+=emoji.get('thunder_cloud_and_rain');
tmp+=emoji.get('snow');
tmp+=emoji.get('lightning');
tmp+=emoji.get('fire');
tmp+=emoji.get('cool');
tmp+=emoji.get('snow');
tmp+=`\n\n`;
        return tmp+resp.data.WeatherForecasts[0].forecasts.map(v=>forecast2string(v)).join(', ');
      }).catch(err => {
      return 'API Error'
    });
  }

function forecast2string(inp){
  var ret='',t,dir,dirEmoji;
  dir=inp.data.wd10m/22.5;
  t=(new Date(inp.time)).getHours()%12;
  t=(t<1)?12:t;
  ret+=emoji.get('clock'+t)+' ';
  ret+=(inp.data.cond==1)?emoji.get('sunny'):'';
  ret+=(inp.data.cond==2)?emoji.get('mostly_sunny'):'';
  ret+=(inp.data.cond==3)?emoji.get('barely_sunny'):'';
  ret+=(inp.data.cond==4)?emoji.get('cloud'):'';
  ret+=' ';
  ret+=(dir>=15||dir<1)?emoji.get('arrow_down'):'';
  ret+=(1<=dir&&dir<3)?emoji.get('arrow_lower_left'):'';
  ret+=(3<=dir&&dir<5)?emoji.get('arrow_left'):'';
  ret+=(5<=dir&&dir<7)?emoji.get('arrow_upper_left'):'';
  ret+=(7<=dir&&dir<9)?emoji.get('arrow_up'):'';
  ret+=(9<=dir&&dir<11)?emoji.get('arrow_upper_right'):'';
  ret+=(11<=dir&&dir<13)?emoji.get('arrow_right'):'';
  ret+=(13<=dir&&dir<15)?emoji.get('arrow_lower_right'):'';
  ret+=' '+inp.data.tc.toFixed(0)+'°C';
  return ret;
}
  util.inherits(Cmd, events.EventEmitter);
}
module.exports = Cmd;
