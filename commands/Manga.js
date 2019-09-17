var axios = require("axios");
var mysql = require("mysql");
//var pool = mysql.createPool(process.env.JAWSDB_URL);
const util = require("util");
const events = require("events");
var CronJob = require("cron").CronJob;
const Cmd = function(app) {
  events.EventEmitter.call(this);
  var checkEveryThisSecs = 60 * 45; //45 mins
  var checkLimit = 10; // max fetch per check
  const _this = this;
  app.get("/manga/search/:q", (req, res) => {
    q("select id,name,tmb from manga where canRead='yes' and name like ? order by name asc", [
      "%" + req.params.q + "%"
    ]).then(rows => res.send(rows));
  });
  app.get("/manga/list/:uid", (req, res) => {
    q(
      "select id,name,tmb,time_to_sec(timediff(now(),lastUpdate))as age,chapName from manga where canRead='yes' and id in(select mid from follow where uid=? ) order by lastUpdate desc, name asc",
      [req.params.uid]
    ).then(rows => res.send(rows));
  });
  // ใช้ที่เดียว ไม่ใช้ express-async-handler ดีกว่า
  app.post("/manga/list/:uid", async (req, res) => {
    try {
      var toSave = [];
      await q("delete from follow where uid=?", [req.params.uid]);
      req.body.forEach(async mid => {
        toSave.push(req.params.uid);
        toSave.push(mid);
      });
      if (toSave.length) {
        await q(
          "insert into follow(uid,mid) values " +
            Array(toSave.length / 2)
              .fill("(?,?)")
              .join(","),
          toSave
        );
        getMangaUpdate();
      }
      res.send("ok");
    } catch (e) {
      next(e);
    }
  });
  this.handleEvent = async function(evt, cmd, param) {
    if (cmd == "mangad") {
      var ids = (await q(
        "select mid from follow where uid=? order by rand() limit 10",
        evt.source.userId
      )).map(v => v.mid);
      console.log(ids);

      notify(ids);
    }
    if (cmd == "manga") {
      _this.emit("replyMessage", {
        replyToken: evt.replyToken,
        message: {
          type: "text",
          text: "line://app/1526734026-V3AxnYZl"
        }
      });
    }
    if (cmd == "mangarefresh") {
      _this.emit("replyMessage", {
        replyToken: evt.replyToken,
        message: {
          type: "text",
          text: "refreshing manga list..."
        }
      });
      getMangaList();
    }
  };
  async function getMangaList() {
    axios
      .post("https://api.mangarockhd.com/query/web401/mrs_filter?country=Thailand", {
        status: "all"
      })
      .then(async r => {
        var qStr,
          chunks,
          chunkSize = 1000;
        while (r.data.data.length > 0) {
          chunks = r.data.data.splice(0, chunkSize);
          await q(
            "insert ignore into manga(id) values " +
              Array(chunks.length)
                .fill("(?)")
                .join(","),
            chunks
          );
        }
        var rows = await q("select id from manga where tmb=''");
        var ids = rows.map(r => {
          return r.id;
        });
        console.log("getMangaList :: " + ids.length + " new manga(s).");
        if (!ids.length) return;
        axios
          .post("https://api.mangarockhd.com/meta?country=Thailand", ids)
          .then(async r => {
            var toUpdate = [];
            for (var k in r.data.data) {
              toUpdate.push(k);
              toUpdate.push(r.data.data[k].name);
              toUpdate.push(r.data.data[k].thumbnail);
            }
            await q(
              "insert into manga(id,name,tmb) values " +
                Array(toUpdate.length / 3)
                  .fill("(?,?,?)")
                  .join(",") +
                " on duplicate key update name=values(name),tmb=values(tmb)",
              toUpdate
            );
          })
          .catch(e => console.log(e));
      })
      .catch(e => console.log(e));
  }

  function getLatestChapter(id) {
    return new Promise(resolve => {
      axios
        .get(`https://api.mangarockhd.com/query/web401/info?oid=${id}&country=Thailand`)
        .then(async r => {
          if (!r.data.data.chapters) {
            await q("update manga set canRead='no' where id=?", [id]);
            console.log("manga error :: " + id);
            console.log(r.data);
            resolve(null);
            return;
          }
          var chapName = "",
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
        })
        .catch(e => {
          console.error(e);
          resolve(null);
        });
    });
  }
  async function getMangaUpdate() {
    var changed = [];
    var rows = await q(
      `select id,name,chapter,time_to_sec(timediff(now(),lastCheck))as diff from manga where id in(select distinct mid from follow) having diff>${checkEveryThisSecs} order by lastCheck asc limit ${checkLimit}`
    );
    for (var i = 0; i < rows.length; i++) {
      var info = await getLatestChapter(rows[i].id);
      //console.log('checking ' + rows[i].name, info);
      if (info) {
        if (info.chapter > rows[i].chapter) {
          changed.push(rows[i].id);
          await q("update manga set lastUpdate=now() where id=?", [rows[i].id]);
        }
        await q("update manga set chapName=?,chapter=?,lastCheck=now() where id=?", [
          info.chapName,
          info.chapter,
          rows[i].id
        ]);
      } else {
        await q("update manga set lastCheck=DATE_ADD(NOW(), INTERVAL 234 MINUTE) where id=?", [
          rows[i].id
        ]);
        //await q("update manga set canRead='no' where id=?", [rows[i].id]);
      }
    }
    if (changed.length) notify(changed);
  }
  async function notify(mangaIds) {
    if (!mangaIds.length) return;
    var notiFlex = {},
      notiName = {};
    for (var id of mangaIds) {
      [notiName[id], notiFlex[id]] = await mangaNotiContent(id);
    }
    console.log(mangaIds.length + " updated chapters");
    var rows = await q(
      "select * from follow where mid in(" +
        Array(mangaIds.length)
          .fill("?")
          .join(",") +
        ")",
      mangaIds
    );
    var uIds = [...new Set(rows.map(v => v.uid))];
    uIds.forEach(u => {
      var contents = [],
        altTexts = [];
      rows
        .filter(v => v.uid == u)
        .forEach(v => {
          altTexts.push(notiName[v.mid]);
          contents.push(notiFlex[v.mid]);
        });
      _this.emit("pushMessage", {
        to: u,
        message: [
          {
            type: "flex",
            altText: altTexts.join(","),
            contents: {
              type: "carousel",
              contents
            }
          },
          {
            type: "text",
            text: "line://app/1526734026-V3AxnYZl"
          }
        ]
      });

      console.log(JSON.stringify(flexMsg, null, 2));
    });
    return;
    rows.forEach(r => {
      if (uId != r.uid) {
        if (uId)
          _this.emit("pushMessage", {
            to: uId,
            message: {
              type: "text",
              text: txt.join(`\n`)
            }
          });
        uId = r.uid;
        txt = [];
      }
      txt.push("https://mangarock.com/manga/" + r.mid);
    });
    if (uId)
      _this.emit("pushMessage", {
        to: uId,
        message: {
          type: "text",
          text: txt.join(`\n`)
        }
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
  async function mangaNotiContent(id) {
    var r = (await q("select * from manga where id=?", id))[0];
    if (!r) return ["", {}];
    return [
      r.name,
      {
        type: "bubble",
        size: "kilo",
        body: {
          type: "box",
          layout: "vertical",
          contents: [
            {
              type: "image",
              url: r.tmb,
              size: "full",
              aspectMode: "cover",
              aspectRatio: "2:3",
              gravity: "top"
            },
            {
              type: "box",
              layout: "vertical",
              contents: [
                {
                  type: "box",
                  layout: "vertical",
                  contents: [
                    {
                      type: "text",
                      text: r.name,
                      size: "sm",
                      color: "#ffffff",
                      weight: "bold"
                    }
                  ]
                },
                {
                  type: "box",
                  layout: "vertical",
                  contents: [
                    {
                      type: "text",
                      text: r.chapName,
                      size: "sm",
                      color: "#ffffff"
                    }
                  ],
                  spacing: "lg"
                },
                {
                  type: "box",
                  layout: "vertical",
                  action: {
                    type: "uri",
                    uri: `https://mangarock.com/manga/${id}`
                  },
                  contents: [
                    {
                      type: "filler"
                    },
                    {
                      type: "box",
                      layout: "baseline",
                      contents: [
                        {
                          type: "filler"
                        },
                        {
                          type: "text",
                          text: "Read",
                          color: "#ffffff",
                          flex: 0,
                          offsetTop: "-2px"
                        },
                        {
                          type: "filler"
                        }
                      ],
                      spacing: "sm"
                    },
                    {
                      type: "filler"
                    }
                  ],
                  borderWidth: "1px",
                  cornerRadius: "4px",
                  spacing: "sm",
                  borderColor: "#ffffff",
                  margin: "md",
                  height: "40px"
                }
              ],
              position: "absolute",
              offsetBottom: "0px",
              offsetStart: "0px",
              offsetEnd: "0px",
              backgroundColor: "#03303Acc",
              paddingAll: "10px",
              paddingTop: "18px"
            }
          ],
          paddingAll: "0px"
        }
      }
    ];
  }
  new CronJob({
    cronTime: "0 0,5,10,15,20,25,30,35,40,45,50,55 * * * *",
    onTick: getMangaUpdate,
    start: true,
    timeZone: "Asia/Bangkok",
    runOnInit: true
  });
  new CronJob({
    cronTime: "0 0 13 * * *",
    onTick: getMangaList,
    start: true,
    timeZone: "Asia/Bangkok",
    runOnInit: false
  });
  util.inherits(Cmd, events.EventEmitter);
};
module.exports = Cmd;
