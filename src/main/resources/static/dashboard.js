document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('jwtToken');
    const fullEmail = localStorage.getItem('username'); // Stored as joanne@mail.com

    // 1. Security Gate: Redirect if not logged in
    if (!token) {
        window.location.href = 'index.html';
        return;
    }

    // 2. Display the formatted username
    if (fullEmail) {
        // Get the name part before the @
        const rawName = fullEmail.split('@')[0];

        // Capitalize the first letter
        const capitalizedName = rawName.charAt(0).toUpperCase() + rawName.slice(1);

        // Update the UI
        const userDisplay = document.getElementById('userDisplay');
        if (userDisplay) {
            userDisplay.innerText = capitalizedName;
        }


    // 3. Logout logic
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            localStorage.clear(); // Clears both token and username
            window.location.href = 'index.html';
        });
    }

    // Next step: add fetchDevices() here!
});