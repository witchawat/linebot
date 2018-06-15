const axios = require('axios');

let t = axios.get('https://bx.in.th/api/orderbook/?pairing=32').then(res => {
  let asks = res.data.asks;
  let accum_asks = 0;

  for (row of asks) {
    let price = row[0];
    let vol = row[1];
    accum_asks += price * vol;
    console.log('ACCUM >> ' + accum_asks + ' @ ' + price);
    if (accum_asks >= 5000000) {
      console.log('5M vol @ ', price);
      break;
    }
  }
});
