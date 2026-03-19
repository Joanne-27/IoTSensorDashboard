Feature: Device API tests

  Background:
    * url baseUrl
    * def login =
      """
      {
        "username": "admin@mail.com",
         "password": "password123"
      }
      """
    * path '/auth/login'
    * request login
    * method post
    * status 200
    * def token = response.token

  Scenario: Get user devices
    * path '/api/devices'
    * header Authorization = 'Bearer ' + token
    * method get
    * status 200
    * match each response ==
      """
      {
        "id": "#number",
        "name": "#string",
        "type": "#string",
        "unit": "#string",
        "readings": "#[]"
      }
      """

  Scenario: Get devices without token should fail
    * path '/api/devices'
    * method get
    * status 401
