document.getElementById('sign-up-form').addEventListener('submit', function (e) {
    e.preventDefault(); // Mencegah reload halaman

    const username = document.getElementById('new-username').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('new-password').value;
    const confirmPassword = document.getElementById('confirm-password').value;

    // Validasi password dan konfirmasi password
    if (password !== confirmPassword) {
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'Passwords do not match.',
        });
        return;
    }

    // Simulasi penyimpanan data dan pesan sukses
    Swal.fire({
        icon: 'success',
        title: 'Account Created!',
        text: `Welcome, ${username}!`,
    }).then(() => {
        window.location.href = 'signin.html'; // Redirect ke halaman Sign In
    });
});
