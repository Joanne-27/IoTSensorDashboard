document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    const messageArea = document.getElementById('messageArea');
    const logoutBtn = document.getElementById('logoutBtn');
    const appBody = document.getElementById('appBody');

    // --- View Management ---
    function showView(viewId) {
        document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
        const targetView = document.getElementById(viewId);
        if (targetView) {
            targetView.classList.add('active');
        }

        if (viewId === 'dashboardView') {
            appBody.classList.add('dashboard-body');
            initDashboard();
        } else {
            appBody.classList.remove('dashboard-body');
        }
    }

    // --- Authentication Check ---
    const token = localStorage.getItem('jwtToken');
    if (token) {
        showView('dashboardView');
    } else {
        showView('loginView');
    }

    // --- Login Logic ---
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            messageArea.innerText = '';
            messageArea.className = 'error-text';

            const username = document.getElementById('username').value;
            const password = document.getElementById('password').value;

            try {
                const response = await fetch('/auth/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username, password })
                });

                if (response.ok) {
                    const data = await response.json();
                    localStorage.setItem('jwtToken', data.token);
                    localStorage.setItem('username', username);
                    showView('dashboardView');
                } else if (response.status === 401) {
                    const message = await response.text();
                    messageArea.innerText = message || 'Invalid username or password.';
                } else {
                    messageArea.innerText = 'Something went wrong. Please try again later.';
                }
            } catch (error) {
                console.error('Fetch error:', error);
                messageArea.innerText = 'Could not connect to the server.';
            }
        });
    }

    // --- Logout Logic ---
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            localStorage.clear();
            showView('loginView');
        });
    }

    // --- Dashboard Logic ---
    function initDashboard() {
        const token = localStorage.getItem('jwtToken');
        const fullEmail = localStorage.getItem('username');

        if (fullEmail) {
            const rawName = fullEmail.split('@')[0];
            const capitalizedName = rawName.charAt(0).toUpperCase() + rawName.slice(1);
            const userDisplay = document.getElementById('userDisplay');
            if (userDisplay) userDisplay.innerText = capitalizedName;
        }

        fetchDevices(token);
    }

    async function fetchDevices(token) {
        const deviceListContainer = document.getElementById('deviceList');
        if (!deviceListContainer) return;

        try {
            const response = await fetch('/api/devices', {
                method: 'GET',
                headers: {
                    'Authorization': 'Bearer ' + token,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const devices = await response.json();
                displayDevices(devices);
            } else {
                deviceListContainer.innerHTML = `<p class="error-text">Failed to load devices. Status: ${response.status}</p>`;
            }
        } catch (error) {
            console.error('Error fetching devices:', error);
            deviceListContainer.innerHTML = '<p class="error-text">Server connection lost.</p>';
        }
    }

    function displayDevices(devices) {
        const deviceListContainer = document.getElementById('deviceList');
        if (!deviceListContainer) return;
        
        deviceListContainer.innerHTML = '';

        if (devices.length === 0) {
            deviceListContainer.innerHTML = '<p>No devices found for your account.</p>';
            return;
        }

        devices.forEach(device => {
            const card = document.createElement('div');
            card.className = 'device-card';
            const latestValue = device.readings && device.readings.length > 0
                ? device.readings[device.readings.length - 1].value
                : '--';

            let icon = 'fa-microchip';
            if (device.type === 'Temperature') icon = 'fa-thermometer-half';
            if (device.type === 'Humidity') icon = 'fa-tint';
            if (device.type === 'Security' || device.type === 'Motion') icon = 'fa-shield-alt';

            card.innerHTML = `
                <div class="card-icon"><i class="fas ${icon}"></i></div>
                <h3>${device.name}</h3>
                <div class="reading-display">
                    <span class="value">${latestValue}</span>
                    <span class="unit">${device.unit}</span>
                </div>
                <p class="device-type">${device.type}</p>
                <div class="device-status">
                    <span class="status-indicator active"></span>
                    Connected
                </div>
            `;
            deviceListContainer.appendChild(card);
        });
    }
});