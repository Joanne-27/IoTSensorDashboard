package com.iot.dashboard.dto;

import java.io.Serial;
import java.io.Serializable;

public class JwtResponse implements Serializable {
    @Serial
    private static final long serialVersionUID = -8091879091924046844L;
    private String jwttoken;
    private String role;

    public JwtResponse() {
    }

    public JwtResponse(String jwttoken, String role) {
        this.jwttoken = jwttoken;
        this.role = role;
    }

    public String getToken() { return this.jwttoken; }
    public void setToken(String token) { this.jwttoken = token; }

    public String getRole() { return role; }
    public void setRole(String role) { this.role = role; }
}
