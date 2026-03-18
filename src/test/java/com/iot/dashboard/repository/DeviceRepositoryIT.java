package com.iot.dashboard.repository;

import com.iot.dashboard.model.Device;
import com.iot.dashboard.model.User;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
public class DeviceRepositoryIT {

    @Autowired
    private DeviceRepository deviceRepository;

    @Autowired
    private UserRepository userRepository;

    @Test
    @org.springframework.transaction.annotation.Transactional
    public void findByUserId_ReturnsDevices() {
        User user = new User();
        user.setUsername("test-repo@example.com");
        user.setPassword("password");
        user.setRole("ROLE_USER");
        user = userRepository.save(user);

        Device device = new Device();
        device.setName("Sensor 1");
        device.setType("Humidity");
        device.setUnit("%");
        device.setUser(user);
        deviceRepository.save(device);

        List<Device> found = deviceRepository.findByUserId(user.getId());

        assertThat(found).hasSize(1);
        assertThat(found.get(0).getName()).isEqualTo("Sensor 1");
    }

    @Test
    @org.springframework.transaction.annotation.Transactional
    public void findByUserId_NoDevices_ReturnsEmptyList() {
        User user = new User();
        user.setUsername("other-repo@example.com");
        user.setPassword("password");
        user.setRole("ROLE_USER");
        user = userRepository.save(user);

        List<Device> found = deviceRepository.findByUserId(user.getId());

        assertThat(found).isEmpty();
    }
}
