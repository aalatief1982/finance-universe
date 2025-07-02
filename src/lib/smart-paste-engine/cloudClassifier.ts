import { getAuth } from 'firebase/auth';
import { firebaseApp } from '@/firebase';
import { CLOUD_FUNCTIONS_BASE_URL } from '@/lib/env';

export async function classifySmsViaCloud(text: string) {
  const auth = getAuth(firebaseApp);
  const idToken = await auth.currentUser?.getIdToken(true);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);
  try {
    const res = await fetch(`${CLOUD_FUNCTIONS_BASE_URL}/classifySMS`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${idToken}`,
      },
      body: JSON.stringify({ text }),
      signal: controller.signal,
    });
    clearTimeout(timeout);
    if (!res.ok) {
      throw new Error('Cloud classification failed');
    }
    return res.json();
  } catch (err) {
    clearTimeout(timeout);
    throw err;
  }
}
