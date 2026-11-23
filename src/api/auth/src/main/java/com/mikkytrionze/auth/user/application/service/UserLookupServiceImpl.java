package com.mikkytrionze.auth.user.application.service;

import com.mikkytrionze.auth.user.domain.model.User;
import com.mikkytrionze.auth.user.domain.repository.UserRepository;
import com.mikkytrionze.auth.user.domain.service.UserLookupService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Set;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class UserLookupServiceImpl implements UserLookupService {

    private final UserRepository userRepository;

    @Override
    public User findByUsername(String username) {
        log.info("Finding user with username: {}", username);
        return userRepository.findByUsername(username).orElse(null);
    }

    @Override
    @Transactional(readOnly = true)
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        log.info("Loading user with username: {}", username);
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new UsernameNotFoundException(String.format("User with username: %s not found!", username)));

        Set<GrantedAuthority> authorities = new java.util.HashSet<>();
        if (user.getRoles() != null) {
            user.getRoles().forEach(role -> {
                authorities.add(new SimpleGrantedAuthority("ROLE_" + role.getName().name()));
                if (role.getPermissions() != null) {
                    role.getPermissions().forEach(p -> {
                        if (p.getName() != null) authorities.add(new SimpleGrantedAuthority(p.getName().trim().toLowerCase()));
                        if (p.getKey() != null) { authorities.add(new SimpleGrantedAuthority(p.getKey())); authorities.add(new SimpleGrantedAuthority(p.getKey().trim().toLowerCase())); }
                    });
                }
            });
        }
        if (user.getPermissions() != null) {
            user.getPermissions().forEach(p -> {
                if (p.getName() != null) authorities.add(new SimpleGrantedAuthority(p.getName().trim().toLowerCase()));
                if (p.getKey() != null) { authorities.add(new SimpleGrantedAuthority(p.getKey())); authorities.add(new SimpleGrantedAuthority(p.getKey().trim().toLowerCase())); }
            });
        }
        return new org.springframework.security.core.userdetails.User(
                user.getUsername(),
                user.getPassword(),
                authorities);
    }

    @Override
    public User findByUserId(Long userId) {
        log.info("Finding user with userId: {}", userId);
        return userRepository.findById(userId).orElse(null);    
    }
}
