var request = require('request');
var _       = require('underscore');

export function utmbrunner(bib){
  var result = request.get('https://service.chillingtrail.run/result/2017/utmb/' + bib, function(error, response, body){
  var runinfo = JSON.parse(body);
  var jsonsize = _.size(runinfo.points);

  var rname = runinfo.identity.prenom;
  var rsurname = runinfo.identity.nom;

  var cpname = [];
  var cptod = [];
  var cptime = [];
  for(var i = 0 ; i < jsonsize ; i++){
    if(runinfo.points[i].tps !== undefined){
      cpname.push(runinfo.points[i].n);
      cptod.push(runinfo.points[i].ha);
      cptime.push(runinfo.points[i].tps);
    };
  };
  var info = "BIB: " + bib + "\nName: " + rname + " " + rsurname + "\nLast Checkpoint\n" + _.last(cpname) +"\nTime: " + _.last(cptime) ;
  return info;
});
}; // end of func utmbrunner
