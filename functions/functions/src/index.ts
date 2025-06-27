import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import corsLib from 'cors';

admin.initializeApp();
const cors = corsLib({ origin: true });

export const classifySMS = functions.https.onRequest((req, res) => {
  cors(req, res, () => {
    if (req.method !== 'POST') {
      res.status(405).send('Only POST allowed');
      return;
    }

    res.json({ version: 'v1', message: req.body.text || 'No text provided' });
  });
});
