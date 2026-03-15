const API_BASE_URL = "http://localhost:8080/api";

$('#loginForm').on('submit', function(e) {
    e.preventDefault();

    const loginData = {
        username: $('#loginUser').val(),
        password: $('#loginPass').val()
    };

    // This is the actual call to your AuthController
    $.ajax({
        url: API_BASE_URL + "/auth/login",
        method: "POST",
        contentType: "application/json",
        data: JSON.stringify(loginData),
        success: function(response) {
            // Save the JWT token for future requests
            localStorage.setItem('jwt_token', response.jwt);
            localStorage.setItem('iot_user', loginData.username);

            showView('dashboardView');
            loadDashboardData();
        },
        error: function(xhr) {
            alert("Login Failed: " + xhr.responseText);
        }
    });
});