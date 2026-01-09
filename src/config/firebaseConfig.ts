import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBI6YQpzlnksSRHRNmF1uz_Q98NwMiMmbQ",
  authDomain: "utapartmentapp2.firebaseapp.com",
  projectId: "utapartmentapp2",
  storageBucket: "utapartmentapp2.firebasestorage.app",
  messagingSenderId: "1003802322296",
  appId: "1:1003802322296:web:e227b417a72de47609d48d",
  measurementId: "G-NKZ9T3K93V"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication
export const auth = getAuth(app);

// Initialize Firestore
export const db = getFirestore(app);

export default app;