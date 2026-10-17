package com.mikkytrionze.auth;

import org.junit.jupiter.api.Test;
import org.mockito.MockedStatic;
import org.springframework.boot.SpringApplication;

import static org.mockito.Mockito.mockStatic;
import static org.mockito.Mockito.verify;

class NkstApplicationMainTest {

    @Test
    void main_invokesSpringApplicationRun() {
        String[] args = {"--test-arg"};
        try (MockedStatic<SpringApplication> mocked = mockStatic(SpringApplication.class)) {
            NkstApplication.main(args);
            mocked.verify(() -> SpringApplication.run(NkstApplication.class, args));
        }
    }
}
