document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    const messageArea = document.getElementById('messageArea');

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault(); // Prevent the page from reloading

        // Clear any old messages
        messageArea.innerText = '';
        messageArea.className = 'message-area';

        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;

        try {
            const response = await fetch('http://localhost:8080/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ username, password })
            });

            if (response.ok) {
                const data = await response.json();

                // 1. Save the token to localStorage
                localStorage.setItem('jwtToken', data.token);
                localStorage.setItem('username', username); // Optional: save name for a welcome message

                // 2. Redirect to the dashboard
                window.location.href = 'dashboard.html';
            } else {
                // 3. Handle 401 Unauthorized or other errors
                messageArea.innerText = 'Invalid username or password.';
                messageArea.classList.add('error');
            }
        } catch (error) {
            console.error('Fetch error:', error);
            messageArea.innerText = 'Could not connect to the server. Is the backend running?';
            messageArea.classList.add('error');
        }
    });
});