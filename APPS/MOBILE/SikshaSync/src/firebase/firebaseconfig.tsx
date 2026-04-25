// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyD9gMFIYXzjL6vPNd7qb0uwKaOS7XJPdvE",
  authDomain: "sikshasync.firebaseapp.com",
  projectId: "sikshasync",
  storageBucket: "sikshasync.firebasestorage.app",
  messagingSenderId: "284247735551",
  appId: "1:284247735551:web:31fce400d79adb262c20ca",
  measurementId: "G-4G32T852W0"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
export const auth = getAuth(app);
export const db = getFirestore(app);