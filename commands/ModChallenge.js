var axios = require("axios");
const util = require("util");
const events = require("events");
const Cmd = function() {
  events.EventEmitter.call(this);
  const _this = this;
  this.handleEvent = function(evt, cmd, param) {
    // only ปั้น+เอก can use
    if (
      [
        "Uea2175b9174b7fb693edac4b153170c6",
        "Ub24e70b8331c3512df8cea02a37ff16b"
      ].indexOf(evt.source.userId) < 0
    )
      return;
    var ids = evt.message.text.split(/[\s,]+/).splice(1);
    var newMul = 1;
    if (cmd == "modfactorto2") {
      newMul = 2;
    }
    if (cmd == "modfactorto3") {
      newMul = 3;
    }
    if (cmd == "modfactorto4") {
      newMul = 4;
    }
    if (cmd == "modfactorto5") {
      newMul = 5;
    }
    axios
      .post("https://icmm.run/ranger/mod_promo_multiplier", {
        newMul,
        ids,
        pwd: process.env.MOD_MULTIPLIER_PWD
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
