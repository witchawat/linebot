var axios = require('axios');
//var pool = mysql.createPool(process.env.JAWSDB_URL);
const util = require('util');
const events = require('events');
const Cmd = function () {
  events.EventEmitter.call(this);
  const _this = this;
  this.handleEvent = function (evt, cmd, param) {
    if (cmd == 'pk') {
      console.log('mangaImg');
      console.log(evt);
      axios.get(`https://api.line.me/v2/bot/message/${evt.message.id}/content`, {
        responseType: 'arraybuffer',
        headers: {
          Authorization: 'Bearer ' + process.env.LINEACCESS
        }
      }).then(r => {
        var b64 = Buffer.from(r.data, 'binary').toString('base64');
        var postData = {
          "operationName": "searchPhotosByFace",
          "variables": {
            "eventId": "PKRUNSS2",
            "refData": {
              "mimeType": "image/jpeg",
              "base64data": b64
            }
          },
          "query": `query searchPhotosByFace($eventId: MongoID, $refData: FileData!) {
  searchPhotosByFace(eventId: $eventId, refData:$refData) {
    count
    items {
      _id
      similarity
      event
      photographer
      fileName
     downloadMode
      info {
        dateTimeTaken
        __typename
      }
      view {
        ...photoView
       __typename
      }
      image {
        small {
          price
          size {
            width
           height
            __typename
          }
          __typename
        }
        medium {
          price
          size{
            width
            height
            __typename
          }
          __typename
        }
        large{
          price
          size {
            width
            height
            __typename
          }
         __typename
        }
        xlarge {
          price
          size {
            width
            height
           __typename
          }
          __typename
        }
        A4 {
          price
          size {
           width
            height
            __typename
          }
          __typename
        }
        __typename
      }
     photographer_ {
        _id
        displayName
        username
        __typename
      }
      __typename
    }
   __typename
  }
}

fragment photoView on PhotoView {
  preview {
    url
    size {
      width
      height
     __typename
    }
    __typename
  }
  thumbnail {
    url
    size {
      width
      height
      __typename
    }
   __typename
  }
  __typename
}
`
        }
        axios.post('https://api.photo.thai.run/graphql', postData, {
          'headers': {
            'Origin': 'https://photo.thai.run',
            'content-type': 'application/json',
            'Host': 'api.photo.thai.run',
            'Referer': 'https://photo.thai.run/PKRUNSS2'
          }
        }).then(r => {
          console.log(r.data);
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
