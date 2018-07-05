const MAX_RETURN_PICS=40;
var axios = require('axios');
const util = require('util');
const events = require('events');
const Cmd = function () {
  events.EventEmitter.call(this);
  const _this = this;
  this.handleEvent = function (evt, cmd, param) {
    var replyId = evt.source.userId;
    replyId = (evt.source.roomId) ? evt.source.roomId : replyId;
    replyId = (evt.source.groupId) ? evt.source.groupId : replyId;
    var picCount = 3;
    if (!isNaN(param * 1)) picCount = param * 1;
    picCount = (picCount < 1) ? 1 : picCount;
    picCount = (picCount > MAX_RETURN_PICS) ? MAX_RETURN_PICS : picCount;
    if (cmd == 'pk') {
      searchFace('PKRUNSS2', replyId, picCount, evt.message.id);
    }
  }

  function searchFace(raceName, replyId, picCount, contentId) {
    axios.get(`https://api.line.me/v2/bot/message/${contentId}/content`, {
      responseType: 'arraybuffer',
      headers: {
        Authorization: 'Bearer ' + process.env.LINEACCESS
      }
    }).then(r => {
      var postData = {
        "operationName": "searchPhotosByFace",
        "variables": {
          "eventId": raceName,
          "refData": {
            "mimeType": "image/jpeg",
            "base64data": Buffer.from(r.data, 'binary').toString('base64')
          }
        },
        "query": `
query searchPhotosByFace($eventId: MongoID, $refData: FileData!) {
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
  thumbnail {
    url
  }
}
`
      }
      axios.post('https://api.photo.thai.run/graphql', postData).then(r => {
        var imgs = [],
          msg = 'ไม่พบภาพ';
        if (r.data.data.searchPhotosByFace) r.data.data.searchPhotosByFace.items.forEach(i => {
          imgs.push({
            score: i.similarity,
            url: i.view.preview.url,
            tmb: i.view.thumbnail.url
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
        imgs = imgs.slice(0, picCount);
        if (imgs.length) {
          imgs.map(i => {
            _this.emit('pushMessage', {
              to: replyId,
              message: {
                "type": "image",
                "originalContentUrl": i.url,
                "previewImageUrl": i.tmb
              }
            });
          });
          return;
        }
        _this.emit('pushMessage', {
          to: replyId,
          message: {
            type: 'text',
            text: 'ไม่พบภาพ'
          }
        });
      }).catch(e => {
        console.error('error calling thairun');
        _this.emit('pushMessage', {
          to: replyId,
          message: {
            type: 'text',
            text: 'ไม่พบภาพ'
          }
        });
        //console.log(e);
      });
    }).catch(e => {
      console.error('get img from line error');
      //console.log(e);
    });
  }
  util.inherits(Cmd, events.EventEmitter);
}
module.exports = Cmd;
