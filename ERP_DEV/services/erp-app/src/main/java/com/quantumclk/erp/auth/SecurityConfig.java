package com.quantumclk.erp.auth;

import com.quantumclk.erp.common.ApiError;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.NimbusJwtDecoder;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationConverter;
import org.springframework.security.web.SecurityFilterChain;

/**
 * SOW ERP-08 + security.md: Keycloak JWT resource server, deny-by-default.
 * Roles flow from the JWT (`roles` claim, incl. Keycloak `realm_access.roles`)
 * into authorities; endpoints stay closed unless explicitly permitted below.
 */
@Configuration
@EnableMethodSecurity
public class SecurityConfig {

  @Bean
  SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
    http.csrf(AbstractHttpConfigurer::disable)
        .authorizeHttpRequests(
            auth ->
                auth.requestMatchers(
                        "/",
                        "/index.html",
                        "/api/v1/health",
                        "/api/v1/payments/confirm",
                        "/v3/api-docs/**",
                        "/swagger-ui/**",
                        "/error")
                    .permitAll()
                    .requestMatchers(HttpMethod.OPTIONS, "/**")
                    .permitAll()
                    .anyRequest()
                    .authenticated())
        .oauth2ResourceServer(
            oauth ->
                oauth.jwt(jwt -> jwt.jwtAuthenticationConverter(jwtAuthenticationConverter()))
                    .authenticationEntryPoint(SecurityConfig::unauthorized)
                    .accessDeniedHandler(SecurityConfig::forbidden));
    return http.build();
  }

  /** Real decoder (Keycloak issuer); tests override this bean with a stub. */
  @Bean
  JwtDecoder jwtDecoder(@Value("${spring.security.oauth2.resourceserver.jwt.issuer-uri:}") String issuer) {
    if (issuer == null || issuer.isBlank()) {
      // No realm configured (local slice without Keycloak): reject everything closed.
      // Tests override this bean; production sets KEYCLOAK_ISSUER_URL (see .env.example).
      return token -> {
        throw new org.springframework.security.oauth2.jwt.JwtException("no issuer configured");
      };
    }
    return NimbusJwtDecoder.withIssuerLocation(issuer).build();
  }

  static JwtAuthenticationConverter jwtAuthenticationConverter() {
    JwtAuthenticationConverter converter = new JwtAuthenticationConverter();
    converter.setJwtGrantedAuthoritiesConverter(
        jwt -> {
          Object flat = jwt.getClaim("roles");
          Object nested =
              jwt.getClaim("realm_access") instanceof Map<?, ?> realm
                  ? realm.get("roles")
                  : null;
          Object roles = flat != null ? flat : nested;
          java.util.Collection<org.springframework.security.core.GrantedAuthority> out = List.of();
          if (roles instanceof List<?> list) {
            out =
                list.stream()
                    .map(String::valueOf)
                    .map(r -> (org.springframework.security.core.GrantedAuthority)
                        new SimpleGrantedAuthority(r))
                    .toList();
          }
          return out;
        });
    return converter;
  }

  static void unauthorized(
      HttpServletRequest req, HttpServletResponse res, org.springframework.security.core.AuthenticationException ex)
      throws IOException {
    write(res, HttpStatus.UNAUTHORIZED, "AUTH_REQUIRED", "login required");
  }

  static void forbidden(
      HttpServletRequest req, HttpServletResponse res, org.springframework.security.access.AccessDeniedException ex)
      throws IOException {
    write(res, HttpStatus.FORBIDDEN, "FORBIDDEN", "insufficient role");
  }

  static void write(HttpServletResponse res, HttpStatus status, String code, String message)
      throws IOException {
    res.setStatus(status.value());
    res.setContentType(MediaType.APPLICATION_JSON_VALUE);
    new ObjectMapper()
        .writeValue(
            res.getOutputStream(),
            new ApiError(code, message, UUID.randomUUID().toString(), Map.of()));
  }
}
