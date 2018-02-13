var axios = require('axios');
var emoji = require('node-emoji');
const util = require('util');
const events = require('events');
const Cmd = function () {
  events.EventEmitter.call(this);
  const _this = this;
  this.handleEvent = function (evt, cmd, param) {
    if (param == '') {
      airInfo().then(r => {
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
          airInfo(r.data.results[0].geometry.location.lat, r.data.results[0].geometry.location.lng).then(r => {
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

  function airInfo(lat, lng) {
    //default is สวนลุม
    lat = lat || 13.730575;
    lng = lng || 100.541372;
    return axios.all(
      [
        axios.get('https://api.waqi.info/feed/geo:' + lat + ';' + lng + '/?token=' + process.env.AIRQUALITY_TOKEN),
        axios.get('http://api.openweathermap.org/data/2.5/uvi?appid=' + process.env.OPENWEATHERMAP_API_KEY + '&lat=' + lat + '&lon=' + lng)
      ]).then(axios.spread(
      (air, uv) => {
        let airData = air.data.data,
          uvindex = uv.data.value * 1,
          uvindex_warning = `${emoji.get(':white_check_mark:')} Low`,
          city = airData.city.name,
          city_url = airData.city.url,
          pm25 = (airData.iaqi.pm25) ? airData.iaqi.pm25.v * 1 : 0,
          temp = (airData.iaqi.t) ? airData.iaqi.t.v : 'no data ',
          humidity = (airData.iaqi.h) ? airData.iaqi.h.v : 'no data',
          time = airData.time.s,
          pm25_warning = `${emoji.get(':white_check_mark:')} Good`;
        if (pm25 > 51) {
          pm25_warning = `${emoji.get(':small_orange_diamond:')} Moderate`;
        };
        if (pm25 > 101) {
          pm25_warning = `${emoji.get(':large_orange_diamond:')} Unhealthy for Sensitive Groups`;
        };
        if (pm25 > 151) {
          pm25_warning = `${emoji.get(':bangbang:')} Unhealthy`;
        };
        if (pm25 > 201) {
          pm25_warning = `${emoji.get(':sos:')} Very Unhealthy`;
        };
        if (pm25 > 300) {
          pm25_warning = `${emoji.get(':skull:')} Hazardous`;
        };
        if (pm25 == 0) {
          pm25_warning = '';
          pm25 = 'no data';
        };
        if (uvindex > 3) {
          uvindex_warning = `${emoji.get(':small_orange_diamond:')} Moderate`;
        };
        if (uvindex > 6) {
          uvindex_warning = `${emoji.get(':large_orange_diamond:')} High`;
        };
        if (uvindex > 8) {
          uvindex_warning = `${emoji.get(':bangbang:')} Very High`;
        };
        if (uvindex > 11) {
          uvindex_warning = `${emoji.get(':sos:')} Extreme`;
        };
        return `Air Quality Index by AQICN
${emoji.get(':house:')} ${city}
${emoji.get(':vertical_traffic_light:')} PM2.5 = ${pm25} ${pm25_warning}
${emoji.get('thermometer')} ${temp}°C  Humidity = ${humidity}
${emoji.get('sunglasses')} UV Index ${uvindex} ${uvindex_warning}
Updated At ${emoji.get(':clock2:')} ${time}`;
      })).catch(err => {
      return 'API Error'
    });
  }
  util.inherits(Cmd, events.EventEmitter);
}
module.exports = Cmd;
