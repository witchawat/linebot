var request = require('request');
var Gfy = function () {
  var gfyClientId, gfyClientSecret;
  var lastUpdate = new Date('2017-01-01'),
    gfyStat = '',
    thumbUrl = '',
    imgUrl = '',
    vidUrl = '';
};
Gfy.prototype.gfyAuth = function () {
  return new Promise((resolve, reject) => {
    var data = {
      "client_id": this.gfyClientId,
      "client_secret": this.gfyClientSecret,
      "grant_type": "client_credentials"
    }
    request({
      headers: {
        'Content-Type': 'application/json'
      },
      url: 'https://api.gfycat.com/v1/oauth/token',
      method: 'POST',
      body: data,
      json: true
    }, function (err, _res, body) {
      if (err) reject('');
      if (body) resolve(body.access_token);
      reject('');
    });
  });
}
Gfy.prototype.getGfy = function (gfyname, token) {
  return new Promise((resolve, reject) => {
    var _this = this;
    request({
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + token
      },
      url: 'https://api.gfycat.com/v1/gfycats/' + gfyname,
      method: 'GET',
      json: true
    }, function (err, _res, body) {
      if (err) reject('');
      if (body) {
        if (body.gfyItem.mobileUrl) {
          _this.lastUpdate = new Date();
          _this.imgUrl = body.gfyItem.posterUrl;
          _this.thumbUrl = body.gfyItem.mobilePosterUrl;
          _this.vidUrl = body.gfyItem.mobileUrl;
          _this.gfyStat = 'ok';
          resolve('');
        } else {
          _this.gfyStat = 'noVid';
          reject('');
        }
      }
    });
  });
}
Gfy.prototype.getGfyStat = function (gfyname, token) {
  return new Promise((resolve, reject) => {
    request({
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + token
      },
      url: 'https://api.gfycat.com/v1/gfycats/fetch/status/' + gfyname,
      method: 'GET',
      json: true
    }, function (err, _res, body) {
      if (err) {
        reject('');
      }
      if (body) {
        if (body.gfyName) {
          resolve(body.gfyName);
        }
        if (body.gfyname) {
          resolve(body.gfyname);
        }
        reject(body.time);
      }
    });
  });
}
Gfy.prototype.gfyPost = function () {
  return new Promise((resolve, reject) => {
    var data = {
      fetchUrl: "http://203.155.220.231/Radar/pics/nkradar.gif?v=" + (new Date().getTime()),
      title: 'Bangkok Weather ' + (new Date().getTime())
    }
    request({
      headers: {
        'Content-Type': 'application/json'
      },
      url: 'https://api.gfycat.com/v1/gfycats',
      method: 'POST',
      body: data,
      json: true
    }, function (err, _res, body) {
      if (err) {
        reject('');
      }
      if (body) {
        resolve(body.gfyname);
      }
      reject('');
    });
  });
}
Gfy.prototype.init = function (i, s) {
  this.gfyClientId = i;
  this.gfyClientSecret = s;
};
Gfy.prototype.genWeatherImgAndVid = async function () {
  var gfyname, token, gfyObj;
  var isDone = false;
  try {
    token = await this.gfyAuth();
    gfyname = await this.gfyPost();
    var checkCount = 0;
    while (checkCount < 10) {
      checkCount++;
      try {
        console.log(checkCount + '-- wait 4 gfy to process gif --');
        gfyname = await this.getGfyStat(gfyname, token);
        gfyObj = await this.getGfy(gfyname, token);
        break;
      } catch (e) {
        await new Promise(resolve => setTimeout(resolve, 10000));
      }
    }
    if (checkCount == 10) {
      this.gfyStat = 'error';
    }
    console.log(this.gfyStat);
    console.log(this.thumbUrl);
    console.log(this.imgUrl);
    console.log(this.vidUrl);
  } catch (e) {
    console.log('error genWeatherImgAndVid !!');
    console.log(e);
    return '';
  }
  return gfyObj;
}
module.exports = Gfy;
