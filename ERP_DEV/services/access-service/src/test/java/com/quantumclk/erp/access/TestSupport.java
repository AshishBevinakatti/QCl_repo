package com.quantumclk.erp.access;

import com.nimbusds.jose.JWSAlgorithm;
import com.nimbusds.jose.JWSHeader;
import com.nimbusds.jose.crypto.RSASSASigner;
import com.nimbusds.jose.jwk.RSAKey;
import com.nimbusds.jose.jwk.gen.RSAKeyGenerator;
import com.nimbusds.jwt.JWTClaimsSet;
import com.nimbusds.jwt.SignedJWT;
import com.quantumclk.erp.access.security.SecurityConfig;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Primary;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.NimbusJwtDecoder;
import org.testcontainers.postgresql.PostgreSQLContainer;

import java.time.Instant;
import java.util.Date;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/** Real PostgreSQL 18 + a local signing key; the decoder uses the production validator rules. */
@TestConfiguration(proxyBeanMethods = false)
public class TestSupport {

    public static final String ISSUER = "http://test-keycloak/realms/gh-staff";
    static final RSAKey KEY = generate();
    static final RSAKey OTHER_KEY = generate();

    @Bean
    @ServiceConnection
    PostgreSQLContainer postgres() {
        return new PostgreSQLContainer("postgres:18.7");
    }

    @Bean
    @Primary
    JwtDecoder testJwtDecoder() throws Exception {
        NimbusJwtDecoder d = NimbusJwtDecoder.withPublicKey(KEY.toRSAPublicKey()).build();
        d.setJwtValidator(SecurityConfig.validator(ISSUER));
        return d;
    }

    /** A token as Keycloak would issue it; override any claim with the builder. */
    public static JWTClaimsSet.Builder claims(UUID sub, List<String> realmRoles, List<String> permissions) {
        Instant now = Instant.now();
        return new JWTClaimsSet.Builder()
                .issuer(ISSUER).subject(sub.toString()).audience("erp-api")
                .issueTime(Date.from(now)).expirationTime(Date.from(now.plusSeconds(300)))
                .claim("realm_access", Map.of("roles", realmRoles))
                .claim("resource_access", Map.of("erp-api", Map.of("roles", permissions)));
    }

    public static String sign(JWTClaimsSet claims) {
        return sign(claims, KEY);
    }

    public static String sign(JWTClaimsSet claims, RSAKey key) {
        try {
            SignedJWT jwt = new SignedJWT(new JWSHeader.Builder(JWSAlgorithm.RS256).keyID(key.getKeyID()).build(), claims);
            jwt.sign(new RSASSASigner(key));
            return jwt.serialize();
        } catch (Exception e) {
            throw new IllegalStateException(e);
        }
    }

    private static RSAKey generate() {
        try {
            return new RSAKeyGenerator(2048).keyID(UUID.randomUUID().toString()).generate();
        } catch (Exception e) {
            throw new IllegalStateException(e);
        }
    }
}
