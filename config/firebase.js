import { initializeApp } from "https://www.gstatic.com/firebasejs/9.20.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/9.20.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/9.20.0/firebase-firestore.js";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCMW_4aVscvmCMxZhmfARxlsNNgWEjltFA",
  authDomain: "calculatoe-virtual-lab.firebaseapp.com",
  projectId: "calculatoe-virtual-lab",
  storageBucket: "calculatoe-virtual-lab.firebasestorage.app",
  messagingSenderId: "478943806632",
  appId: "1:478943806632:web:e06ac95b1c5a3fd3fcee9d",
  measurementId: "G-XW2DY0Z4HX"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);  // Firebase Authentication
const db = getFirestore(app);  // Firestore

export { auth, db }; // Export Firebase Authentication and Firestore