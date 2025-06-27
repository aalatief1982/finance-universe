
import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
admin.initializeApp();

export const classifySMS = functions
  .region('your-region')  // e.g., 'us-central1'
  .https.onRequest(async (req, res) => {
    if (req.method !== 'POST') {
      return res.status(405).send('POST only');
    }

    const idToken = req.headers.authorization?.split('Bearer ')[1];
    try {
      await admin.auth().verifyIdToken(idToken ?? '');
    } catch {
      return res.status(401).send('Unauthorized');
    }

    const { text } = req.body;
    if (!text) return res.status(400).send('Missing text');

    // TODO: call your local or external classification model
    const result = await classifyText(text);
    res.json({ version: 'v1', ...result });
  });
