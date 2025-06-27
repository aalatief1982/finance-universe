import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import * as cors from 'cors';
import { classifyText } from './classifier';

admin.initializeApp();
const corsHandler = cors({ origin: true });

export const classifySMS = functions
  .region('us-central1')
  .https.onRequest((req, res) => {
    corsHandler(req, res, async () => {
      if (req.method !== 'POST') {
        res.status(405).send('POST only');
        return;
      }

      const idToken = req.headers.authorization?.split('Bearer ')[1];
      try {
        await admin.auth().verifyIdToken(idToken ?? '');
      } catch {
        res.status(401).send('Unauthorized');
        return;
      }

      const { text } = req.body;
      if (!text) {
        res.status(400).send('Missing text');
        return;
      }

      const result = await classifyText(text);
      res.json({ version: 'v1', ...result });
    });
  });
