var fs = require('fs');
var path = require('path');
var axios = require('axios');
var mysql = require('mysql');
//var pool = mysql.createPool(process.env.JAWSDB_URL);
const util = require('util');
const events = require('events');
var CronJob = require('cron').CronJob;
const Cmd = function (app) {
  events.EventEmitter.call(this);
  var checkEveryThisSecs = 60 * 45; //45 mins
  var checkLimit = 5; // max fetch per check
  var isExpectingimg = false;
  const _this = this;
  app.get('/manga/search/:q', (req, res) => {
    q("select id,name,tmb from manga where name like ? order by name asc", ['%' + req.params.q + '%']).then(rows => res.send(rows));
  });
  app.get('/manga/list/:uid', (req, res) => {
    q("select id,name,tmb from manga where id in(select mid from follow where uid=? ) order by name asc", [req.params.uid]).then(rows => res.send(rows));
  });
  // ใช้ที่เดียว ไม่ใช้ express-async-handler ดีกว่า
  app.post('/manga/list/:uid', async (req, res) => {
    try {
      await q("delete from follow where uid=?", [req.params.uid]);
      req.body.forEach(async mid => {
        await q("insert into follow(uid,mid) values(?,?)", [req.params.uid, mid]);
      });
      res.send('ok');
      console.log('done save manga list');
    } catch (e) {
      next(e)
    }
  });
  this.handleEvent = function (evt, cmd, param) {
    if (cmd == 'mangai') {
      isExpectingimg = true;
      console.log('waiting for img');
      _this.emit('replyMessage', {
        replyToken: evt.replyToken,
        message: {
          type: 'text',
          text: 'waiting for img'
        }
      });
    }
    if (isExpectingimg && cmd == 'mangaimg') {
      isExpectingimg = false;
      console.log('mangaImg');
      console.log(evt);
      axios.get(`https://api.line.me/v2/bot/message/${evt.message.id}/content`, {
        responseType: 'arraybuffer',
        headers: {
          Authorization: 'Bearer ' + process.env.LINEACCESS
        }
      }).then(r => {
        var solveImg = 'solve_' + Math.floor(Math.random() * 100) + '.png';
        console.log('img ', solveImg);
        fs.writeFile(path.join(process.cwd(), '/./public/', solveImg), r.data, 'binary', function (err) {
          if (err) {
            console.log(err);
            return;
          }
          console.log('done save img');
          _this.emit('replyMessage', {
            replyToken: evt.replyToken,
            message: {
              type: 'text',
              text: 'https://linerain.herokuapp.com/' + solveImg
            }
          });
        });
      }).catch(e => {
        console.error('get img from line error');
        console.log(e);
      });
    }
    if (cmd == 'manga') {
      _this.emit('replyMessage', {
        replyToken: evt.replyToken,
        message: {
          type: 'text',
          text: 'line://app/1526734026-V3AxnYZl'
        }
      });
    }
  }
  async function getMangaList() {
    axios.post('https://api.mangarockhd.com/query/web400/mrs_filter', {
      "status": "all"
    }).then(async r => {
      var qStr, chunks, chunkSize = 1000;
      while (r.data.data.length > 0) {
        chunks = r.data.data.splice(0, chunkSize);
        await q('insert ignore into manga(id) values ' + Array(chunks.length).fill('(?)').join(','), chunks);
      }
      var rows = await q("select id from manga where tmb=''");
      var ids = rows.map(r => {
        return r.id
      });
      console.log('getMangaList :: ' + ids.length + ' new manga(s).');
      if (!ids.length) return;
      axios.post('https://api.mangarockhd.com/meta', ids).then(async r => {
        var toUpdate = [];
        for (var k in r.data.data) {
          toUpdate.push(k);
          toUpdate.push(r.data.data[k].name);
          toUpdate.push(r.data.data[k].thumbnail)
        }
        await q("insert into manga(id,name,tmb) values " + Array(toUpdate.length / 3).fill('(?,?,?)').join(',') + ' on duplicate key update name=values(name),tmb=values(tmb)', toUpdate);
      }).catch(e => console.log(e));
    }).catch(e => console.log(e));
  }

  function getLatestChapter(id) {
    return new Promise((resolve) => {
      axios.get(`https://api.mangarockhd.com/query/web400/info?oid=${id}`).then(async r => {
        if (!r.data.data.chapters) {
          await q("delete from follow where mid=?",[id]);
          console.log('manga error :: ' + id);
          console.log(r.data);
          resolve(null);
          return;
        } else {
          console.log('manga ok :: ' + id);
        }
        var chapName = '',
          chapter = 0;
        r.data.data.chapters.forEach(c => {
          if (c.order > chapter) {
            chapter = c.order;
            chapName = c.name;
          }
        });
        if (chapter == 0) {
          resolve(null);
          return;
        }
        resolve({
          chapter,
          chapName
        });
      }).catch(e => {
        console.error(e);
        resolve(null);
      });
    });
  }
  async function getMangaUpdate() {
    var changed = [];
    var rows = await q(`select id,chapter,time_to_sec(timediff(now(),lastCheck))as diff from manga where id in(select distinct mid from follow) having diff>${checkEveryThisSecs} order by lastCheck asc limit ${checkLimit}`);
    for (var i = 0; i < rows.length; i++) {
      var info = await getLatestChapter(rows[i].id);
      if (info && info.chapter != rows[i].chapter) {
        if (info.chapter > rows[i].chapter) {
          changed.push(rows[i].id);
          await q('update manga set lastUpdate=now() where id=?', [rows[i].id]);
        }
        await q('update manga set chapName=?,chapter=?,lastCheck=now() where id=?', [info.chapName, info.chapter, rows[i].id]);
      }
    }
    console.log('getMangaUpdate :: ' + changed.length + ' new update(s)');
    if (changed.length) notify(changed);
  }
  async function notify(mangaIds) {
    if (!mangaIds.length) return;
    console.log(mangaIds.length + ' updated chapters');
    var uId = '',
      txt = [];
    var rows = await q('select * from follow where mid in(' + Array(mangaIds.length).fill('?').join(',') + ')', mangaIds);
    rows.forEach(r => {
      if (uId != r.uid) {
        if (uId) _this.emit('pushMessage', {
          to: uId,
          message: {
            type: 'text',
            text: txt.join(`\n`)
          }
        });
        uId = r.uid;
        txt = [];
      }
      txt.push('https://mangarock.com/manga/' + r.mid);
    });
    if (uId) _this.emit('pushMessage', {
      to: uId,
      message: {
        type: 'text',
        text: txt.join(`\n`)
      }
    });
  }

  function q() {
    var qStr = arguments[0];
    var dat = arguments[1];
    return new Promise((resolve) => {
      var connection = mysql.createConnection(process.env.JAWSDB_URL);
      connection.connect();
      connection.query(qStr, dat, function (error, results, fields) {
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
  new CronJob({
    cronTime: '0 0,5,10,15,20,25,30,35,40,45,50,55 * * * *',
    onTick: getMangaUpdate,
    start: true,
    timeZone: 'Asia/Bangkok',
    runOnInit: true
  });
  new CronJob({
    cronTime: '0 0 13 * * *',
    onTick: getMangaList,
    start: true,
    timeZone: 'Asia/Bangkok',
    runOnInit: false
  });
  util.inherits(Cmd, events.EventEmitter);
}
module.exports = Cmd;
