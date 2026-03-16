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

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
public class JwtAuthenticationIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    public void testJwtLifecycle() throws Exception {
        // 1. Login to get a token
        JwtRequest loginRequest = new JwtRequest();
        loginRequest.setUsername("test@example.com");
        loginRequest.setPassword("password123");

        MvcResult loginResult = mockMvc.perform(post("/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(loginRequest)))
                .andExpect(status().isOk())
                .andReturn();

        String responseContent = loginResult.getResponse().getContentAsString();
        JwtResponse jwtResponse = objectMapper.readValue(responseContent, JwtResponse.class);
        String token = jwtResponse.getToken();

        // 2. Make an authorized request to /api/devices
        mockMvc.perform(get("/api/devices")
                .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk());

        // 3. Make an unauthorized request (no token)
        mockMvc.perform(get("/api/devices"))
                .andExpect(status().isUnauthorized());

        // 4. Make a request with an invalid token
        mockMvc.perform(get("/api/devices")
                .header("Authorization", "Bearer invalid_token"))
                .andExpect(status().isUnauthorized());
    }
}
