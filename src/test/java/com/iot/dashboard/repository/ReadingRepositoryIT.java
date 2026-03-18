package com.iot.dashboard.repository;

import com.iot.dashboard.model.Device;
import com.iot.dashboard.model.Reading;
import com.iot.dashboard.model.User;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
public class ReadingRepositoryIT {

    @Autowired
    private ReadingRepository readingRepository;

    @Autowired
    private DeviceRepository deviceRepository;

    @Autowired
    private UserRepository userRepository;

    @Test
    @Transactional
    public void findByDeviceIdAndTimestampBetween_ReturnsCorrectReadings() {
        User user = new User();
        user.setUsername("reading-test@example.com");
        user.setPassword("password");
        user.setRole("ROLE_USER");
        user = userRepository.save(user);

        Device device = new Device();
        device.setName("Test Device");
        device.setType("Temperature");
        device.setUnit("C");
        device.setUser(user);
        device = deviceRepository.save(device);

        LocalDateTime now = LocalDateTime.now();
        
        Reading r1 = new Reading();
        r1.setDevice(device);
        r1.setValue(20.0);
        r1.setTimestamp(now.minusHours(2));
        readingRepository.save(r1);

        Reading r2 = new Reading();
        r2.setDevice(device);
        r2.setValue(25.0);
        r2.setTimestamp(now.minusHours(1));
        readingRepository.save(r2);

        Reading r3 = new Reading();
        r3.setDevice(device);
        r3.setValue(30.0);
        r3.setTimestamp(now.plusHours(1));
        readingRepository.save(r3);

        List<Reading> found = readingRepository.findByDeviceIdAndTimestampBetween(
                device.getId().intValue(),
                now.minusMinutes(90),
                now.plusMinutes(30)
        );

        assertThat(found).hasSize(1);
        assertThat(found.get(0).getValue()).isEqualTo(25.0);
    }
}
