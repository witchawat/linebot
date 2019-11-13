var axios = require("axios");
const util = require("util");
const events = require("events");
const Cmd = function() {
  events.EventEmitter.call(this);
  const _this = this;
  this.handleEvent = function(evt, cmd, param) {
    console.log('-----------mod challenge');
    
    console.log(evt);
  };
  util.inherits(Cmd, events.EventEmitter);
};
module.exports = Cmd;

