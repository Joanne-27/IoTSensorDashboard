package com.iot.dashboard;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.iot.dashboard.model.JwtRequest;
import com.iot.dashboard.model.JwtResponse;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class JwtAuthenticationIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    void testAdminAccess() throws Exception {
        // 1. Login as Admin
        JwtRequest adminLogin = new JwtRequest("test-admin@example.com", "password123");
        MvcResult result = mockMvc.perform(post("/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(adminLogin)))
                .andExpect(status().isOk())
                .andReturn();

        JwtResponse response = objectMapper.readValue(result.getResponse().getContentAsString(), JwtResponse.class);
        String token = response.getToken();
        
        // Assert role is present
        org.junit.jupiter.api.Assertions.assertEquals("ROLE_ADMIN", response.getRole());

        // 2. Access /api/devices - should work
        MvcResult devicesResult = mockMvc.perform(get("/api/devices")
                .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andReturn();
        
        String content = devicesResult.getResponse().getContentAsString();
        // Assert owner is present in JSON
        org.junit.jupiter.api.Assertions.assertTrue(content.contains("\"owner\":\""));
    }

    @Test
    void testUserAccess() throws Exception {
        // 1. Login as User
        JwtRequest userLogin = new JwtRequest("test@example.com", "password123");
        MvcResult result = mockMvc.perform(post("/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(userLogin)))
                .andExpect(status().isOk())
                .andReturn();

        String token = objectMapper.readValue(result.getResponse().getContentAsString(), JwtResponse.class).getToken();

        // 2. Access /api/devices - should work
        mockMvc.perform(get("/api/devices")
                .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk());
    }

    @Test
    void testUnauthorizedAccess() throws Exception {
        mockMvc.perform(get("/api/devices"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void testAdminAddDevice() throws Exception {
        // 1. Login as Admin
        JwtRequest adminLogin = new JwtRequest("test-admin@example.com", "password123");
        MvcResult result = mockMvc.perform(post("/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(adminLogin)))
                .andExpect(status().isOk())
                .andReturn();

        String token = objectMapper.readValue(result.getResponse().getContentAsString(), JwtResponse.class).getToken();

        // 2. Add valid device with userId
        java.util.Map<String, Object> newDevice = new java.util.HashMap<>();
        newDevice.put("name", "New Admin Sensor");
        newDevice.put("type", "Temperature");
        newDevice.put("unit", "°C");
        newDevice.put("userId", 1); // User ID from DataInitializer (test@example.com)

        mockMvc.perform(post("/api/devices")
                .header("Authorization", "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(newDevice)))
                .andExpect(status().isCreated());

        // 3. Add invalid device (missing name)
        java.util.Map<String, Object> invalidDevice = new java.util.HashMap<>();
        invalidDevice.put("type", "Humidity");
        invalidDevice.put("unit", "%");

        mockMvc.perform(post("/api/devices")
                .header("Authorization", "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(invalidDevice)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void testAdminGetUsers() throws Exception {
        // 1. Login as Admin
        JwtRequest adminLogin = new JwtRequest("test-admin@example.com", "password123");
        MvcResult result = mockMvc.perform(post("/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(adminLogin)))
                .andExpect(status().isOk())
                .andReturn();

        String token = objectMapper.readValue(result.getResponse().getContentAsString(), JwtResponse.class).getToken();

        // 2. Access /api/users
        mockMvc.perform(get("/api/users")
                .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath("$[0].username").exists());
    }

    @Test
    void testUserCannotAddDevice() throws Exception {
        // 1. Login as User
        JwtRequest userLogin = new JwtRequest("test@example.com", "password123");
        MvcResult result = mockMvc.perform(post("/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(userLogin)))
                .andExpect(status().isOk())
                .andReturn();

        String token = objectMapper.readValue(result.getResponse().getContentAsString(), JwtResponse.class).getToken();

        // 2. Try to add device - should fail with 403
        com.iot.dashboard.model.Device newDevice = new com.iot.dashboard.model.Device();
        newDevice.setName("User Sensor Attempt");
        newDevice.setType("Temperature");
        newDevice.setUnit("°C");

        mockMvc.perform(post("/api/devices")
                .header("Authorization", "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(newDevice)))
                .andExpect(status().isForbidden());
    }

    @Test
    void testAdminDeleteDevice() throws Exception {
        // 1. Login as Admin
        JwtRequest adminLogin = new JwtRequest("test-admin@example.com", "password123");
        MvcResult loginResult = mockMvc.perform(post("/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(adminLogin)))
                .andExpect(status().isOk())
                .andReturn();

        String token = objectMapper.readValue(loginResult.getResponse().getContentAsString(), JwtResponse.class).getToken();

        // 2. Create a device to delete
        java.util.Map<String, Object> newDevice = new java.util.HashMap<>();
        newDevice.put("name", "Delete Me Sensor");
        newDevice.put("type", "Humidity");
        newDevice.put("unit", "%");
        newDevice.put("userId", 1);

        MvcResult createResult = mockMvc.perform(post("/api/devices")
                .header("Authorization", "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(newDevice)))
                .andExpect(status().isCreated())
                .andReturn();

        // Extract ID from created device (it's a Device object in the response)
        com.iot.dashboard.model.Device createdDevice = objectMapper.readValue(createResult.getResponse().getContentAsString(), com.iot.dashboard.model.Device.class);
        Integer deviceId = createdDevice.getId();

        // 3. Delete the device
        mockMvc.perform(delete("/api/devices/" + deviceId)
                .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk());

        // 4. Verify it's gone (should return 404 or at least not be in list if we fetch all)
        mockMvc.perform(delete("/api/devices/" + deviceId)
                .header("Authorization", "Bearer " + token))
                .andExpect(status().isNotFound());
    }

    @Test
    void testUpdateDeviceSettings() throws Exception {
        // 1. Login as Admin
        JwtRequest adminLogin = new JwtRequest("test-admin@example.com", "password123");
        MvcResult loginResult = mockMvc.perform(post("/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(adminLogin)))
                .andExpect(status().isOk())
                .andReturn();

        String token = objectMapper.readValue(loginResult.getResponse().getContentAsString(), JwtResponse.class).getToken();

        // 2. Fetch all devices to find a Temperature one
        MvcResult devicesResult = mockMvc.perform(get("/api/devices")
                .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andReturn();
        
        String devicesJson = devicesResult.getResponse().getContentAsString();
        com.iot.dashboard.model.Device[] devices = objectMapper.readValue(devicesJson, com.iot.dashboard.model.Device[].class);
        
        Integer tempDeviceId = null;
        for (com.iot.dashboard.model.Device d : devices) {
            if ("Temperature".equalsIgnoreCase(d.getType())) {
                tempDeviceId = d.getId();
                break;
            }
        }

        if (tempDeviceId == null) {
            org.junit.jupiter.api.Assertions.fail("No Temperature device found in initialized data");
        }

        // 3. Update settings for the found Temperature device
        java.util.Map<String, Object> settings = new java.util.HashMap<>();
        settings.put("maxThreshold", 35.5);

        mockMvc.perform(put("/api/devices/" + tempDeviceId + "/settings")
                .header("Authorization", "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(settings)))
                .andExpect(status().isOk());

        // 5. Test settings for a non-Temperature device (should work now)
        Integer humidityDeviceId = null;
        for (com.iot.dashboard.model.Device d : devices) {
            if ("Humidity".equalsIgnoreCase(d.getType())) {
                humidityDeviceId = d.getId();
                break;
            }
        }
        if (humidityDeviceId != null) {
            settings.put("maxThreshold", 80.0);
            mockMvc.perform(put("/api/devices/" + humidityDeviceId + "/settings")
                    .header("Authorization", "Bearer " + token)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(settings)))
                    .andExpect(status().isOk());
        }
    }
}
