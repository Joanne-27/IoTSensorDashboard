package com.iot.dashboard.controller;

import com.iot.dashboard.dto.JwtRequest;
import com.iot.dashboard.dto.JwtResponse;
import com.iot.dashboard.service.JwtService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.*;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/auth")
@CrossOrigin
public class JwtAuthenticationController {
    @Autowired private AuthenticationManager authenticationManager;
    @Autowired private JwtService jwtService;

    @PostMapping("/login")
    public ResponseEntity<?> createAuthenticationToken(@RequestBody JwtRequest request) {
        try {
            Authentication auth = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(request.getUsername(), request.getPassword()));

            String token = jwtService.generateToken((UserDetails) auth.getPrincipal());
            String role = auth.getAuthorities().stream()
                    .map(a -> a.getAuthority())
                    .findFirst()
                    .orElse("ROLE_USER");

            return ResponseEntity.ok(new JwtResponse(token, role));
        } catch (BadCredentialsException e) {
            return ResponseEntity.status(401).body("Incorrect credentials.");
        } catch (DisabledException e) {
            return ResponseEntity.status(401).body("User account is disabled.");
        }
    }
}