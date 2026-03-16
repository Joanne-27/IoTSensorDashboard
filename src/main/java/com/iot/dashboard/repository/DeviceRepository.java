package com.iot.dashboard.repository;

import com.iot.dashboard.model.Device;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface DeviceRepository extends JpaRepository<Device, Long> {
    // This method allows us to find only the devices belonging to a specific user
    List<Device> findByUserId(Integer userId);
}