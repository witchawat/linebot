require("dotenv").config();
var axios = require("axios");
var mysql = require("mysql");
//var pool = mysql.createPool(process.env.JAWSDB_URL);
const util = require("util");
const events = require("events");

const jsdom = require("jsdom");
const { JSDOM } = jsdom;

async function gg() {
  var info, i;
  for (i = 6300; i < 6999; i++) {
    var info = await runnerInfo(i);
    if(info)
    await q("insert ignore into cm(bib,runnerName,course) values(?,?,?)", info);
    console.log(info);
  }
}
gg();
function runnerInfo(_bib) {
  return new Promise((resolve, reject) => {
    let url = "https://race.chillingtrail.run/cm6/r/" + encodeURI(_bib);
    let web = JSDOM.fromURL(url)
      .then(dom => {
        let tbls = dom.window.document.querySelectorAll("table");
        if (!tbls || tbls.length != 2) {
          resolve(null);
          return;
        }
        let bib = tbls[0].querySelectorAll("td")[0].textContent;
        let runnerName = tbls[0].querySelectorAll("td")[1].textContent;
        let course = tbls[0].querySelectorAll("td")[2].textContent;
        if (course == "CM0") {
          resolve(null);
          return;
        }
        let runner = {
          bib,
          runnerName,
          course
        };
        resolve([bib, runnerName, course]);
      })
      .catch(error => {
        //console.log(error);
        resolve(null);
      });
  });
}
function q() {
  var qStr = arguments[0];
  var dat = arguments[1];
  return new Promise(resolve => {
    var connection = mysql.createConnection(process.env.JAWSDB_URL);
    connection.connect();
    connection.query(qStr, dat, function(error, results, fields) {
      if (error) {
        console.log(error);
        resolve(null);
      } else {
        resolve(results);
      }
    });
    connection.end();
  });
}
