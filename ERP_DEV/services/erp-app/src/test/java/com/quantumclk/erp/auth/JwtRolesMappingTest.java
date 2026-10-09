package com.quantumclk.erp.auth;

import static org.junit.jupiter.api.Assertions.assertTrue;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.Test;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationConverter;

/**
 * Unit test for OUR glue: JWT claims → authorities (security.md role model).
 * Real token signatures are verified by Keycloak at runtime, not here.
 */
class JwtRolesMappingTest {

  @Test
  void flatRolesClaimBecomesAuthorities() {
    Jwt jwt =
        Jwt.withTokenValue("test-token")
            .header("alg", "none")
            .claim("roles", List.of("RECEPTION", "ACCOUNTS"))
            .subject("reception-user")
            .issuedAt(Instant.now())
            .expiresAt(Instant.now().plusSeconds(60))
            .build();
    var authorities =
        SecurityConfig.jwtAuthenticationConverter().convert(jwt).getAuthorities().stream()
            .map(GrantedAuthority::getAuthority)
            .toList();
    assertTrue(authorities.containsAll(List.of("RECEPTION", "ACCOUNTS")));
  }

  @Test
  void keycloakRealmAccessClaimBecomesAuthorities() {
    Jwt jwt =
        Jwt.withTokenValue("test-token")
            .header("alg", "none")
            .claim("realm_access", Map.of("roles", List.of("SUPERADMIN")))
            .subject("admin-user")
            .issuedAt(Instant.now())
            .expiresAt(Instant.now().plusSeconds(60))
            .build();
    JwtAuthenticationConverter converter = SecurityConfig.jwtAuthenticationConverter();
    var authorities =
        converter.convert(jwt).getAuthorities().stream()
            .map(GrantedAuthority::getAuthority)
            .toList();
    assertTrue(authorities.contains("SUPERADMIN"));
  }
}
