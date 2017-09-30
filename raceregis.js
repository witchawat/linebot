var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var pytSchema = new Schema({
  line_userId: String,
  line_displayName: String,
  distance: String
});

var Pyt = mongoose.model('Pyt', pytSchema);

var Race = function(txt){
  if (txt === "show" ){
    //Show PYT Registered User
    return {
      type: 'text',
      text: 'ZERO'
  }
  } else {
    //PYT Command
    return  {
      type: 'text',
      text: 'pyt with cmd'
  }
  }

};


module.exports = Race;
