'use strict';
require('dotenv').config();

const LineEventHandler = require('./commands/EventHandler.js');
const Rain = require('./commands/Rain.js');
const Air = require('./commands/Air.js');
const MyLog = require('./commands/MyLog.js');
const WolframSolve = require('./commands/WolframSolve.js');
const Weather = require('./commands/Weather.js');

const jsdom = require('jsdom');
const { JSDOM } = jsdom;

var admin = require('firebase-admin');

const express = require('express');
const bodyParser = require('body-parser');
var urlencodedParser = bodyParser.urlencoded({
  extended: false
});

//================================
// GOOGLE FIREBASE DB
//================================
let serviceAccount = {
  type: 'service_account',
  project_id: 'utmfrunner',
  private_key_id: '2af9d65de17e84704a7d0476afbabf5618756694',
  private_key:
    '-----BEGIN PRIVATE KEY-----\nMIIEvAIBADANBgkqhkiG9w0BAQEFAASCBKYwggSiAgEAAoIBAQC2zOMJVylD3GUh\n52CywTnGHSkRzmfLEtHEPOlqI23JA26r4z2MY0Mz9ZM+9p29IJpvG3Q7Lk3JTwVV\ndDkRXephaSr5/6Q5jrFKJ6GqbunWAJrXor+2CzzGvzpGLISJ3A3EfPvz/jHgZhWF\nZRiFZwRrDTaNhq/xNBT5dgYaW14h7nnF790pnfXYz05VQ5R962++7Y56MlodtGF7\nzofZyuoda2TOy7T17WqzN4fmYCy+gxByq4XGoazd4CX5r/E+isJUYDqZknKvf5hM\n0ulSdEn0LeF9x4aNbSSB6qPkzDQ1pz/fi6ojJ9lfi7/OkN3clcjyu2EvY51QSvbW\nL0c4oJMRAgMBAAECggEACIySfahW5LaVAD3q9tE0m4BXoF6P2h56MvxKSk133/PK\nJD3PbhZiWTa9+S7dd6/jqRiWmgHzX1vTuwhhdt92i7G4cdKz4oE652XtGKRxSTHk\nC/uvjZr+76iX2BpS5IOnHS5fNi0INh9wGDn/KJYFzd/jUkEfT1+JL5WGeYsWXu3M\n9/Mz/8A2Lp4aPSe6X75PY7EZ6MECWWk1kSX+59oW6WEKdjbQCSczWNqOsYei/QzN\nEOSA1Y0DxlsaC52syJSnzLh9A3OToi0AcS2QGdApJ6/frWXmm8/ZeVOFKXHzYShx\n86daLzd2330p8oGkXedqtOAgvKI+jzQFaoQecQmFxQKBgQDo87RHu6DDMgC3wC9m\n1yjbR4uRkIfDvnkRhxl7aHzNO0BbekRZlLjYaccAFBdUSX6f2d1jnLHasxDZ7RzL\nhWbicFE/wSDanhvY4IryBkflFziJ2IcqDupP8AmVZUcBYrtPdSzCIyrDbaRcOUcL\nCaoU97VO47XdRPASEj5EV+Hz5wKBgQDI4uxS8tuLHg4UA2qUw4TC58O+cvxulGO9\nV41ez0UHS5Q0vb7hGpuubgfpyZINb/CikdNAT7O9gYSCh7ZHBx1T9RLCuP1Sbgw/\nMvvE5sD8OH91xlys3jDeqVmKXdnSmHg/6/la4YglJm/p6q8Qlfdty9jAINUoPpcP\n/FvXbrziRwKBgF+2WfkrJzdsIQ1egltfxeKqt7acSpvrc7T27EpfOP/d+2haiSDB\nUV1hwKjQmHFCLSuiiSr3Y7/22NKhcLZSXl5lRYzLXiNU2R43y/77A6kl7E3+0DJA\npJcpidZ/ITh5h3pzK2uspVJchy55Pi5TzzUEPdNnDf8W5wiVxE2ySh07AoGAQ3Tn\n9Ka2kE2kXpYTGSdaknRvJ6nHGH7dyzv2Lesd++gmOVuqGD7uHjG2mIvmbnqzbHPZ\nY1QgQDeYvphB3jIGaCX4icjC0AZCOIqvPpxaG5gBPRRCFI58DJkDh1IijfRDFPvx\nfNIU/Jyeogb7iG9Daew0ubeMvHngEi8ky//Uj4sCgYAAzmH0nYD65phNJZJJvJ6z\n02HE+04b6He/X7r0OjW0q6t+v2gX/XiO0XyfWXGUa9qqHO05Nts+60gUKERovM7M\ncMUR60TaGRL8vXvlb0aoejbiPJIXrsgvfNtegH1KQg1jkTLka8X4aHpZUanzYy0G\nf/+9DSzN7fyvHtkTCtMpmg==\n-----END PRIVATE KEY-----\n',
  client_email: 'firebase-adminsdk-a8jpt@utmfrunner.iam.gserviceaccount.com',
  client_id: '113018207591293193319',
  auth_uri: 'https://accounts.google.com/o/oauth2/auth',
  token_uri: 'https://accounts.google.com/o/oauth2/token',
  auth_provider_x509_cert_url: 'https://www.googleapis.com/oauth2/v1/certs',
  client_x509_cert_url:
    'https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-a8jpt%40utmfrunner.iam.gserviceaccount.com'
};

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: 'https://utmfrunner.firebaseio.com'
});

