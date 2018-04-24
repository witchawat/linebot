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
  private_key: process.env.FIREBASESECRET,
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
