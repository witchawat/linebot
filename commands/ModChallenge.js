var axios = require("axios");
const util = require("util");
const events = require("events");
const Cmd = function() {
  events.EventEmitter.call(this);
  const _this = this;
  this.handleEvent = function(evt, cmd, param) {
    var ids = evt.message.text.split(/[\s,]+/).splice(1);
    var newMul = 1;
    if (cmd == "modfactorto2") {
      newMul = 2;
    }
    if (cmd == "modfactorto3") {
      newMul = 3;
    }
    axios
      .post("https://icmm.run/ranger/mod_promo_multiplier", {
        newMul,
        ids,
        pwd: "ZI^yK+bGdHbE&Upn04X7u!7&PV2X0v+1ID9xV0b?YWz"
      })
      .then(r =>
        _this.emit("replyMessage", {
          replyToken: evt.replyToken,
          message: { type: "text", text: r.data }
        })
      )
      .catch(e =>
        _this.emit("replyMessage", {
          replyToken: evt.replyToken,
          message: { type: "text", text: "error มากก" }
        })
      );
  };
  util.inherits(Cmd, events.EventEmitter);
};
module.exports = Cmd;
