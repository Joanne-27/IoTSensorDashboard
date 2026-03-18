package com.iot.dashboard.dto;

public class UserResponse {
    private final Integer id;
    private final String username;

    public UserResponse(Integer id, String username) {
        this.id = id;
        this.username = username;
    }

    public Integer getId() { return id; }
    public String getUsername() { return username; }
}
