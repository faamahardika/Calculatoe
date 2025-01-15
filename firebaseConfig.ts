import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

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

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);

// Initialize Cloud Firestore and get a reference to the service
export const db = getFirestore(app);

export default app;
