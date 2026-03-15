package com.iot.dashboard.controller;

import com.iot.dashboard.model.JwtRequest;
import com.iot.dashboard.model.JwtResponse;
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
    public ResponseEntity<JwtResponse> createAuthenticationToken(@RequestBody JwtRequest request) {
            // This is where the comparison happens
            Authentication auth = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(request.getUsername(), request.getPassword()));

            String token = jwtService.generateToken((UserDetails) auth.getPrincipal());
            return ResponseEntity.ok(new JwtResponse(token));


    }
}