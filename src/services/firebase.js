const FBadmin = require('firebase-admin');

//Firebase Admin API
FBadmin.initializeApp({
  credential: FBadmin.credential.cert({
    type: 'service_account',
    project_id: 'rainbot-f24dd',
    private_key_id: process.env.FB_PRIVATE_KEY_ID,
    private_key: process.env.FB_PRIVATE_KEY,
    client_email: process.env.FB_CLIENT_EMAIL,
    client_id: process.env.FB_CLIENT_ID,
    auth_uri: 'https://accounts.google.com/o/oauth2/auth',
    token_uri: 'https://accounts.google.com/o/oauth2/token',
    auth_provider_x509_cert_url: 'https://www.googleapis.com/oauth2/v1/certs',
    client_x509_cert_url:
      'https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-a0u2y%40rainbot-f24dd.iam.gserviceaccount.com'
  }),
  databaseURL: 'https://rainbot-f24dd.firebaseio.com'
});

const FBDB = FBadmin.database();

export default { FBDB };
