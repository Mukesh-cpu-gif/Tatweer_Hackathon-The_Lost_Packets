import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCA_0dCQTM-ngMIMN0PhBvkBvEdkJA-0bw",
  authDomain: "aounak-hackathon.firebaseapp.com",
  projectId: "aounak-hackathon",
  storageBucket: "aounak-hackathon.firebasestorage.app",
  messagingSenderId: "758994168784",
  appId: "1:758994168784:web:38d5efecc213a25951e7d5"
};

// Initialize Firebase only if it hasn't been initialized already
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

export const auth = getAuth(app);
export const db = getFirestore(app);

export default app;