var fdb = admin.firestore();
//================================

const line = require('@line/bot-sdk');
//================================
//        KEYS
//================================
//Line API
const config = {
  channelAccessToken: process.env.LINEACCESS,
  channelSecret: process.env.LINESECRET
};
const client = new line.Client(config);
var eventHandler = new LineEventHandler(client);
eventHandler.add(['rain', 'rainvid'], new Rain());
eventHandler.add('air', new Air());
eventHandler.add('log', new MyLog());
eventHandler.add('solve', new WolframSolve());
eventHandler.add(
  ['weather', 'w1', 'w2', 'w3', 'w4', 'w5', 'w6'],
  new Weather()
);
const app = express();
app.use(express.static('public'));
app.set('port', process.env.PORT || 5000);
app.post('/webhook', line.middleware(config), (req, res) => {
  req.body.events.forEach(evt => eventHandler.handleEvent(evt));
  res.send('');
});

utmfRunner(2967);
utmfRunner(2966);

function utmfRunner(bib) {
  // let url = 'https://utmb.livetrail.net/coureur.php?rech=' + bib;
  let url = 'https://utmf.livetrail.net/coureur.php?rech=' + bib;

  console.log(url);

  let web = JSDOM.fromURL(url)
    .then(dom => {
      let data = dom.window.document;
      let state = data.querySelector('state').getAttribute('code');
      if (state === 'a') {
        state = 'DNF';
      } else if (state === 'f') {
        state = 'FINISHED';
      } else {
        state = null;
      }

      let last = -1;
      let cp = [];
      let pts = data.querySelectorAll('pts pt').forEach(row => {
        cp.push({
          idpt: row.getAttribute('idpt'),
          n: row.getAttribute('n'),
          nc: row.getAttribute('nc'),
          km: row.getAttribute('km'),
          nc: row.getAttribute('nc')
        });
      });

      let pass = data.querySelectorAll('pass e').forEach((row, i) => {
        Object.assign(cp[i], {
          racetime: row.getAttribute('tps'),
          rank: row.getAttribute('clt'),
          worldtime: row.getAttribute('hd') || row.getAttribute('ha')
        });
        last = i;
      });

      // Last CP REACHED
      let runner = {
        name:
          data.querySelector('identite').getAttribute('prenom') +
          ' ' +
          data.querySelector('identite').getAttribute('nom'),
        course: data
          .querySelector('fiche')
          .getAttribute('c')
          .toUpperCase(),
        country: data.querySelector('identite').getAttribute('nat'),
        status: state,
        last_update: cp[last] || undefined
      };

      res.status(200).json({ runner, data: cp });

      fdb
        .collection('runners')
        .doc(bib)
        .get()
        .then(doc => {
          if (!doc.exists || doc.runner.last != last) {
            fdb
              .collection('runners')
              .doc(bib)
              .set({ runner, data: cp });
          }
        });
    })
    .catch(error => {
      console.log(error);
    });
}

app.get('*', function(req, res) {
  res.send('Ong Line Bot');
});
//Heroku setting
app.listen(app.get('port'), function() {
  console.log('Node app is running on port', app.get('port'));
});
