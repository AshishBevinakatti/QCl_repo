package com.quantumclk.erp.access.security;

import com.quantumclk.erp.access.web.ApiError;
import com.quantumclk.erp.access.web.CorrelationIdFilter;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.MediaType;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.core.DelegatingOAuth2TokenValidator;
import org.springframework.security.oauth2.core.OAuth2Error;
import org.springframework.security.oauth2.core.OAuth2TokenValidator;
import org.springframework.security.oauth2.core.OAuth2TokenValidatorResult;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.JwtIssuerValidator;
import org.springframework.security.oauth2.jwt.JwtTimestampValidator;
import org.springframework.security.oauth2.jwt.NimbusJwtDecoder;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationConverter;
import org.springframework.security.web.SecurityFilterChain;
import tools.jackson.databind.json.JsonMapper;

import java.io.IOException;
import java.time.Duration;
import java.util.ArrayList;
import java.util.Collection;
import java.util.List;
import java.util.Map;

/**
 * Every request: valid Keycloak (gh-staff) JWT with aud=erp-api, else 401; permission checks via
 * {@code @PreAuthorize("hasAuthority('PERM_x')")}, else 403 (AUTHENTICATION.md §3, §5 step 4).
 */
@Configuration
@EnableMethodSecurity
public class SecurityConfig {

    public static final String AUDIENCE = "erp-api";
    static final Duration CLOCK_SKEW = Duration.ofSeconds(60);

    @Bean
    SecurityFilterChain api(HttpSecurity http, JsonMapper json) throws Exception {
        http.csrf(c -> c.disable()) // stateless bearer-token API, no cookies
            .sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(a -> a
                .requestMatchers("/actuator/health/**").permitAll()
                .anyRequest().authenticated())
            .oauth2ResourceServer(o -> o
                .jwt(j -> j.jwtAuthenticationConverter(authenticationConverter()))
                .authenticationEntryPoint((req, res, e) -> write(res, json, 401, "AUTH_REQUIRED", "Sign in again."))
                .accessDeniedHandler((req, res, e) -> write(res, json, 403, "FORBIDDEN", "You do not have permission to do this.")))
            .exceptionHandling(e -> e
                .authenticationEntryPoint((req, res, ex) -> write(res, json, 401, "AUTH_REQUIRED", "Sign in again."))
                .accessDeniedHandler((req, res, ex) -> write(res, json, 403, "FORBIDDEN", "You do not have permission to do this.")))
            .headers(Customizer.withDefaults());
        return http.build();
    }

    /** Keys are fetched lazily from the realm's JWKS endpoint, so startup doesn't depend on Keycloak being up. */
    @Bean
    JwtDecoder jwtDecoder(@Value("${erp.keycloak.issuer}") String issuer) {
        NimbusJwtDecoder decoder = NimbusJwtDecoder.withJwkSetUri(issuer + "/protocol/openid-connect/certs").build();
        decoder.setJwtValidator(validator(issuer));
        return decoder;
    }

    /** Issuer + expiry/not-before (60 s skew) + audience. Shared with the tests so they check the real rules. */
    public static OAuth2TokenValidator<Jwt> validator(String issuer) {
        return new DelegatingOAuth2TokenValidator<>(
                new JwtTimestampValidator(CLOCK_SKEW),
                new JwtIssuerValidator(issuer),
                jwt -> jwt.getAudience() != null && jwt.getAudience().contains(AUDIENCE)
                        ? OAuth2TokenValidatorResult.success()
                        : OAuth2TokenValidatorResult.failure(new OAuth2Error("invalid_token", "aud must contain " + AUDIENCE, null)));
    }

    /** realm_access.roles → ROLE_x (job roles); resource_access.erp-api.roles → PERM_x (permissions). */
    public static JwtAuthenticationConverter authenticationConverter() {
        JwtAuthenticationConverter c = new JwtAuthenticationConverter();
        c.setJwtGrantedAuthoritiesConverter(jwt -> {
            Collection<GrantedAuthority> out = new ArrayList<>();
            roles(jwt.getClaimAsMap("realm_access")).forEach(r -> out.add(new SimpleGrantedAuthority("ROLE_" + r)));
            Map<String, Object> resources = jwt.getClaimAsMap("resource_access");
            if (resources != null && resources.get(AUDIENCE) instanceof Map<?, ?> api) {
                roles(api).forEach(p -> out.add(new SimpleGrantedAuthority("PERM_" + p)));
            }
            return out;
        });
        return c;
    }

    private static List<String> roles(Map<?, ?> holder) {
        return holder != null && holder.get("roles") instanceof List<?> l ? l.stream().map(String::valueOf).toList() : List.of();
    }

    private static void write(HttpServletResponse res, JsonMapper json, int status, String code, String message) throws IOException {
        res.setStatus(status);
        res.setContentType(MediaType.APPLICATION_JSON_VALUE);
        json.writeValue(res.getOutputStream(), ApiError.of(code, message, status, CorrelationIdFilter.current()));
    }
}
