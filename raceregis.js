var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var pytSchema = new Schema({
  line_userId: String,
  line_displayName: String,
  distance: String
});

var Pyt = mongoose.model('Pyt', pytSchema);

function pytRegis(txt){
  return {
    type : "text",
    text : "Reply with " + txt
  }
}

function pytShow(){
  return {
    type : "text",
    text : "SHOW"
  }
}
