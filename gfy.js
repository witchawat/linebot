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
      if (body.gfyItem) {
        //console.log(body.gfyItem);
        resolve(body.gfyItem);
      } else {
        reject('');
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
Gfy.prototype.gfyPost = function (url) {
  return new Promise((resolve, reject) => {
    var data = {
      fetchUrl: url + "?v=" + (new Date().getTime()),
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
  var checkCount;
  this.gfyStat = 'ok';
  try {
    token = await this.gfyAuth();
    //post vid
    gfyname = await this.gfyPost('http://203.155.220.231/Radar/pics/nkradar.gif');
    checkCount = 0;
    while (checkCount < 10) {
      checkCount++;
      try {
        console.log('-- wait 4 gfy to process gif --');
        gfyname = await this.getGfyStat(gfyname, token);
        gfyObj = await this.getGfy(gfyname, token);
        this.vidUrl = gfyObj.mobileUrl;
        break;
      } catch (e) {
        await new Promise(resolve => setTimeout(resolve, 20000));
      }
    }
    if (checkCount == 10) {
      this.gfyStat = 'error';
    }
    //post img
    gfyname = await this.gfyPost('http://203.155.220.231/Radar/pics/nkzfiltered.jpg');
    checkCount = 0;
    while (checkCount < 10) {
      checkCount++;
      try {
        console.log('-- wait 4 gfy to process img --');
        gfyname = await this.getGfyStat(gfyname, token);
        gfyObj = await this.getGfy(gfyname, token);
        this.thumbUrl = gfyObj.miniPosterUrl;
        this.imgUrl = gfyObj.posterUrl;
        break;
      } catch (e) {
        await new Promise(resolve => setTimeout(resolve, 20000));
      }
    }
    if (checkCount == 10) {
      this.gfyStat = 'error';
    }
    /*
    console.log(this.thumbUrl);
    console.log(this.imgUrl);
    console.log(this.vidUrl);
    */
  } catch (e) {
    console.log('error genWeatherImgAndVid !!');
    console.log(e);
    return '';
  }
  return 'ok';
}
module.exports = Gfy;
