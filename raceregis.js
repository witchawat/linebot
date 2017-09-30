var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var pytSchema = new Schema({
  line_userId: String,
  line_displayName: String,
  distance: String
});

var Pyt = mongoose.model('Pyt', pytSchema);

var Race = function(txt, uid, displayname){
  if (txt == "show" ){
    //Show PYT Registered User
    return {
      type: 'text',
      text: 'ZERO'
  }
  } else {
    if (txt == "22" || txt == "44" || txt == "66" || txt == "100"){
      Pyt.update({line_userId: uid}, {$set: {line_userId: uid, line_displayName: displayname, distance: txt}}, {upsert: true}, function(err, result){
        if (err) {
          console.log("Upsert Error")
          console.log(err);
        } else {
          console.log("Success >> " , result);
          return  {
            type: 'text',
            text: 'เพิ่ม ' + displayname + ' ใน PYT ' + txt +'K แล้ว'
        }
        }
      })
  } else {
    return  {
      type: 'text',
      text: 'กรุณาใส่เฉพาะตัวเลข\n22 44 66 100'
    }
  }
  }
};



module.exports = Race;
