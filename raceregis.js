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

    const dbresult = await Pyt.find({}).sort({distance: -1, line_displayName: 1});
    const cursor = dbresult.cursor();
    for (let doc = await cursor.next(); doc != null; doc = await cursor.next()) {
      rdata = rdata + ii + ". " + doc.line_displayName + " " + doc.distance + "K\n"
      ii++;
      if(ii == dbresult.count()){
        console.log(rdata);
        return {
          type: 'text',
          text: 'PYT Racers\n' + rdata
        }
      }
    }

    // var racers = await Pyt.find({}, function(err, results){
    //   console.log(results.length)
    //   results.forEach(function(res){
    //     console.log(res);
    //     rdata = rdata + ii + ". " + res.line_displayName + " " + res.distance + "K\n"
    //     ii++;
    //     if (ii == results.length +1){
    //       return {
    //         type: 'text',
    //         text: 'PYT Racers\n' + rdata
    //     }
    //     }
    //   });
    // })

  } else {
    if (txt == "22" || txt == "44" || txt == "66" || txt == "100"){
      Pyt.update({line_userId: uid}, {$set: {line_userId: uid, line_displayName: displayname, distance: txt}}, {upsert: true}, function(err, result){
        if (err) {
          console.log("Upsert Error")
          console.log(err);
          return undefined;
        } else {
          console.log("Success >> " , result);
          return {
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
