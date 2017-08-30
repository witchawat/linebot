var request = require("request");
var cheerio = require("cheerio");
var fs = require('fs');

function utmbVideo(bib){
var weburl = "http://utmb.livetrail.net/coureur.php?rech=" + bib;

request({
  uri: weburl,
}, function(error, response, body) {
  var $ = cheerio.load(body);

  var vidurl = $('videos > e').attr('v');


    return vidurl;
  })
}

module.exports = utmbVideo;
