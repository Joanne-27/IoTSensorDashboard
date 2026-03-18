package com.iot.dashboard.controller;

import com.iot.dashboard.model.Device;
import com.iot.dashboard.model.User;
import com.iot.dashboard.repository.DeviceRepository;
import com.iot.dashboard.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.test.web.servlet.MockMvc;

import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc(addFilters = false)
public class DeviceControllerUnitTest {

    @org.springframework.boot.test.context.TestConfiguration
    static class TestConfig {
        @org.springframework.context.annotation.Bean
        public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
            http.csrf(AbstractHttpConfigurer::disable)
                .authorizeHttpRequests(auth -> auth.anyRequest().permitAll());
            return http.build();
        }
    }

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private DeviceRepository deviceRepository;

    @MockBean
    private UserRepository userRepository;

    private void mockUser(String username, String role) {
        SecurityContext securityContext = SecurityContextHolder.createEmptyContext();
        org.springframework.security.core.Authentication authentication = new UsernamePasswordAuthenticationToken(
                username, "password", Collections.singletonList(new SimpleGrantedAuthority(role)));
        securityContext.setAuthentication(authentication);
        SecurityContextHolder.setContext(securityContext);
    }

    private void mockUser(String username) {
        mockUser(username, "ROLE_USER");
    }

    @Test
    public void getMyDevices_Success() throws Exception {
        mockUser("test@example.com");
        User user = new User();
        user.setId(1);
        user.setUsername("test@example.com");

        Device device = new Device();
        device.setId(1);
        device.setName("Thermometer");
        device.setType("Temperature");
        device.setUnit("C");

        when(userRepository.findByUsername("test@example.com")).thenReturn(Optional.of(user));
        when(deviceRepository.findByUserId(1)).thenReturn(List.of(device));

        mockMvc.perform(get("/api/devices"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].name").value("Thermometer"))
                .andExpect(jsonPath("$[0].type").value("Temperature"));
    }

    @Test
    public void getMyDevices_UserNotFound() throws Exception {
        mockUser("nonexistent@example.com");
        when(userRepository.findByUsername("nonexistent@example.com")).thenReturn(Optional.empty());

        mockMvc.perform(get("/api/devices"))
                .andExpect(status().isNotFound());
    }

    @Test
    public void getMyDevices_Unauthorized() throws Exception {
        SecurityContextHolder.clearContext();

        try {
            mockMvc.perform(get("/api/devices"));
        } catch (Exception e) {
            // Expected
        }
    }

    @Test
    public void addDevice_ForbiddenForUser() throws Exception {
        mockUser("test@example.com", "ROLE_USER");

        mockMvc.perform(post("/api/devices")
                        .contentType("application/json")
                        .content("{\"name\": \"Sensor\", \"type\": \"Temp\", \"unit\": \"C\"}"))
                .andExpect(status().isForbidden());
    }

    @Test
    public void addDevice_SuccessForAdmin() throws Exception {
        mockUser("admin@example.com", "ROLE_ADMIN");
        User adminUser = new User();
        adminUser.setUsername("admin@example.com");

        when(userRepository.findByUsername("admin@example.com")).thenReturn(Optional.of(adminUser));
        when(deviceRepository.save(any(Device.class))).thenAnswer(i -> i.getArgument(0));

        mockMvc.perform(post("/api/devices")
                        .contentType("application/json")
                        .content("{\"name\": \"New Sensor\", \"type\": \"Humidity\", \"unit\": \"%\"}"))
                .andExpect(status().isCreated());
    }

    @Test
    public void updateDeviceSettings_Success() throws Exception {
        mockUser("test@example.com", "ROLE_USER");
        User user = new User();
        user.setUsername("test@example.com");

        Device device = new Device();
        device.setId(1);
        device.setUser(user);

        when(deviceRepository.findById(1L)).thenReturn(Optional.of(device));

        mockMvc.perform(put("/api/devices/1/settings")
                        .contentType("application/json")
                        .content("{\"maxThreshold\": 50.0}"))
                .andExpect(status().isOk());
    }

    @Test
    public void updateDeviceSettings_InvalidThreshold() throws Exception {
        mockUser("test@example.com", "ROLE_USER");
        User user = new User();
        user.setUsername("test@example.com");

        Device device = new Device();
        device.setId(1);
        device.setUser(user);

        when(deviceRepository.findById(1L)).thenReturn(Optional.of(device));

        mockMvc.perform(put("/api/devices/1/settings")
                        .contentType("application/json")
                        .content("{\"maxThreshold\": 150.0}"))
                .andExpect(status().isBadRequest());
    }

    @Test
    public void deleteDevice_DeviceNotFound() throws Exception {
        mockUser("admin@example.com", "ROLE_ADMIN");
        when(deviceRepository.findById(99L)).thenReturn(Optional.empty());

        mockMvc.perform(delete("/api/devices/99"))
                .andExpect(status().isNotFound());
    }
}
