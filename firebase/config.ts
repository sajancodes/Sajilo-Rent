// Fix: Replaced placeholder content with standard Firebase initialization.
// Fix: Use Firebase v8 compatibility imports to resolve module errors.
// Fix: Use Firebase v8 compatibility imports to resolve module errors.
import firebase from "firebase/compat/app";
import "firebase/compat/auth";
// Fix: Import firestore to initialize the database instance.
import "firebase/compat/firestore";

// IMPORTANT: Replace with your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDzsygXBNNRAmsro0--m8V9BuvYw6HbI0A",
  authDomain: "room-sathi-cc340.firebaseapp.com",
  projectId: "room-sathi-cc340",
  storageBucket: "room-sathi-cc340.appspot.com",
  messagingSenderId: "902347293681",
  appId: "1:902347293681:web:88be6c9326d285e73efa50",
  measurementId: "G-1NH70MDZHY"
};

// Initialize Firebase
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}

// Get Firebase services
const auth = firebase.auth();
// Fix: Initialize the Firestore database instance.
const db = firebase.firestore();

// Fix: Export the 'db' instance to make it available for other modules.
export { auth, db };
