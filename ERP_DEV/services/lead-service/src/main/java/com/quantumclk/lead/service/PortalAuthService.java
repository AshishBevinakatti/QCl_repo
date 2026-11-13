package com.quantumclk.lead.service;

import com.quantumclk.lead.domain.PortalGuest;
import com.quantumclk.lead.dto.AuthDtos.*;
import com.quantumclk.lead.repository.PortalGuestRepository;
import com.quantumclk.lead.security.JwtTokenService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.UUID;

@Service
public class PortalAuthService {

    private final PortalGuestRepository guestRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenService jwtTokenService;

    public PortalAuthService(PortalGuestRepository guestRepository, PasswordEncoder passwordEncoder, JwtTokenService jwtTokenService) {
        this.guestRepository = guestRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtTokenService = jwtTokenService;
    }

    @Transactional
    public AuthResponse register(RegisterRequest req) {
        String normalizedEmail = req.email().trim().toLowerCase();
        if (guestRepository.existsByEmail(normalizedEmail)) {
            throw new IllegalArgumentException("An account with this email already exists");
        }

        UUID id = UUID.randomUUID();
        OffsetDateTime now = OffsetDateTime.now();
        String hash = passwordEncoder.encode(req.password());

        PortalGuest guest = new PortalGuest(
            id,
            req.name().trim(),
            normalizedEmail,
            req.phone().trim(),
            hash,
            now,
            now
        );

        guestRepository.save(guest);
        String token = jwtTokenService.generateToken(id, guest.getEmail(), guest.getName());
        return new AuthResponse(id, guest.getName(), guest.getEmail(), guest.getPhone(), token);
    }

    @Transactional(readOnly = true)
    public AuthResponse login(LoginRequest req) {
        String normalizedEmail = req.email().trim().toLowerCase();
        PortalGuest guest = guestRepository.findByEmail(normalizedEmail)
            .orElseThrow(() -> new IllegalArgumentException("Invalid email or password"));

        if (!passwordEncoder.matches(req.password(), guest.getPasswordHash())) {
            throw new IllegalArgumentException("Invalid email or password");
        }

        String token = jwtTokenService.generateToken(guest.getId(), guest.getEmail(), guest.getName());
        return new AuthResponse(guest.getId(), guest.getName(), guest.getEmail(), guest.getPhone(), token);
    }

    @Transactional(readOnly = true)
    public PortalGuest getGuest(UUID guestId) {
        return guestRepository.findById(guestId)
            .orElseThrow(() -> new IllegalArgumentException("Guest not found: " + guestId));
    }
}
