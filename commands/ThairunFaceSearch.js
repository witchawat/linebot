var axios = require('axios');
//var pool = mysql.createPool(process.env.JAWSDB_URL);
const util = require('util');
const events = require('events');
const Cmd = function () {
  events.EventEmitter.call(this);
  const _this = this;
  this.handleEvent = function (evt, cmd, param) {
    if (cmd == 'imgbase64') {
      console.log('mangaImg');
      console.log(evt);
      axios.get(`https://api.line.me/v2/bot/message/${evt.message.id}/content`, {
        responseType: 'arraybuffer',
        headers: {
          Authorization: 'Bearer ' + process.env.LINEACCESS
        }
      }).then(r => {
        var b64 = Buffer.from(r.data, 'binary').toString('base64');
        console.log(b64);
        console.log(r.headers);
      }).catch(e => {
        console.error('get img from line error');
        console.log(e);
      });
    }
  }
  util.inherits(Cmd, events.EventEmitter);
}
module.exports = Cmd;
