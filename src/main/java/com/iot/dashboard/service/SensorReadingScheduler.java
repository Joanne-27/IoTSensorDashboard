package com.iot.dashboard.service;

import com.iot.dashboard.model.Device;
import com.iot.dashboard.model.Reading;
import com.iot.dashboard.repository.DeviceRepository;
import com.iot.dashboard.repository.ReadingRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Random;

@Service
@ConditionalOnProperty(name = "app.scheduler.enabled", havingValue = "true", matchIfMissing = true)
public class SensorReadingScheduler {

    @Autowired
    private DeviceRepository deviceRepository;

    @Autowired
    private ReadingRepository readingRepository;

    private final Random random = new Random();

    /**
     * Every 10 seconds, generate a new reading for each device in the system.
     */
    @Scheduled(fixedRate = 10000)
    @Transactional
    public void generateSensorReadings() {
        List<Device> devices = deviceRepository.findAll();
        for (Device device : devices) {
            Reading reading = new Reading();
            reading.setDevice(device);
            reading.setTimestamp(LocalDateTime.now());
            reading.setValue(generateRandomValueForType(device.getType()));
            readingRepository.save(reading);
        }
    }

    private double generateRandomValueForType(String type) {
        if (type == null) return 0.0;
        
        double val;
        switch (type) {
            case "Temperature":
                // Range 15-35 C
                val = 15 + (random.nextDouble() * 20);
                break;
            case "Humidity":
                // Range 30-90 %
                val = 30 + (random.nextDouble() * 60);
                break;
            case "Pressure":
                // Range 980-1020 hPa
                val = 980 + (random.nextDouble() * 40);
                break;
            case "CO2":
                // Range 400-1200 ppm
                val = 400 + (random.nextDouble() * 800);
                break;
            case "Light":
                // Range 0-1000 lx
                val = random.nextDouble() * 1000;
                break;
            case "Motion":
                // 0 or 1
                val = random.nextBoolean() ? 1.0 : 0.0;
                break;
            default:
                val = random.nextDouble() * 100.0;
        }
        // Round to 1 decimal place
        return Math.round(val * 10.0) / 10.0;
    }
}
