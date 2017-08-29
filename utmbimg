var Urlbox = require('urlbox');
var fs = require('fs');
var request = require('request');
// Plugin your API key and secret
var urlbox = Urlbox(process.env.URLBOX_API_KEY, process.env.URLBOX_API_SECRET);

function utmbImg(bib, callback){
// Set your options
var options = {
  url: "http://utmb.livetrail.net/coureur.php?rech="+bib,
  delay: 1000,
  selector: '#contvues',
  thumb_width: 800,
  width: 800,
  height: 800,
  crop_width: 800,
  click: '#tips',
  format: 'jpg',
  quality: 80
};
var utmbimgUrl = urlbox.buildUrl(options);

request.get({url: utmbimgUrl, encoding: 'binary'}, function (err, response, body) {
  fs.writeFile("./utmbrace.jpg", body, 'binary', function(err) {
    if(err)
      console.log(err);
    else
      console.log("utmbrace.jpg file was saved!");
      callback(null, "utmbrace.jpg");
  });
});
}; // end of utmbimg function

module.exports = utmbImg;
