import { auth } from '../config/firebase.js';
import { signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/9.20.0/firebase-auth.js";

document.getElementById('sign-in-form').addEventListener('submit', function (e) {
    e.preventDefault(); // Prevent page reload

    const Email = document.getElementById('email').value.trim(); // Trim whitespace
    const password = document.getElementById('password').value;

    // Validate email format
    if (!isValidEmail(Email)) {
        Swal.fire({
            icon: 'error',
            title: 'Invalid Email',
            text: 'Please enter a valid email address.',
        });
        return; // Exit the function if the email is invalid
    }

    // Sign in with Firebase Authentication
    signInWithEmailAndPassword(auth, Email, password)
        .then((userCredential) => {
            const user = userCredential.user;
            Swal.fire({
                icon: 'success',
                title: 'Sign In Successful!',
                text: `Welcome back, ${user.email}!`,
            }).then(() => {
                window.location.href = 'index.html'; // Redirect to home page or dashboard
            });
        })
        .catch((error) => {
            const errorMessage = error.message;
            Swal.fire({
                icon: 'error',
                title: 'Sign In Failed',
                text: errorMessage,
            });
        });
});

// Function to validate email format
function isValidEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/; // Simple regex for email validation
    return re.test(String(email).toLowerCase());
}