var axios = require("axios");
const searchClass = "th-bodystep";
const searchBranch = "QHL,SPG";

axios
  .get(
    "https://www.fitnessfirst.co.th/fitness-first/web-services/v2/timetable/%7B03D82E6E-083F-4F37-B877-9CAFC75D919C%7D/" +
      searchBranch
  )
  .then(r => {
    const cls = r.data.Timetable;
    // Filter only Today's CLASS
    let m = findClassByName(cls.Morning[0].Classes, searchClass);
    let a = findClassByName(cls.Afternoon[0].Classes, searchClass);
    let e = findClassByName(cls.Evening[0].Classes, searchClass);

    let result = m.concat(a, e);
    let resultText = "";
    // Result to Text
    result.forEach(c => {
      let time = c.TimeText.slice(0, 8);
      let club = c.ClubTag;
      let title = c.Title;
      resultText += title + " " + time + " " + club + "\n";
    });
    console.log(resultText);
  });

function findClassByName(classes, name) {
  let result = [];
  classes.forEach(c => {
    c.ClassTypeTag == name ? result.push(c) : result;
  });
  return result;
}
