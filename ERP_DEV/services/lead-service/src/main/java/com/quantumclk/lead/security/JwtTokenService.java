package com.quantumclk.lead.security;

import com.nimbusds.jose.*;
import com.nimbusds.jose.crypto.MACSigner;
import com.nimbusds.jose.crypto.MACVerifier;
import com.nimbusds.jwt.JWTClaimsSet;
import com.nimbusds.jwt.SignedJWT;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.Date;
import java.util.UUID;

@Service
public class JwtTokenService {

    private final byte[] secretKeyBytes;
    private final long expirationMs;

    public JwtTokenService(
        @Value("${app.jwt.secret:golden-hills-resort-lead-service-super-secret-jwt-key-2026}") String secret,
        @Value("${app.jwt.expiration-ms:86400000}") long expirationMs
    ) throws Exception {
        // Ensure key is at least 256 bits (32 bytes) by hashing if necessary
        MessageDigest sha256 = MessageDigest.getInstance("SHA-256");
        this.secretKeyBytes = sha256.digest(secret.getBytes(StandardCharsets.UTF_8));
        this.expirationMs = expirationMs;
    }

    public String generateToken(UUID guestId, String email, String name) {
        try {
            JWSSigner signer = new MACSigner(secretKeyBytes);
            Date now = new Date();
            Date expiry = new Date(now.getTime() + expirationMs);

            JWTClaimsSet claimsSet = new JWTClaimsSet.Builder()
                .subject(guestId.toString())
                .claim("email", email)
                .claim("name", name)
                .claim("role", "ROLE_GUEST")
                .issuer("golden-hills-portal")
                .issueTime(now)
                .expirationTime(expiry)
                .build();

            SignedJWT signedJWT = new SignedJWT(new JWSHeader(JWSAlgorithm.HS256), claimsSet);
            signedJWT.sign(signer);

            return signedJWT.serialize();
        } catch (Exception e) {
            throw new RuntimeException("Failed to generate JWT token", e);
        }
    }

    public boolean validateToken(String token) {
        try {
            SignedJWT signedJWT = SignedJWT.parse(token);
            JWSVerifier verifier = new MACVerifier(secretKeyBytes);
            if (!signedJWT.verify(verifier)) {
                return false;
            }
            Date expirationTime = signedJWT.getJWTClaimsSet().getExpirationTime();
            return expirationTime != null && expirationTime.after(new Date());
        } catch (Exception e) {
            return false;
        }
    }

    public UUID getGuestIdFromToken(String token) {
        try {
            SignedJWT signedJWT = SignedJWT.parse(token);
            return UUID.fromString(signedJWT.getJWTClaimsSet().getSubject());
        } catch (Exception e) {
            throw new IllegalArgumentException("Invalid token subject", e);
        }
    }
}
