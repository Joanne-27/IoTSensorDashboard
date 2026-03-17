document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    const messageArea = document.getElementById('messageArea');
    const logoutBtn = document.getElementById('logoutBtn');
    const appBody = document.getElementById('appBody');

    let cachedDevices = [];
    let deviceToDeleteId = null;
    let deviceToEditSettingsId = null;
    let refreshInterval = null;

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

            // Check for Admin Role and show "Add Device" button
            const userRole = sessionStorage.getItem('userRole');
            const addDeviceBtn = document.getElementById('addDeviceBtn');
            if (addDeviceBtn) {
                addDeviceBtn.style.setProperty('display', userRole === 'ROLE_ADMIN' ? 'block' : 'none', 'important');
            }
        } else {
            appBody.classList.remove('dashboard-body');
        }
    }

    function switchDashboardTab(tabId) {
        // Toggle Active Link
        document.querySelectorAll('.sidebar-nav a').forEach(a => a.classList.remove('active'));
        if (tabId === 'overview') {
            document.getElementById('overviewLink').classList.add('active');
            document.getElementById('overviewContent').style.display = 'block';
            document.getElementById('sensorsContent').style.display = 'none';
            displayDevices(cachedDevices); // Refresh grid
        } else if (tabId === 'sensors') {
            document.getElementById('sensorsLink').classList.add('active');
            document.getElementById('overviewContent').style.display = 'none';
            document.getElementById('sensorsContent').style.display = 'block';
            if (deviceSearchInput) deviceSearchInput.value = ''; // Reset search on tab switch
            displaySensorsTable(cachedDevices); // Populate table
        }
    }

    // --- Tab Event Listeners ---
    const overviewLink = document.getElementById('overviewLink');
    const sensorsLink = document.getElementById('sensorsLink');
    const addDeviceBtn = document.getElementById('addDeviceBtn');
    const cancelDeviceBtn = document.getElementById('cancelDeviceBtn');
    const saveDeviceBtn = document.getElementById('saveDeviceBtn');
    const addDeviceForm = document.getElementById('addDeviceForm');
    const addDeviceMessage = document.getElementById('addDeviceMessage');
    const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');
    const cancelDeleteConfirmBtn = document.getElementById('cancelDeleteConfirmBtn');
    const cancelSettingsBtn = document.getElementById('cancelSettingsBtn');
    const saveSettingsBtn = document.getElementById('saveSettingsBtn');
    const settingsMessage = document.getElementById('settingsMessage');
    const deviceSearchInput = document.getElementById('deviceSearch');
    const deviceTypeSelect = document.getElementById('deviceType');
    const deviceUnitSelect = document.getElementById('deviceUnit');

    if (deviceTypeSelect && deviceUnitSelect) {
        deviceTypeSelect.addEventListener('change', (e) => {
            const selectedType = e.target.value;
            const unitMapping = {
                'Temperature': '°C',
                'Humidity': '%',
                'Pressure': 'hPa',
                'Light': 'lx',
                'CO2': 'ppm',
                'Motion': 'Binary'
            };
            
            if (unitMapping[selectedType]) {
                deviceUnitSelect.value = unitMapping[selectedType];
            }
        });
    }

    if (deviceSearchInput) {
        deviceSearchInput.addEventListener('input', (e) => {
            const searchTerm = e.target.value.toLowerCase();
            const filteredDevices = cachedDevices.filter(device =>
                device.name.toLowerCase().includes(searchTerm) ||
                device.type.toLowerCase().includes(searchTerm) ||
                device.id.toString().includes(searchTerm) ||
                (device.owner && device.owner.toLowerCase().includes(searchTerm))
            );
            displaySensorsTable(filteredDevices);
        });
    }

    if (overviewLink) {
        overviewLink.addEventListener('click', (e) => {
            e.preventDefault();
            switchDashboardTab('overview');
        });
    }

    if (sensorsLink) {
        sensorsLink.addEventListener('click', (e) => {
            e.preventDefault();
            switchDashboardTab('sensors');
        });
    }

    if (addDeviceBtn) {
        addDeviceBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            if (addDeviceForm) addDeviceForm.reset();
            if (addDeviceMessage) addDeviceMessage.innerText = '';

            // Populate user dropdown
            const token = sessionStorage.getItem('jwtToken');
            if (token) {
                fetchUsers(token);
            }

            const modalElement = document.getElementById('addDeviceModal');
            if (window.bootstrap && window.bootstrap.Modal) {
                let modal = bootstrap.Modal.getOrCreateInstance(modalElement);
                modal.show();
            }
        });
    }

    if (cancelDeviceBtn) {
        cancelDeviceBtn.addEventListener('click', () => {
            const modalElement = document.getElementById('addDeviceModal');
            const modalInstance = bootstrap.Modal.getInstance(modalElement);
            if (modalInstance) {
                modalInstance.hide();
            }
        });
    }

    if (cancelDeleteConfirmBtn) {
        cancelDeleteConfirmBtn.addEventListener('click', () => {
            const modalElement = document.getElementById('deleteDeviceModal');
            const modalInstance = bootstrap.Modal.getInstance(modalElement);
            if (modalInstance) {
                modalInstance.hide();
            }
        });
    }

    if (cancelSettingsBtn) {
        cancelSettingsBtn.addEventListener('click', () => {
            const modalElement = document.getElementById('settingsDeviceModal');
            const modalInstance = bootstrap.Modal.getInstance(modalElement);
            if (modalInstance) {
                modalInstance.hide();
            }
        });
    }

    if (saveSettingsBtn) {
        saveSettingsBtn.addEventListener('click', async () => {
            if (!deviceToEditSettingsId) return;
            const threshold = document.getElementById('maxThreshold').value;
            const token = sessionStorage.getItem('jwtToken');
            
            try {
                const response = await fetch(`/api/devices/${deviceToEditSettingsId}/settings`, {
                    method: 'PUT',
                    headers: { 
                        'Authorization': 'Bearer ' + token,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ maxThreshold: threshold ? parseFloat(threshold) : null })
                });

                if (response.ok) {
                    const modalElement = document.getElementById('settingsDeviceModal');
                    const modalInstance = bootstrap.Modal.getInstance(modalElement);
                    if (modalInstance) modalInstance.hide();
                    fetchDevices(token);
                } else {
                    const errorMsg = await response.text();
                    settingsMessage.innerText = errorMsg || 'Failed to update settings.';
                }
            } catch (error) {
                console.error('Error updating settings:', error);
                settingsMessage.innerText = 'Server error occurred.';
            }
        });
    }

    if (confirmDeleteBtn) {
        confirmDeleteBtn.addEventListener('click', async () => {
            if (!deviceToDeleteId) return;

            const token = sessionStorage.getItem('jwtToken');
            try {
                const response = await fetch(`/api/devices/${deviceToDeleteId}`, {
                    method: 'DELETE',
                    headers: { 'Authorization': 'Bearer ' + token }
                });

                if (response.ok) {
                    const modalElement = document.getElementById('deleteDeviceModal');
                    const modalInstance = bootstrap.Modal.getInstance(modalElement);
                    if (modalInstance) {
                        modalInstance.hide();
                    }

                    // Refresh Device List
                    fetchDevices(token);
                } else {
                    console.error('Failed to delete device:', await response.text());
                }
            } catch (error) {
                console.error('Error deleting device:', error);
            } finally {
                deviceToDeleteId = null;
            }
        });
    }

    async function fetchUsers(token) {
        try {
            const response = await fetch('/api/users', {
                headers: { 'Authorization': 'Bearer ' + token }
            });

            if (response.ok) {
                const users = await response.json();
                const userDropdown = document.getElementById('assignUser');
                if (userDropdown) {
                    // Keep the first placeholder option
                    userDropdown.innerHTML = '<option value="" selected disabled>Select a user</option>';
                    users.forEach(user => {
                        const option = document.createElement('option');
                        option.value = user.id;
                        option.textContent = user.username;
                        userDropdown.appendChild(option);
                    });
                }
            } else {
                console.error('Failed to fetch users:', await response.text());
            }
        } catch (error) {
            console.error('Error fetching users:', error);
        }
    }

    if (saveDeviceBtn) {
        saveDeviceBtn.addEventListener('click', async () => {
            const name = document.getElementById('deviceName').value;
            const type = document.getElementById('deviceType').value;
            const unit = document.getElementById('deviceUnit').value;
            const userId = document.getElementById('assignUser').value;

            if (!name || !type || !unit || !userId) {
                addDeviceMessage.innerText = 'Please fill in all fields.';
                return;
            }

            const token = sessionStorage.getItem('jwtToken');
            try {
                const response = await fetch('/api/devices', {
                    method: 'POST',
                    headers: {
                        'Authorization': 'Bearer ' + token,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ name, type, unit, userId: parseInt(userId) })
                });

                if (response.status === 201) {
                    // Success!
                    const modalElement = document.getElementById('addDeviceModal');
                    const modalInstance = bootstrap.Modal.getInstance(modalElement);
                    if (modalInstance) modalInstance.hide();

                    // Refresh Device List
                    fetchDevices(token);
                } else {
                    const errorMsg = await response.text();
                    addDeviceMessage.innerText = errorMsg || 'Failed to save device.';
                }
            } catch (error) {
                console.error('Error saving device:', error);
                addDeviceMessage.innerText = 'Server error occurred.';
            }
        });
    }

    // --- Authentication Check ---
    const token = sessionStorage.getItem('jwtToken');
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
                    sessionStorage.setItem('jwtToken', data.token);
                    sessionStorage.setItem('username', username);
                    sessionStorage.setItem('userRole', data.role);
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
            sessionStorage.clear();

            // Clear Dashboard State
            cachedDevices = [];
            if (refreshInterval) {
                clearInterval(refreshInterval);
                refreshInterval = null;
            }

            // Reset Dashboard UI
            const userDisplay = document.getElementById('userDisplay');
            if (userDisplay) userDisplay.innerText = 'User';

            const deviceListContainer = document.getElementById('deviceList');
            if (deviceListContainer) {
                deviceListContainer.innerHTML = `
                    <div class="loading-state">
                        <i class="fas fa-circle-notch fa-spin"></i>
                        <p>Fetching your sensor data...</p>
                    </div>
                `;
            }

            const tableBody = document.getElementById('sensorsTableBody');
            if (tableBody) tableBody.innerHTML = '';

            // Reset Metrics
            ['totalActive', 'criticalAlerts'].forEach(id => {
                const el = document.getElementById(id);
                if (el) el.innerText = '0';
            });
            const avgTemp = document.getElementById('avgTemp');
            if (avgTemp) avgTemp.innerText = '0.0 °C';
            const avgHumidity = document.getElementById('avgHumidity');
            if (avgHumidity) avgHumidity.innerText = '0 %';

            // Reset sidebar navigation to overview
            switchDashboardTab('overview');

            showView('loginView');
        });
    }

    // --- Dashboard Logic ---
    function initDashboard() {
        const token = sessionStorage.getItem('jwtToken');
        const fullEmail = sessionStorage.getItem('username');

        if (fullEmail) {
            const rawName = fullEmail.split('@')[0];
            const capitalizedName = rawName.charAt(0).toUpperCase() + rawName.slice(1);
            const userDisplay = document.getElementById('userDisplay');
            if (userDisplay) userDisplay.innerText = capitalizedName;
        }

        fetchDevices(token);

        // Start real-time updates every 10 seconds
        if (refreshInterval) clearInterval(refreshInterval);
        refreshInterval = setInterval(() => {
            const currentToken = sessionStorage.getItem('jwtToken');
            if (currentToken) {
                fetchDevices(currentToken);
            }
        }, 10000);
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
                cachedDevices = devices;

                // Update Overview Grid
                displayDevices(devices);

                // Update Sensors Table if it is visible
                const sensorsContent = document.getElementById('sensorsContent');
                if (sensorsContent && sensorsContent.style.display !== 'none') {
                    displaySensorsTable(devices);
                }
            } else {
                deviceListContainer.innerHTML = `<p class="error-text">Failed to load devices. Status: ${response.status}</p>`;
            }
        } catch (error) {
            console.error('Error fetching devices:', error);
            deviceListContainer.innerHTML = '<p class="error-text">Server connection lost.</p>';
        }
    }

    function updateMetrics(devices) {
        const totalActive = devices.length;
        let criticalCount = 0;

        // 1. Add Humidity accumulators
        let tempSum = 0, tempCount = 0;
        let humSum = 0, humCount = 0;

        devices.forEach(device => {
            const latestReading = device.readings && device.readings.length > 0
                ? device.readings[device.readings.length - 1].value
                : null;

            if (latestReading !== null) {
                // Determine the threshold: user-set maxThreshold or default based on type
                let threshold = device.maxThreshold;
                if (threshold === null || threshold === undefined) {
                    if (device.type === 'Temperature') threshold = 28;
                    else if (device.type === 'Humidity') threshold = 80;
                }

                // Increment criticalCount if latest reading exceeds threshold
                if (threshold !== null && threshold !== undefined && latestReading > threshold) {
                    criticalCount++;
                }

                // Aggregate stats for metrics grid
                if (device.type === 'Temperature') {
                    tempSum += latestReading;
                    tempCount++;
                }
                if (device.type === 'Humidity') {
                    humSum += latestReading;
                    humCount++;
                }
            }
        });

        // Update the UI
        document.getElementById('totalActive').innerText = totalActive;
        document.getElementById('criticalAlerts').innerText = criticalCount;

        // Average Temperature
        document.getElementById('avgTemp').innerText = tempCount > 0
            ? (tempSum / tempCount).toFixed(1) + ' °C'
            : '-- °C';

        // 4. Update Average Humidity
        document.getElementById('avgHumidity').innerText = humCount > 0
            ? (humSum / humCount).toFixed(1) + ' %'
            : '-- %';
    }

    function displayDevices(devices) {
        updateMetrics(devices);
        const deviceListContainer = document.getElementById('deviceList');
        if (!deviceListContainer) return;

        deviceListContainer.innerHTML = '';

        if (devices.length === 0) {
            deviceListContainer.innerHTML = '<p>No devices found for your account.</p>';
            return;
        }

        const isAdmin = sessionStorage.getItem('userRole') === 'ROLE_ADMIN';

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

            const ownerHtml = isAdmin ? `<p class="device-owner"><i class="fas fa-user"></i> ${device.owner}</p>` : '';

            card.innerHTML = `
                <div class="card-icon"><i class="fas ${icon}"></i></div>
                <h3>${device.name}</h3>
                <div class="reading-display">
                    <span class="value">${latestValue}</span>
                    <span class="unit">${device.unit}</span>
                </div>
                <p class="device-type">${device.type}</p>
                ${ownerHtml}
                <div class="device-status">
                    <span class="status-indicator active"></span>
                    Connected
                </div>
            `;
            deviceListContainer.appendChild(card);
        });
    }

    function displaySensorsTable(devices) {
        const tableBody = document.getElementById('sensorsTableBody');
        if (!tableBody) return;

        tableBody.innerHTML = '';

        if (devices.length === 0) {
            const searchTerm = deviceSearchInput ? deviceSearchInput.value : '';
            const message = searchTerm
                ? `No devices matching "${searchTerm}" found.`
                : 'No sensor data found.';
            tableBody.innerHTML = `<tr><td colspan="7" style="text-align: center;">${message}</td></tr>`;
            return;
        }

        const isAdmin = sessionStorage.getItem('userRole') === 'ROLE_ADMIN';

        // Show/Hide "User" Header in table
        document.querySelectorAll('.data-table th.admin-only, .data-table td.admin-only').forEach(el => {
            el.style.setProperty('display', isAdmin ? 'table-cell' : 'none', 'important');
        });

        devices.forEach(device => {
            const tr = document.createElement('tr');
            
            // Calculate Threshold (same as updateMetrics)
            let threshold = device.maxThreshold;
            if (threshold === null || threshold === undefined) {
                if (device.type === 'Temperature') threshold = 28;
                else if (device.type === 'Humidity') threshold = 80;
            }

            const latestReadingValue = device.readings && device.readings.length > 0
                ? device.readings[device.readings.length - 1].value
                : null;

            const isCritical = latestReadingValue !== null && threshold !== null && latestReadingValue > threshold;

            if (isCritical) {
                tr.classList.add('table-danger');
            }

            const latestReadingHtml = latestReadingValue !== null
                ? `${isCritical ? '<i class="fas fa-exclamation-triangle text-danger" style="margin-right: 8px;"></i>' : ''}${latestReadingValue} ${device.unit}`
                : '--';

            const ownerTd = isAdmin ? `<td><span class="owner-badge">${device.owner}</span></td>` : '';
            
            let actionButtons = '';
            actionButtons += `
                <button class="btn-settings-icon" data-id="${device.id}" title="Device Settings">
                    <i class="fas fa-cog"></i>
                </button>
            `;
            
            if (isAdmin) {
                actionButtons += `
                    <button class="btn-delete-icon" data-id="${device.id}" title="Delete Device">
                        <i class="fas fa-trash-alt"></i>
                    </button>
                `;
            }

            const actionsTd = `<td>${actionButtons}</td>`;

            tr.innerHTML = `
                <td>#${device.id}</td>
                <td><strong>${device.name}</strong></td>
                ${ownerTd}
                <td>${device.type}</td>
                <td>${latestReadingHtml}</td>
                <td><span class="status-badge online">Online</span></td>
                ${actionsTd}
            `;
            tableBody.appendChild(tr);
        });

        // Add event listeners for action buttons
        tableBody.querySelectorAll('.btn-settings-icon').forEach(btn => {
            btn.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                deviceToEditSettingsId = this.getAttribute('data-id');
                const device = cachedDevices.find(d => d.id == deviceToEditSettingsId);
                
                document.getElementById('settingsDeviceName').innerText = `Device: ${device.name}`;
                document.getElementById('maxThreshold').value = device.maxThreshold || '';
                const unitLabel = document.querySelector('label[for="maxThreshold"]');
                if (unitLabel) unitLabel.innerText = `Max Threshold (${device.unit || ''})`;
                settingsMessage.innerText = '';

                const modalElement = document.getElementById('settingsDeviceModal');
                if (window.bootstrap && window.bootstrap.Modal) {
                    let modal = bootstrap.Modal.getOrCreateInstance(modalElement);
                    modal.show();
                }
            });
        });

        if (isAdmin) {
            tableBody.querySelectorAll('.btn-delete-icon').forEach(btn => {
                btn.addEventListener('click', function(e) {
                    e.preventDefault();
                    e.stopPropagation();
                    deviceToDeleteId = this.getAttribute('data-id');
                    const modalElement = document.getElementById('deleteDeviceModal');
                    if (window.bootstrap && window.bootstrap.Modal) {
                        let modal = bootstrap.Modal.getOrCreateInstance(modalElement);
                        modal.show();
                    }
                });
            });
        }
    }
});