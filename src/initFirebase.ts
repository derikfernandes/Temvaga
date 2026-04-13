import { initializeApp, type FirebaseOptions } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

/** Placeholder só para o app subir sem .env; login/dados reais exigem projeto Firebase. */
const placeholderConfig: FirebaseOptions = {
  apiKey: 'local-dev-placeholder',
  authDomain: 'local-dev-placeholder.firebaseapp.com',
  projectId: 'local-dev-placeholder',
  storageBucket: 'local-dev-placeholder.appspot.com',
  messagingSenderId: '000000000000',
  appId: '1:000000000000:web:localdevplaceholder',
};

const firebaseConfig: FirebaseOptions = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || placeholderConfig.apiKey,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || placeholderConfig.authDomain,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || placeholderConfig.projectId,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || placeholderConfig.storageBucket,
  messagingSenderId:
    import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || placeholderConfig.messagingSenderId,
  appId: import.meta.env.VITE_FIREBASE_APP_ID || placeholderConfig.appId,
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
