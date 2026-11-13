package com.quantumclk.lead.notification;

import com.fasterxml.jackson.databind.JsonNode;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestClient;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.Set;

/**
 * Reads sales staff contact data from Keycloak (the single source of staff identity).
 * Uses the confidential client "lead-service" (client credentials, realm-management view-users only).
 * User attributes: phone_number, whatsapp_on_duty=true|false.
 */
@Component
public class StaffDirectory {

    public record StaffContact(String username, String displayName, String phone) {}

    static final Set<String> SALES_ROLES = Set.of("SALES_EXEC", "SALES_SUPERVISOR");

    private final RestClient http;
    private final String realm;
    private final String clientId;
    private final String clientSecret;

    public StaffDirectory(
        RestClient.Builder builder,
        @Value("${app.staff-directory.base-url:http://localhost:8081}") String baseUrl,
        @Value("${app.staff-directory.realm:resort}") String realm,
        @Value("${app.staff-directory.client-id:lead-service}") String clientId,
        @Value("${app.staff-directory.client-secret:}") String clientSecret
    ) {
        this.http = builder.baseUrl(baseUrl).build();
        this.realm = realm;
        this.clientId = clientId;
        this.clientSecret = clientSecret;
    }

    public boolean configured() {
        return clientSecret != null && !clientSecret.isBlank();
    }

    /** Enabled users with a sales role and whatsapp_on_duty=true. */
    public List<StaffContact> onDutySalesStaff() {
        String token = accessToken();
        JsonNode users = http.get()
            .uri(u -> u.path("/admin/realms/{realm}/users")
                .queryParam("q", "whatsapp_on_duty:true")
                .queryParam("briefRepresentation", "false")
                .queryParam("max", "100")
                .build(realm))
            .header(HttpHeaders.AUTHORIZATION, "Bearer " + token)
            .retrieve()
            .body(JsonNode.class);

        List<StaffContact> out = new ArrayList<>();
        if (users == null) {
            return out;
        }
        for (JsonNode user : users) {
            if (!user.path("enabled").asBoolean(false)
                || !"true".equalsIgnoreCase(attribute(user, "whatsapp_on_duty"))
                || !hasSalesRole(user.path("id").asText(), token)) {
                continue;
            }
            out.add(toContact(user));
        }
        return out;
    }

    /** The current phone of one staff member, used at send time so the full number is never stored. */
    public Optional<StaffContact> findByUsername(String username) {
        String token = accessToken();
        JsonNode users = http.get()
            .uri(u -> u.path("/admin/realms/{realm}/users")
                .queryParam("username", username)
                .queryParam("exact", "true")
                .queryParam("briefRepresentation", "false")
                .build(realm))
            .header(HttpHeaders.AUTHORIZATION, "Bearer " + token)
            .retrieve()
            .body(JsonNode.class);
        if (users == null || users.isEmpty() || !users.get(0).path("enabled").asBoolean(false)) {
            return Optional.empty();
        }
        return Optional.of(toContact(users.get(0)));
    }

    private boolean hasSalesRole(String userId, String token) {
        JsonNode roles = http.get()
            .uri("/admin/realms/{realm}/users/{id}/role-mappings/realm/composite", realm, userId)
            .header(HttpHeaders.AUTHORIZATION, "Bearer " + token)
            .retrieve()
            .body(JsonNode.class);
        if (roles == null) {
            return false;
        }
        for (JsonNode role : roles) {
            if (SALES_ROLES.contains(role.path("name").asText())) {
                return true;
            }
        }
        return false;
    }

    private String accessToken() {
        MultiValueMap<String, String> form = new LinkedMultiValueMap<>();
        form.add("grant_type", "client_credentials");
        form.add("client_id", clientId);
        form.add("client_secret", clientSecret);
        JsonNode res = http.post()
            .uri("/realms/{realm}/protocol/openid-connect/token", realm)
            .contentType(MediaType.APPLICATION_FORM_URLENCODED)
            .body(form)
            .retrieve()
            .body(JsonNode.class);
        String token = res == null ? "" : res.path("access_token").asText("");
        if (token.isEmpty()) {
            throw new IllegalStateException("Keycloak returned no access token for client " + clientId);
        }
        return token;
    }

    private static StaffContact toContact(JsonNode user) {
        String name = (user.path("firstName").asText("") + " " + user.path("lastName").asText("")).trim();
        String username = user.path("username").asText();
        return new StaffContact(username, name.isEmpty() ? username : name, attribute(user, "phone_number"));
    }

    private static String attribute(JsonNode user, String key) {
        JsonNode values = user.path("attributes").path(key);
        return values.isArray() && !values.isEmpty() ? values.get(0).asText() : null;
    }
}
