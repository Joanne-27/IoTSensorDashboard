document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('jwtToken');
    const fullEmail = localStorage.getItem('username');

    // 1. Security Gate
    if (!token) {
        window.location.href = 'index.html';
        return;
    }

    // 2. Personalize Header (Joanne)
    if (fullEmail) {
        const rawName = fullEmail.split('@')[0];
        const capitalizedName = rawName.charAt(0).toUpperCase() + rawName.slice(1);
        const userDisplay = document.getElementById('userDisplay');
        if (userDisplay) userDisplay.innerText = capitalizedName;
    }

    // 3. Logout Logic
    document.getElementById('logoutBtn').addEventListener('click', () => {
        localStorage.clear();
        window.location.href = 'index.html';
    });

    // 4. Fetch and Display Devices
    fetchDevices(token);
});

async function fetchDevices(token) {
    const deviceListContainer = document.getElementById('deviceList');

    try {
        const response = await fetch('/api/devices', {
            method: 'GET',
            headers: {
                'Authorization': 'Bearer ' + token, // Send the JWT key!
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
    deviceListContainer.innerHTML = ''; // Clear the "Loading..." message

    if (devices.length === 0) {
        deviceListContainer.innerHTML = '<p>No devices found for your account.</p>';
        return;
    }

    devices.forEach(device => {
        const card = document.createElement('div');
        card.className = 'device-card';

        // Get the latest reading value
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