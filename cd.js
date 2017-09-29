var moment = require('moment');

var registerTime = {
  "utmf" : "2017-10-16 10:00+09", //JP Time Zone
  "utmb" : "2017-12-14 08:00+01", //Swiss Time Zone
}

// console.log(registerTime.utmf);
moment(registerTime.utmf).isValid();
var x = moment().to(registerTime.utmf);
console.log(x)
