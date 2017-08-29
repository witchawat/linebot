var request = require('request');
var _       = require('underscore');

function utmbRunner(bib, callback){
  var runnerinfo ='waiting';
  var rname = '';
  var rsurname = '';
  var cpname = [];
  var cptod = [];
  var cptime = [];
  var km = [];

  request.get('https://service.chillingtrail.run/result/2017/utmb/' + bib, function(error, response, body){
    if(response.statusCode == 200) {
    var runinfo = JSON.parse(body);
    var rname = runinfo.identity.prenom || runinfo.identity.pnom || "noname";
    var rsurname = runinfo.identity.nom;
    var jsonsize = _.size(runinfo.points);

    //get current runner's info
    for(var i = 0 ; i < jsonsize ; i++){
      if(runinfo.points[i].tps !== undefined){
        cpname.push(runinfo.points[i].n);
        cptod.push(runinfo.points[i].ha);
        cptime.push(runinfo.points[i].tps);
        km.push(runinfo.points[i].km);
      }
    }
    runnerinfo = "BIB: " + bib + "\nName: " + rname + " " + rsurname + "\nRace: " + runinfo.identity.race.toUpperCase() + "\n\nLast Checkpoint\n" + _.last(cpname) +"\nTime: " + _.last(cptime)
      +"\n\nAt " +_.last(km) + "/" +runinfo.points[jsonsize-1].km +" km";
    callback(null, runnerinfo);
  } else { // resp != 200
    console.log('error');
  }

});
} // end of func utmbrunner

module.exports = utmbRunner;

// utmbRunner(20100,function(err, ri){
//   if(err){
//     console.log(err);
//   } else {
//     console.log(ri);
//   }
// });
