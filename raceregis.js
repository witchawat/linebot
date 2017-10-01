var mongoose = require('mongoose');
var Schema = mongoose.Schema;


var pytSchema = new Schema({
  line_userId: String,
  line_displayName: String,
  distance: String
});

var Pyt = mongoose.model('Pyt', pytSchema);

var Race = async function(txt, uid, displayname){
  if (txt == "show" ){
    //Show PYT Registered User
    //Build Racer message
    var rdata = "";
    var ii = 1;
    var racers = await Pyt.find({}, function(err, results){
      console.log(results.length)
      results.forEach(function(res){
        console.log(res);
        rdata = rdata + ii + ". " + res.line_displayName + " " + res.distance + "K\n"
        ii++;
        if (ii == results.length +1){
          return {
            type: 'text',
            text: 'PYT Racers\n' + rdata
        }
        }
      });


    })

  } else {
    if (txt == "22" || txt == "44" || txt == "66" || txt == "100"){
      await Pyt.update({line_userId: uid}, {$set: {line_userId: uid, line_displayName: displayname, distance: txt}}, {upsert: true}, function(err, result){
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
