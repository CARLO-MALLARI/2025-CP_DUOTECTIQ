import { initializeApp } from 'firebase/app';
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDYHZKXOHR4Cki5U17IErTEWFE5obAB-jk",
  authDomain: "ml-crop-45553.firebaseapp.com",
  projectId: "ml-crop-45553",
  storageBucket: "ml-crop-45553.firebasestorage.app",
  messagingSenderId: "968013919047",
  appId: "1:968013919047:web:248dacf9e40ccbde001262",
  measurementId: "G-8QT1L11BJS"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);