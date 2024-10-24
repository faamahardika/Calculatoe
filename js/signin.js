document.getElementById('sign-in-form').addEventListener('submit', function (e) {
    e.preventDefault(); // Mencegah reload halaman

    const usernameEmail = document.getElementById('username-email').value;
    const password = document.getElementById('password').value;

    // Simulasi login dengan username/email dan password
    if (usernameEmail === 'user' && password === 'password') {
        Swal.fire({
            icon: 'success',
            title: 'Login Successful!',
            text: 'Welcome back!',
        }).then(() => {
            window.location.href = 'index.html'; // Redirect ke halaman utama
        });
    } else {
        Swal.fire({
            icon: 'error',
            title: 'Login Failed',
            text: 'Invalid username or password.',
        });
    }
});
