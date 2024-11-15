import { auth } from '../config/firebase.js';
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/9.20.0/firebase-auth.js";

const authButton = document.getElementById('auth-button');
const profileIcon = document.getElementById('profile-icon');
const userInfo = document.getElementById('user-info');
const profilePopup = document.getElementById('profile-popup');


// Monitor authentication state
function createStatsButton() {
    const statsButton = document.createElement('button');
    statsButton.textContent = 'View Stats';
    statsButton.id = 'view-stats-button';
    statsButton.classList.add('stats-button');
    
    statsButton.addEventListener('click', () => {
        // Import the showPlayerStats function dynamically to avoid circular dependency
        import('./game.js').then(module => {
            module.showPlayerStats();
            profilePopup.classList.add('hide'); // Close the popup
        });
    });

    return statsButton;
}

// Monitor authentication state
onAuthStateChanged(auth, (user) => {
    console.log('Auth state changed:', user);
    
    // Remove any existing stats button
    const existingStatsButton = document.getElementById('view-stats-button');
    if (existingStatsButton) {
        existingStatsButton.remove();
    }

    if (user) {
        // User is signed in
        const email = user.email;
        userInfo.textContent = `Logged in as: ${email}`;
        authButton.textContent = 'Sign Out';
        profilePopup.classList.remove('logged-out');

        // Add stats button
        const statsButton = createStatsButton();
        profilePopup.appendChild(statsButton);
    } else {
        // User is signed out
        userInfo.textContent = 'Not Logged In';
        authButton.textContent = 'Sign In';
        profilePopup.classList.add('logged-out');
    }
});

// Handle sign in/out button click
authButton.addEventListener('click', () => {
    if (authButton.textContent === 'Sign Out') {
        signOut(auth).then(() => {
            console.log('User signed out');
        }).catch((error) => {
            console.error('Sign out error:', error);
        });
    } else {
        // Redirect to sign-in page
        window.location.href = 'signin.html';
    }
});

// Show/hide profile popup on profile icon click
profileIcon.addEventListener('click', () => {
    profilePopup.classList.toggle('hide');
});