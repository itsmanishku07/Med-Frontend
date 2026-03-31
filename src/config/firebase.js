import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'


const firebaseConfig = {
  apiKey: "AIzaSyADdhVRwB2NXGHjWalEk4G53q0wasdbYLE",
  authDomain: "studio-9566651049-f8441.firebaseapp.com",
  projectId: "studio-9566651049-f8441",
  storageBucket: "studio-9566651049-f8441.firebasestorage.app",
  messagingSenderId: "128047057243",
  appId: "1:128047057243:web:e9ee0365bdaf42a6d3b27e"
};

const app = initializeApp(firebaseConfig)

export const auth = getAuth(app)

export const db = getFirestore(app)

export default app