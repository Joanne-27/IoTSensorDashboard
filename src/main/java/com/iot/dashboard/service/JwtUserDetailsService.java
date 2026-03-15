package com.iot.dashboard.service;

import com.iot.dashboard.model.User;
import com.iot.dashboard.repository.UserRepository; // <--- 1. MUST HAVE THIS IMPORT
import org.springframework.beans.factory.annotation.Autowired; // <--- 2. MUST HAVE THIS IMPORT
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import java.util.ArrayList;

@Service
public class JwtUserDetailsService implements UserDetailsService {

    @Autowired // <--- 3. THIS TELLS SPRING TO "PLUG IN" THE REPOSITORY
    private UserRepository userRepository;

    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {

        // Now that 'userRepository' is declared above, this line will work
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new UsernameNotFoundException("User not found with username: " + username));

        return new org.springframework.security.core.userdetails.User(
                user.getUsername(),
                user.getPassword(),
                new ArrayList<>()
        );
    }
}