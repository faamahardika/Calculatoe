import { auth } from '../config/firebase.js';
import { db } from "../config/firebase.js";
import { createUserWithEmailAndPassword, sendEmailVerification } from "https://www.gstatic.com/firebasejs/9.20.0/firebase-auth.js";
import { doc, setDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/9.20.0/firebase-firestore.js";

document.getElementById('sign-up-form').addEventListener('submit', function (e) {
    e.preventDefault();

    const email = document.getElementById('email').value;
    const password = document.getElementById('new-password').value;
    const confirmPassword = document.getElementById('confirm-password').value;

    // Password validation
    if (password !== confirmPassword) {
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'Passwords do not match.',
        });
        return;
    }

    // User registration
    createUserWithEmailAndPassword(auth, email, password)
        .then((userCredential) => {
            // Successful account creation
            const user = userCredential.user;

            // Create user document
            return setDoc(doc(db, 'users', user.uid), {
                email: email,
                createdAt: serverTimestamp(),
            })
            .then(() => {
                // Create player wins data
                return setDoc(doc(db, 'playerStats', user.uid), {
                    easy: 0,
                    medium: 0,
                    hard: 0,
                    total: 0,
                    createdAt: serverTimestamp()
                });
            })
            .then(() => {
                // Send email verification
                return sendEmailVerification(user);
            })
            .then(() => {
                Swal.fire({
                    icon: 'success',
                    title: 'Account Created!',
                    text: `A verification email has been sent to ${email}. Please check your inbox.`,
                }).then(() => {
                    window.location.href = 'signin.html';
                });
            });
        })
        .catch((error) => {
            console.error('Registration Error:', error);
            
            // Detailed error handling
            let errorMessage = 'Sign Up Failed';
            switch (error.code) {
                case 'auth/email-already-in-use':
                    errorMessage = 'Email is already registered';
                    break;
                case 'auth/invalid-email':
                    errorMessage = 'Invalid email format';
                    break;
                case 'auth/weak-password':
                    errorMessage = 'Password is too weak';
                    break;
                default:
                    errorMessage = error.message;
            }

            Swal.fire({
                icon: 'error',
                title: 'Sign Up Failed',
                text: errorMessage,
            });
        });
});