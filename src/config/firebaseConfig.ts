import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Firebase project configuration — these values are public-facing identifiers,
// not secrets. They tell the Firebase SDK which project to connect to.
// Actual security is enforced server-side through Firebase Security Rules,
// not by keeping these values hidden.
const firebaseConfig = {
  apiKey: "AIzaSyBI6YQpzlnksSRHRNmF1uz_Q98NwMiMmbQ",
  authDomain: "utapartmentapp2.firebaseapp.com",
  projectId: "utapartmentapp2",
  storageBucket: "utapartmentapp2.firebasestorage.app",
  messagingSenderId: "1003802322296",
  appId: "1:1003802322296:web:e227b417a72de47609d48d",
  measurementId: "G-NKZ9T3K93V",
};

// initializeApp registers this Firebase project with the SDK. Calling it more
// than once with the same config would throw, so this module is imported as a
// singleton — every file that needs Firebase imports from here rather than
// calling initializeApp themselves.
const app = initializeApp(firebaseConfig);

// auth and db are exported as named exports so individual services (AuthContext,
// userService, PreferencesContext, etc.) can import only what they need
// without pulling in the full app instance.
export const auth = getAuth(app);
export const db = getFirestore(app);

export default app;