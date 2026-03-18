package com.iot.dashboard.service;

import io.jsonwebtoken.Claims;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.ArrayList;
import java.util.Date;

import static org.junit.jupiter.api.Assertions.*;

public class JwtServiceUnitTest {

    private JwtService jwtService;
    private final String secret = "Zm9yZXZlci1zdHJvbmctYmFzZTY0LWtleS1leGFtcGxlLTIwMjY=";

    @BeforeEach
    public void setUp() {
        jwtService = new JwtService();
        ReflectionTestUtils.setField(jwtService, "secret", secret);
    }

    @Test
    public void generateToken_ShouldReturnValidToken() {
        UserDetails userDetails = new User("test@example.com", "password", new ArrayList<>());
        String token = jwtService.generateToken(userDetails);

        assertNotNull(token);
        String username = jwtService.getUsernameFromToken(token);
        assertEquals("test@example.com", username);
    }

    @Test
    public void validateToken_ShouldReturnTrueForValidToken() {
        UserDetails userDetails = new User("test@example.com", "password", new ArrayList<>());
        String token = jwtService.generateToken(userDetails);

        assertTrue(jwtService.validateToken(token, userDetails));
    }

    @Test
    public void validateToken_ShouldReturnFalseForDifferentUser() {
        UserDetails userDetails = new User("test@example.com", "password", new ArrayList<>());
        String token = jwtService.generateToken(userDetails);

        UserDetails otherUser = new User("other@example.com", "password", new ArrayList<>());
        assertFalse(jwtService.validateToken(token, otherUser));
    }

    @Test
    public void getExpirationDateFromToken_ShouldReturnFutureDate() {
        UserDetails userDetails = new User("test@example.com", "password", new ArrayList<>());
        String token = jwtService.generateToken(userDetails);

        Date expiration = jwtService.getClaimFromToken(token, Claims::getExpiration);
        assertTrue(expiration.after(new Date()));
    }
}
