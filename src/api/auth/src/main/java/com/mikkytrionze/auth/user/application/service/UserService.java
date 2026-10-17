package com.mikkytrionze.auth.user.application.service;

import com.mikkytrionze.auth.user.domain.model.User;
import com.mikkytrionze.auth.user.domain.repository.UserRepository;
import com.mikkytrionze.auth.user.domain.service.UserLookupService;
import com.mikkytrionze.auth.common.domain.service.SaveAble;
import com.mikkytrionze.auth.common.domain.service.UpdateAble;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.*;

@Service
@RequiredArgsConstructor
public class UserService implements SaveAble<User>, UpdateAble<User> {

    private final UserRepository userRepository;
    private final UserLookupService userLookupService;

    @Override
    public User saveObject(User user) throws IllegalArgumentException {
        if (Objects.isNull(user)) {
            throw new IllegalArgumentException("User cannot be null!");
        }

        if (Objects.isNull(this.userLookupService.findByUsername(user.getUsername()))) {
            userRepository.saveAndFlush(user);
        }

        return user;
    }

    @Override
    public User updateObject(User user) {
        if (Objects.isNull(user)) {
            throw new IllegalArgumentException("User cannot be null!");
        }
        return userRepository.save(user);
    }
}
