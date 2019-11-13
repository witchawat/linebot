var axios = require("axios");
const util = require("util");
const events = require("events");
const Cmd = function() {
  events.EventEmitter.call(this);
  const _this = this;
  this.handleEvent = function(evt, cmd, param) {
    console.log("-----------mod challenge");

    var ids = evt.message.text.split(/[\s,]+/).splice(1);

    console.log(cmd, evt);
    console.log(ids);

    if (cmd == "modFactorTo1") {
      console.log({ newMul: 1, ids });
    }
  };
  util.inherits(Cmd, events.EventEmitter);
};
module.exports = Cmd;
