package com.iot.dashboard.controller;

import com.iot.dashboard.model.Device;
import com.iot.dashboard.repository.DeviceRepository;
import com.iot.dashboard.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/devices")
@CrossOrigin(origins = "*")
public class DeviceController {

    @Autowired
    private DeviceRepository deviceRepository;

    @Autowired
    private UserRepository userRepository;

    @GetMapping
    public ResponseEntity<List<Device>> getMyDevices() {
        // Get email from JWT
        String email = SecurityContextHolder.getContext().getAuthentication().getName();

        // Find user by email, then get their devices
        return userRepository.findByUsername(email)
                .map(user -> ResponseEntity.ok(deviceRepository.findByUserId(user.getId())))
                .orElse(ResponseEntity.status(404).build());
    }
}