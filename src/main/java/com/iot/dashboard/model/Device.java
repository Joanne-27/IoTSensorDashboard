package com.iot.dashboard.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;

@Entity
@Table(name = "devices")
public class Device {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false)
    private String type;

    @Column(nullable = false)
    private String unit;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    @JsonIgnore // Prevents the infinite JSON recursion loop
    private User user;

    @com.fasterxml.jackson.annotation.JsonProperty("owner")
    public String getOwner() {
        return user != null ? user.getUsername() : null;
    }

    public Device() {
        // Required by for entity instantiation
    }

    // Getters and Setters
    public Integer getId() { return id; }
    public void setId(Integer id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getType() { return type; }
    public void setType(String type) { this.type = type; }

    public String getUnit() { return unit; }
    public void setUnit(String unit) { this.unit = unit; }

    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }

    @OneToMany(mappedBy = "device", cascade = CascadeType.ALL, fetch = FetchType.EAGER)
    private java.util.List<Reading> readings;

    public java.util.List<Reading> getReadings() { return readings; }
    public void setReadings(java.util.List<Reading> readings) { this.readings = readings; }
}