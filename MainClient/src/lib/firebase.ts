import { initializeApp } from 'firebase/app';
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAR3Fqq3rZcPvdYIsncdaqKI-Gv3yfYLWM",
  authDomain: "duotectiq.firebaseapp.com",
  projectId: "duotectiq",
  storageBucket: "duotectiq.firebasestorage.app",
  messagingSenderId: "261048712743",
  appId: "1:261048712743:web:740d3663911cb1f7065802",
  measurementId: "G-89L4LRLTC7"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);