package com.iot.dashboard.repository;

import com.iot.dashboard.model.Reading;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface ReadingRepository extends JpaRepository<Reading, Integer> {
    List<Reading> findByDeviceIdAndTimestampBetween(Integer deviceId, LocalDateTime start, LocalDateTime end);
}
