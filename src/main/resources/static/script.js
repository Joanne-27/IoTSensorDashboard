$(function() {
    const $loginForm = $('#loginForm');
    const $messageArea = $('#messageArea');
    const $logoutBtn = $('#logoutBtn');
    const $appBody = $('#appBody');

    let cachedDevices = [];
    let deviceToDeleteId = null;
    let deviceToEditSettingsId = null;
    let deviceToGraphId = null;
    let sensorChart = null;
    let refreshInterval = null;

    // --- View Management ---
    function showView(viewId) {
        $('.view').removeClass('active');
        const $targetView = $('#' + viewId);
        if ($targetView.length) {
            $targetView.addClass('active');
        }

        if (viewId === 'dashboardView') {
            $appBody.addClass('dashboard-body');
            initDashboard();

            // Check for Admin Role and show "Add Device" button
            const userRole = sessionStorage.getItem('userRole');
            const $addDeviceBtn = $('#addDeviceBtn');
            if ($addDeviceBtn.length) {
                $addDeviceBtn.css('display', userRole === 'ROLE_ADMIN' ? 'block' : 'none').attr('style', function(i, s) {
                    return (s || '') + ' display: ' + (userRole === 'ROLE_ADMIN' ? 'block' : 'none') + ' !important;';
                });
            }
        } else {
            $appBody.removeClass('dashboard-body');
        }
    }

    function switchDashboardTab(tabId) {
        // Toggle Active Link
        $('.sidebar-nav a').removeClass('active');
        if (tabId === 'overview') {
            $('#overviewLink').addClass('active');
            $('#overviewContent').show();
            $('#sensorsContent').hide();
            displayDevices(cachedDevices); // Refresh grid
        } else if (tabId === 'sensors') {
            $('#sensorsLink').addClass('active');
            $('#overviewContent').hide();
            $('#sensorsContent').show();
            $('#deviceSearch').val(''); // Reset search on tab switch
            displaySensorsTable(cachedDevices); // Populate table
        }
    }

    // --- Tab Event Listeners ---
    $('#overviewLink').on('click', (e) => {
        e.preventDefault();
        switchDashboardTab('overview');
    });

    $('#sensorsLink').on('click', (e) => {
        e.preventDefault();
        switchDashboardTab('sensors');
    });

    $('#deviceType').on('change', (e) => {
        const selectedType = $(e.target).val();
        const unitMapping = {
            'Temperature': '°C',
            'Humidity': '%',
            'Pressure': 'hPa',
            'Light': 'lx',
            'CO2': 'ppm',
            'Motion': 'Binary'
        };
        
        if (unitMapping[selectedType]) {
            $('#deviceUnit').val(unitMapping[selectedType]);
        }
    });

    $('#deviceSearch').on('input', (e) => {
        const searchTerm = $(e.target).val().toLowerCase();
        const filteredDevices = cachedDevices.filter(device =>
            device.name.toLowerCase().includes(searchTerm) ||
            device.type.toLowerCase().includes(searchTerm) ||
            device.id.toString().includes(searchTerm) ||
            (device.owner && device.owner.toLowerCase().includes(searchTerm))
        );
        displaySensorsTable(filteredDevices);
    });

    $('#addDeviceBtn').on('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        $('#addDeviceForm').trigger('reset');
        $('#addDeviceMessage').text('');

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

    $('#cancelDeviceBtn').on('click', () => {
        const modalElement = document.getElementById('addDeviceModal');
        const modalInstance = bootstrap.Modal.getInstance(modalElement);
        if (modalInstance) {
            modalInstance.hide();
        }
    });

    $('#cancelDeleteConfirmBtn').on('click', () => {
        const modalElement = document.getElementById('deleteDeviceModal');
        const modalInstance = bootstrap.Modal.getInstance(modalElement);
        if (modalInstance) {
            modalInstance.hide();
        }
    });

    $('#cancelSettingsBtn').on('click', () => {
        const modalElement = document.getElementById('settingsDeviceModal');
        const modalInstance = bootstrap.Modal.getInstance(modalElement);
        if (modalInstance) {
            modalInstance.hide();
        }
    });

    $('#saveSettingsBtn').on('click', async () => {
        if (!deviceToEditSettingsId) return;
        const threshold = $('#maxThreshold').val();
        const token = sessionStorage.getItem('jwtToken');
        
        $.ajax({
            url: `/api/devices/${deviceToEditSettingsId}/settings`,
            method: 'PUT',
            headers: { 
                'Authorization': 'Bearer ' + token
            },
            contentType: 'application/json',
            data: JSON.stringify({ maxThreshold: threshold ? parseFloat(threshold) : null }),
            success: function() {
                const modalElement = document.getElementById('settingsDeviceModal');
                const modalInstance = bootstrap.Modal.getInstance(modalElement);
                if (modalInstance) modalInstance.hide();
                fetchDevices(token);
            },
            error: function(xhr) {
                $('#settingsMessage').text(xhr.responseText || 'Failed to update settings.');
            }
        });
    });

    $('#confirmDeleteBtn').on('click', async () => {
        if (!deviceToDeleteId) return;

        const token = sessionStorage.getItem('jwtToken');
        $.ajax({
            url: `/api/devices/${deviceToDeleteId}`,
            method: 'DELETE',
            headers: { 'Authorization': 'Bearer ' + token },
            success: function() {
                const modalElement = document.getElementById('deleteDeviceModal');
                const modalInstance = bootstrap.Modal.getInstance(modalElement);
                if (modalInstance) {
                    modalInstance.hide();
                }

                // Refresh Device List
                fetchDevices(token);
                deviceToDeleteId = null;
            },
            error: function(xhr) {
                console.error('Failed to delete device:', xhr.responseText);
                deviceToDeleteId = null;
            }
        });
    });

    function fetchUsers(token) {
        $.ajax({
            url: '/api/users',
            headers: { 'Authorization': 'Bearer ' + token },
            success: function(users) {
                const $userDropdown = $('#assignUser');
                if ($userDropdown.length) {
                    // Keep the first placeholder option
                    $userDropdown.html('<option value="" selected disabled>Select a user</option>');
                    users.forEach(user => {
                        $userDropdown.append($('<option>', {
                            value: user.id,
                            text: user.username
                        }));
                    });
                }
            },
            error: function(xhr) {
                console.error('Failed to fetch users:', xhr.responseText);
            }
        });
    }

    $('#saveDeviceBtn').on('click', async () => {
        const name = $('#deviceName').val();
        const type = $('#deviceType').val();
        const unit = $('#deviceUnit').val();
        const userId = $('#assignUser').val();

        if (!name || !type || !unit || !userId) {
            $('#addDeviceMessage').text('Please fill in all fields.');
            return;
        }

        const token = sessionStorage.getItem('jwtToken');
        $.ajax({
            url: '/api/devices',
            method: 'POST',
            headers: {
                'Authorization': 'Bearer ' + token
            },
            contentType: 'application/json',
            data: JSON.stringify({ name, type, unit, userId: parseInt(userId) }),
            success: function(data, textStatus, xhr) {
                if (xhr.status === 201 || xhr.status === 200) {
                    const modalElement = document.getElementById('addDeviceModal');
                    const modalInstance = bootstrap.Modal.getInstance(modalElement);
                    if (modalInstance) modalInstance.hide();

                    // Refresh Device List
                    fetchDevices(token);
                }
            },
            error: function(xhr) {
                $('#addDeviceMessage').text(xhr.responseText || 'Failed to save device.');
            }
        });
    });

    $('#graphRangeForm').on('submit', async (e) => {
        e.preventDefault();
        if (!deviceToGraphId) return;

        const start = $('#startDate').val();
        const end = $('#endDate').val();
        const token = sessionStorage.getItem('jwtToken');
        const device = cachedDevices.find(d => d.id == deviceToGraphId);

        $.ajax({
            url: `/api/devices/${deviceToGraphId}/readings?start=${start}:00&end=${end}:00`,
            headers: { 'Authorization': 'Bearer ' + token },
            success: function(readings) {
                if (readings.length === 0) {
                    $('#graphMessage').text('No data found for this period.');
                    if (sensorChart) sensorChart.destroy();
                    return;
                }
                $('#graphMessage').text('');
                renderChart(readings, device);
            },
            error: function(xhr) {
                $('#graphMessage').text(xhr.responseText || 'Failed to fetch graph data.');
            }
        });
    });

    function renderChart(readings, device) {
        const ctx = document.getElementById('sensorChart').getContext('2d');
        
        const labels = readings.map(r => {
            const date = new Date(r.timestamp);
            return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        });
        const data = readings.map(r => r.value);

        if (sensorChart) {
            sensorChart.destroy();
        }

        sensorChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: `${device.name} (${device.unit})`,
                    data: data,
                    borderColor: '#2196f3',
                    backgroundColor: 'rgba(33, 150, 243, 0.1)',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.3,
                    pointRadius: 3
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    x: {
                        ticks: { color: '#ffffff80' },
                        grid: { color: '#ffffff1a' }
                    },
                    y: {
                        ticks: { color: '#ffffff80' },
                        grid: { color: '#ffffff1a' }
                    }
                },
                plugins: {
                    legend: {
                        labels: { color: '#ffffff' }
                    }
                }
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
    $loginForm.on('submit', async (e) => {
        e.preventDefault();
        $messageArea.text('').attr('class', 'error-text');

        const username = $('#username').val();
        const password = $('#password').val();

        $.ajax({
            url: '/auth/login',
            method: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({ username, password }),
            success: function(data) {
                sessionStorage.setItem('jwtToken', data.token);
                sessionStorage.setItem('username', username);
                sessionStorage.setItem('userRole', data.role);
                showView('dashboardView');
            },
            error: function(xhr) {
                if (xhr.status === 401) {
                    $messageArea.text(xhr.responseText || 'Invalid username or password.');
                } else {
                    $messageArea.text('Something went wrong. Please try again later.');
                }
            }
        });
    });

    // --- Logout Logic ---
    $logoutBtn.on('click', () => {
        sessionStorage.clear();

        // Clear Dashboard State
        cachedDevices = [];
        if (refreshInterval) {
            clearInterval(refreshInterval);
            refreshInterval = null;
        }

        // Reset Dashboard UI
        $('#userDisplay').text('User');
        $('#deviceList').html(`
            <div class="loading-state">
                <i class="fas fa-circle-notch fa-spin"></i>
                <p>Fetching your sensor data...</p>
            </div>
        `);
        $('#sensorsTableBody').empty();

        // Reset Metrics
        $('#totalActive, #criticalAlerts').text('0');
        $('#avgTemp').text('0.0 °C');
        $('#avgHumidity').text('0 %');

        // Reset sidebar navigation to overview
        switchDashboardTab('overview');

        showView('loginView');
    });

    // --- Dashboard Logic ---
    function initDashboard() {
        const token = sessionStorage.getItem('jwtToken');
        const fullEmail = sessionStorage.getItem('username');

        if (fullEmail) {
            const rawName = fullEmail.split('@')[0];
            const capitalizedName = rawName.charAt(0).toUpperCase() + rawName.slice(1);
            $('#userDisplay').text(capitalizedName);
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
        const $deviceListContainer = $('#deviceList');
        if (!$deviceListContainer.length) return;

        $.ajax({
            url: '/api/devices',
            method: 'GET',
            headers: {
                'Authorization': 'Bearer ' + token
            },
            contentType: 'application/json',
            success: function(devices) {
                cachedDevices = devices;

                // Update Overview Grid
                displayDevices(devices);

                // Update Sensors Table if it is visible
                if ($('#sensorsContent').is(':visible')) {
                    displaySensorsTable(devices);
                }
            },
            error: function(xhr) {
                $deviceListContainer.html(`<p class="error-text">Failed to load devices. Status: ${xhr.status}</p>`);
            }
        });
    }

    function updateMetrics(devices) {
        const totalActive = devices.length;
        let criticalCount = 0;

        let tempSum = 0, tempCount = 0;
        let humSum = 0, humCount = 0;

        devices.forEach(device => {
            const latestReading = device.readings && device.readings.length > 0
                ? device.readings[device.readings.length - 1].value
                : null;

            if (latestReading !== null) {
                let threshold = device.maxThreshold;
                if (threshold === null || threshold === undefined) {
                    if (device.type === 'Temperature') threshold = 28;
                    else if (device.type === 'Humidity') threshold = 80;
                }

                if (threshold !== null && threshold !== undefined && latestReading > threshold) {
                    criticalCount++;
                }

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

        $('#totalActive').text(totalActive);
        $('#criticalAlerts').text(criticalCount);
        $('#avgTemp').text(tempCount > 0 ? (tempSum / tempCount).toFixed(1) + ' °C' : '-- °C');
        $('#avgHumidity').text(humCount > 0 ? (humSum / humCount).toFixed(1) + ' %' : '-- %');
    }

    function displayDevices(devices) {
        updateMetrics(devices);
        const $deviceListContainer = $('#deviceList');
        if (!$deviceListContainer.length) return;

        $deviceListContainer.empty();

        if (devices.length === 0) {
            $deviceListContainer.html('<p>No devices found for your account.</p>');
            return;
        }

        const isAdmin = sessionStorage.getItem('userRole') === 'ROLE_ADMIN';

        devices.forEach(device => {
            const latestValue = device.readings && device.readings.length > 0
                ? device.readings[device.readings.length - 1].value
                : '--';

            let icon = 'fa-microchip';
            if (device.type === 'Temperature') icon = 'fa-thermometer-half';
            if (device.type === 'Humidity') icon = 'fa-tint';
            if (device.type === 'Security' || device.type === 'Motion') icon = 'fa-shield-alt';

            const ownerHtml = isAdmin ? `<p class="device-owner"><i class="fas fa-user"></i> ${device.owner}</p>` : '';

            const $card = $('<div>', { class: 'device-card' }).html(`
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
            `);
            $deviceListContainer.append($card);
        });
    }

    function displaySensorsTable(devices) {
        const $tableBody = $('#sensorsTableBody');
        if (!$tableBody.length) return;

        $tableBody.empty();

        if (devices.length === 0) {
            const searchTerm = $('#deviceSearch').val();
            const message = searchTerm ? `No devices matching "${searchTerm}" found.` : 'No sensor data found.';
            $tableBody.html(`<tr><td colspan="7" style="text-align: center;">${message}</td></tr>`);
            return;
        }

        const isAdmin = sessionStorage.getItem('userRole') === 'ROLE_ADMIN';

        // Show/Hide "User" Header in table
        $('.data-table th.admin-only, .data-table td.admin-only').css('display', isAdmin ? 'table-cell' : 'none').attr('style', function(i, s) {
            return (s || '') + ' display: ' + (isAdmin ? 'table-cell' : 'none') + ' !important;';
        });

        devices.forEach(device => {
            const $tr = $('<tr>');
            
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
                $tr.addClass('table-danger');
            }

            const latestReadingHtml = latestReadingValue !== null
                ? `${isCritical ? '<i class="fas fa-exclamation-triangle text-danger" style="margin-right: 8px;"></i>' : ''}${latestReadingValue} ${device.unit}`
                : '--';

            const ownerTd = isAdmin ? `<td><span class="owner-badge">${device.owner}</span></td>` : '';
            
            let actionButtons = `
                <button class="btn-graph-icon" data-id="${device.id}" title="View Graph">
                    <i class="fas fa-chart-line"></i>
                </button>
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

            $tr.html(`
                <td>#${device.id}</td>
                <td><strong>${device.name}</strong></td>
                ${ownerTd}
                <td>${device.type}</td>
                <td>${latestReadingHtml}</td>
                <td><span class="status-badge online">Online</span></td>
                <td>${actionButtons}</td>
            `);
            $tableBody.append($tr);
        });

        // Add event listeners for action buttons
        $tableBody.off('click', '.btn-graph-icon').on('click', '.btn-graph-icon', function(e) {
            e.preventDefault();
            e.stopPropagation();
            deviceToGraphId = $(this).data('id');
            const device = cachedDevices.find(d => d.id == deviceToGraphId);
            
            $('#graphDeviceName').text(`Device: ${device.name} (${device.type})`);
            $('#graphMessage').text('');
            
            const now = new Date();
            const yesterday = new Date(now.getTime() - (24 * 60 * 60 * 1000));
            
            const formatDate = (date) => {
                const offset = date.getTimezoneOffset();
                const adjustedDate = new Date(date.getTime() - (offset * 60 * 1000));
                return adjustedDate.toISOString().slice(0, 16);
            };
            
            $('#startDate').val(formatDate(yesterday));
            $('#endDate').val(formatDate(now));

            if (sensorChart) {
                sensorChart.destroy();
                sensorChart = null;
            }

            bootstrap.Modal.getOrCreateInstance(document.getElementById('graphDeviceModal')).show();
        });

        $tableBody.off('click', '.btn-settings-icon').on('click', '.btn-settings-icon', function(e) {
            e.preventDefault();
            e.stopPropagation();
            deviceToEditSettingsId = $(this).data('id');
            const device = cachedDevices.find(d => d.id == deviceToEditSettingsId);
            
            $('#settingsDeviceName').text(`Device: ${device.name}`);
            $('#maxThreshold').val(device.maxThreshold || '');
            $('label[for="maxThreshold"]').text(`Max Threshold (${device.unit || ''})`);
            $('#settingsMessage').text('');

            bootstrap.Modal.getOrCreateInstance(document.getElementById('settingsDeviceModal')).show();
        });

        if (isAdmin) {
            $tableBody.off('click', '.btn-delete-icon').on('click', '.btn-delete-icon', function(e) {
                e.preventDefault();
                e.stopPropagation();
                deviceToDeleteId = $(this).data('id');
                bootstrap.Modal.getOrCreateInstance(document.getElementById('deleteDeviceModal')).show();
            });
        }
    }
});