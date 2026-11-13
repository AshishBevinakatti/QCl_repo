package com.quantumclk.lead;

import com.quantumclk.lead.dto.AuthDtos.*;
import com.quantumclk.lead.service.PortalAuthService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
public class PortalAuthTest {

    @Autowired
    private PortalAuthService authService;

    @Test
    void registerAndLoginSuccess() {
        RegisterRequest regReq = new RegisterRequest(
            "Ananya Sharma",
            "ananya.sharma@example.com",
            "+91-9876500001",
            "securePass123"
        );

        AuthResponse regRes = authService.register(regReq);
        assertNotNull(regRes.guestId());
        assertEquals("Ananya Sharma", regRes.name());
        assertEquals("ananya.sharma@example.com", regRes.email());
        assertNotNull(regRes.token());

        // Login with correct credentials
        LoginRequest loginReq = new LoginRequest("ananya.sharma@example.com", "securePass123");
        AuthResponse loginRes = authService.login(loginReq);
        assertEquals(regRes.guestId(), loginRes.guestId());
        assertNotNull(loginRes.token());
    }

    @Test
    void duplicateRegistrationRejected() {
        RegisterRequest regReq = new RegisterRequest(
            "Rohan Verma",
            "rohan.verma@example.com",
            "+91-9876500002",
            "pass1234"
        );
        authService.register(regReq);

        // Try registering again with same email
        assertThrows(IllegalArgumentException.class, () -> authService.register(regReq));
    }

    @Test
    void badPasswordRejected() {
        RegisterRequest regReq = new RegisterRequest(
            "Meera Nair",
            "meera.nair@example.com",
            "+91-9876500003",
            "correctPassword"
        );
        authService.register(regReq);

        LoginRequest badLogin = new LoginRequest("meera.nair@example.com", "wrongPassword");
        assertThrows(IllegalArgumentException.class, () -> authService.login(badLogin));
    }
}
