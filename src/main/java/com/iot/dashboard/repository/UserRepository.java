package com.iot.dashboard.repository;

import com.iot.dashboard.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Integer> {

    // This is the specific method JwtUserDetailsService needs
    // Spring will automatically turn this into "SELECT * FROM users WHERE username = ?"
    Optional<User> findByUsername(String username);
}