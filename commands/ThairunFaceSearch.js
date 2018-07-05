var axios = require('axios');
//var pool = mysql.createPool(process.env.JAWSDB_URL);
const util = require('util');
const events = require('events');
const Cmd = function () {
  events.EventEmitter.call(this);
  const _this = this;
  this.handleEvent = function (evt, cmd, param) {
    if (cmd == 'pk') {
      console.log('param :: '+param);
      axios.get(`https://api.line.me/v2/bot/message/${evt.message.id}/content`, {
        responseType: 'arraybuffer',
        headers: {
          Authorization: 'Bearer ' + process.env.LINEACCESS
        }
      }).then(r => {
        var postData = {
          "operationName": "searchPhotosByFace",
          "variables": {
            "eventId": "PKRUNSS2",
            "refData": {
              "mimeType": "image/jpeg",
              "base64data": Buffer.from(r.data, 'binary').toString('base64')
            }
          },
          "query": `query searchPhotosByFace($eventId: MongoID, $refData: FileData!) {
  searchPhotosByFace(eventId: $eventId, refData:$refData) {
    items {
      similarity
      view {
        ...photoView
      }
    }
  }
}

fragment photoView on PhotoView {
  preview {
    url
  }
}
`
        }
        axios.post('https://api.photo.thai.run/graphql', postData).then(r => {
          var imgs = [],
            msg = 'ไม่พบภาพ';
          console.log(r.data);
          if (r.data.data.searchPhotosByFace) r.data.data.searchPhotosByFace.items.forEach(i => {
            imgs.push({
              score: i.similarity,
              url: i.view.preview.url
            });
          });
          imgs = imgs.sort(function (a, b) {
            return (a.score > b.score) ? -1 : 1;
          });
          /*
            .filter(i => {
            return i.score > 93
          });
          */
          imgs=imgs.slice(0,20);
          if (imgs.length) msg = imgs.map(i => {
            return i.url
          }).join(`\n\n`);
          _this.emit('replyMessage', {
            replyToken: evt.replyToken,
            message: {
              type: 'text',
              text: msg
            }
          });
        }).catch(e => {
          console.error('error calling thairun');
          console.log(e);
        });
      }).catch(e => {
        console.error('get img from line error');
        //console.log(e);
      });
    }
  }
  util.inherits(Cmd, events.EventEmitter);
}
module.exports = Cmd;
