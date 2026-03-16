package com.iot.dashboard.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "readings")
public class Reading {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    private Double value;
    private LocalDateTime timestamp = LocalDateTime.now();

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "device_id")
    @JsonIgnore
    private Device device;

    public Reading() {}

    // Getters and Setters
    public Double getValue() { return value; }
    public void setValue(Double value) { this.value = value; }
    public LocalDateTime getTimestamp() { return timestamp; }
    public Device getDevice() { return device; }
    public void setDevice(Device device) { this.device = device; }
}