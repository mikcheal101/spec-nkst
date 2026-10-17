package com.mikkytrionze.auth.service;

import com.mikkytrionze.auth.user.domain.model.User;
import com.mikkytrionze.auth.user.domain.repository.UserRepository;
import com.mikkytrionze.auth.user.domain.service.UserLookupService;
import com.mikkytrionze.auth.user.application.service.UserService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class UserServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private UserLookupService userLookupService;

    @InjectMocks
    private UserService userService;

    @Test
    void saveObject_withValidUser_savesAndFlushes() {
        User user = User.builder().username("test-user").password("encoded").build();
        when(userLookupService.findByUsername("test-user")).thenReturn(null);
        when(userRepository.saveAndFlush(user)).thenReturn(user);

        User result = userService.saveObject(user);

        assertNotNull(result);
        verify(userRepository).saveAndFlush(user);
    }

    @Test
    void saveObject_withExistingUsername_doesNotSave() {
        User existingUser = User.builder().id(1L).username("existing").password("pw").build();
        User newUser = User.builder().username("existing").password("new-pw").build();
        when(userLookupService.findByUsername("existing")).thenReturn(existingUser);

        User result = userService.saveObject(newUser);

        assertNotNull(result);
        verify(userRepository, never()).saveAndFlush(any());
    }

    @Test
    void saveObject_withNullUser_throwsException() {
        assertThrows(IllegalArgumentException.class, () -> userService.saveObject(null));
    }

    @Test
    void updateObject_withValidUser_saves() {
        User user = User.builder().id(1L).username("test-user").password("pw").build();
        when(userRepository.save(user)).thenReturn(user);

        User result = userService.updateObject(user);

        assertNotNull(result);
        verify(userRepository).save(user);
    }

    @Test
    void updateObject_withNullUser_throwsException() {
        assertThrows(IllegalArgumentException.class, () -> userService.updateObject(null));
    }
}
