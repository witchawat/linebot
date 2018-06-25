var mysql = require('mysql');
var pool = mysql.createPool(process.env.JAWSDB_URL);
const util = require('util');
const events = require('events');
const Cmd = function (app) {
  events.EventEmitter.call(this);
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
        console.log(mid);
        await q("insert into follow(uid,mid) values(?,?)", [req.params.uid,mid]);
      });
      res.send('ok');
    } catch (e) {
      next(e)
    }
  });
  this.handleEvent = function (evt, cmd, param) {
    _this.emit('replyMessage', {
      replyToken: evt.replyToken,
      message: {
        type: 'text',
        text: 'hi from manga module'
      }
    });
    /*
    -- ตัวอย่าง --
    _this.emit('replyMessage', {
      replyToken: evt.replyToken,
      message: {
        type: 'text',
        text: 'Hello World!'
      }
    });
    */
    /*
    -- ตัวอย่าง --
    อาจจะเป็น roomId, groupId ก็ได้
    _this.emit('pushMessage', {
      to: evt.source.userId,
      message: {
        type: 'text',
        text: 'Hello World!'
      }
    });
    */
  }

  function q() {
    var qStr = arguments[0];
    var dat = arguments[1];
    return new Promise((resolve) => {
      pool.getConnection(function (err, connection) {
        connection.query(qStr, dat, function (error, results, fields) {
          if (error) {
            //console.log(error);
            resolve(null);
          } else {
            resolve(results);
          }
          connection.release();
        });
      });
    });
  }
  util.inherits(Cmd, events.EventEmitter);
}
module.exports = Cmd;
