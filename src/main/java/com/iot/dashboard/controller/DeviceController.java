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
        // Get authentication details from the security context
        var auth = SecurityContextHolder.getContext().getAuthentication();
        String email = auth.getName();
        
        // Check if user is an Admin
        boolean isAdmin = auth.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));

        if (isAdmin) {
            // Admin sees everything
            return ResponseEntity.ok(deviceRepository.findAll());
        }

        // Regular user finds themselves by email, then get their devices
        return userRepository.findByUsername(email)
                .map(user -> ResponseEntity.ok(deviceRepository.findByUserId(user.getId())))
                .orElse(ResponseEntity.status(404).build());
    }

    @PostMapping
    public ResponseEntity<?> addDevice(@RequestBody DeviceDTO deviceDto) {
        var auth = SecurityContextHolder.getContext().getAuthentication();

        // Check if user is an Admin
        boolean isAdmin = auth.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));

        if (!isAdmin) {
            return ResponseEntity.status(403).body("Only admins can add devices.");
        }

        // Basic validation
        if (deviceDto.getName() == null || deviceDto.getName().trim().isEmpty() ||
            deviceDto.getType() == null || deviceDto.getType().trim().isEmpty() ||
            deviceDto.getUnit() == null || deviceDto.getUnit().trim().isEmpty()) {
            return ResponseEntity.badRequest().body("Device Name, Type, and Unit are required.");
        }

        Integer targetUserId = deviceDto.getUserId();
        if (targetUserId == null) {
            // Default to current admin if no user ID provided
            String email = auth.getName();
            return userRepository.findByUsername(email)
                    .map(user -> {
                        Device device = new Device();
                        device.setName(deviceDto.getName());
                        device.setType(deviceDto.getType());
                        device.setUnit(deviceDto.getUnit());
                        device.setUser(user);
                        Device savedDevice = deviceRepository.save(device);
                        return ResponseEntity.status(201).body((Object) savedDevice);
                    })
                    .orElse(ResponseEntity.status(404).body((Object) "Admin user not found."));
        } else {
            return userRepository.findById(targetUserId)
                    .map(user -> {
                        Device device = new Device();
                        device.setName(deviceDto.getName());
                        device.setType(deviceDto.getType());
                        device.setUnit(deviceDto.getUnit());
                        device.setUser(user);
                        Device savedDevice = deviceRepository.save(device);
                        return ResponseEntity.status(201).body((Object) savedDevice);
                    })
                    .orElse(ResponseEntity.status(404).body((Object) "Target user not found."));
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteDevice(@PathVariable Long id) {
        var auth = SecurityContextHolder.getContext().getAuthentication();

        // Check if user is an Admin
        boolean isAdmin = auth.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));

        if (!isAdmin) {
            return ResponseEntity.status(403).body("Only admins can delete devices.");
        }

        return deviceRepository.findById(id)
                .map(device -> {
                    deviceRepository.delete(device);
                    return ResponseEntity.ok().body("Device deleted successfully.");
                })
                .orElse(ResponseEntity.status(404).body("Device not found."));
    }

    public static class DeviceDTO {
        private String name;
        private String type;
        private String unit;
        private Integer userId;

        public String getName() { return name; }
        public void setName(String name) { this.name = name; }
        public String getType() { return type; }
        public void setType(String type) { this.type = type; }
        public String getUnit() { return unit; }
        public void setUnit(String unit) { this.unit = unit; }
        public Integer getUserId() { return userId; }
        public void setUserId(Integer userId) { this.userId = userId; }
    }
}