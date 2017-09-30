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
    //Build Racer message
    let racers = Pyt.find({}).sort({distance: -1, displayname: 1});
    var i = 1;
    console.log(typeof racers);
    console.log(racers);

    return {
      type: 'text',
      text: 'PYT Racers\n' + racers
  }
  } else {
    if (txt == "22" || txt == "44" || txt == "66" || txt == "100"){
      Pyt.update({line_userId: uid}, {$set: {line_userId: uid, line_displayName: displayname, distance: txt}}, {upsert: true}, function(err, result){
        if (err) {
          console.log("Upsert Error")
          console.log(err);
          resolve(null)
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
