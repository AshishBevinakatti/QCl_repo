package com.quantumclk.erp.access;

import org.junit.jupiter.api.Test;
import tools.jackson.databind.JsonNode;

import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpRequest;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/** REQ-IAM-010 and account management against real Keycloak (AUTHENTICATION §7). */
class AccountManagementTest extends KeycloakStack {

    private String createSales(String username) throws Exception {
        String body = """
                {"firstName":"Sam","lastName":"Lee","email":"%s@example.test","username":"%s","mobile":"+9198%08d","jobRole":"SALES_EXECUTIVE"}"""
                .formatted(username, username, Math.abs(username.hashCode()) % 100000000);
        String r = mvc.perform(post("/api/v1/admin/employees").header("Authorization", ADMIN_TOKEN)
                        .header("Idempotency-Key", UUID.randomUUID().toString()).contentType("application/json").content(body))
                .andExpect(status().isCreated()).andReturn().getResponse().getContentAsString();
        return JSON.readTree(r).get("id").asString();
    }

    private UUID kcId(String id) {
        return jdbc.queryForObject("SELECT keycloak_user_id FROM employee WHERE id = ?::uuid", UUID.class, id);
    }

    @Test
    void deactivateDisablesInKeycloakAndReactivateRestores() throws Exception {
        String id = createSales("deact.user");
        mvc.perform(patch("/api/v1/admin/employees/" + id + "/status").header("Authorization", ADMIN_TOKEN)
                .contentType("application/json").content("{\"active\":false}"))
                .andExpect(status().isBadRequest()).andExpect(jsonPath("$.message").value("A reason is required."));

        mvc.perform(patch("/api/v1/admin/employees/" + id + "/status").header("Authorization", ADMIN_TOKEN)
                .contentType("application/json").content("{\"active\":false,\"reason\":\"Left the company\"}"))
                .andExpect(status().isOk()).andExpect(jsonPath("$.status").value("DISABLED"))
                .andExpect(jsonPath("$.statusReason").value("Left the company"));
        assertThat(admin("GET", "/users/" + kcId(id), null).get("enabled").asBoolean()).isFalse();

        // The sync job must not flip it back: Keycloak says disabled too.
        jobs.sync();
        mvc.perform(get("/api/v1/admin/employees/" + id).header("Authorization", ADMIN_TOKEN)).andExpect(jsonPath("$.status").value("DISABLED"));

        mvc.perform(patch("/api/v1/admin/employees/" + id + "/status").header("Authorization", ADMIN_TOKEN)
                .contentType("application/json").content("{\"active\":true,\"reason\":\"Rejoined\"}"))
                .andExpect(status().isOk()).andExpect(jsonPath("$.status").value("INVITED")); // setup still pending
        assertThat(admin("GET", "/users/" + kcId(id), null).get("enabled").asBoolean()).isTrue();
    }

    @Test
    void roleChangeReplacesTheKeycloakRoleAndNeedsRolesAssign() throws Exception {
        String id = createSales("role.user");
        String manager = token(List.of("MANAGER"), List.of("employees.read"));
        mvc.perform(put("/api/v1/admin/employees/" + id + "/role").header("Authorization", manager)
                .contentType("application/json").content("{\"role\":\"MANAGER\",\"reason\":\"x\"}")).andExpect(status().isForbidden());

        mvc.perform(put("/api/v1/admin/employees/" + id + "/role").header("Authorization", ADMIN_TOKEN)
                .contentType("application/json").content("{\"role\":\"MANAGER\",\"reason\":\"Promoted to sales supervisor\"}"))
                .andExpect(status().isOk()).andExpect(jsonPath("$.jobRole").value("MANAGER"));
        JsonNode roles = admin("GET", "/users/" + kcId(id) + "/role-mappings/realm", null);
        assertThat(roles.findValuesAsString("name")).contains("MANAGER").doesNotContain("SALES_EXECUTIVE", "ADMIN");
    }

    @Test
    void resendInviteSendsAnotherEmailAndIsLimitedTo3PerHour() throws Exception {
        String id = createSales("resend.user");
        for (int i = 0; i < 3; i++) {
            mvc.perform(post("/api/v1/admin/employees/" + id + "/resend-invite").header("Authorization", ADMIN_TOKEN))
                    .andExpect(status().isOk()).andExpect(jsonPath("$.status").value("INVITED"));
        }
        mvc.perform(post("/api/v1/admin/employees/" + id + "/resend-invite").header("Authorization", ADMIN_TOKEN))
                .andExpect(status().isTooManyRequests());
        JsonNode mail = JSON.readTree(send(HttpRequest.newBuilder(URI.create(mailpit() + "/api/v1/search?query="
                + URLEncoder.encode("to:resend.user@example.test", StandardCharsets.UTF_8))).build()));
        assertThat(mail.get("messages_count").asInt()).isEqualTo(4); // first invite + 3 resends
    }

    @Test
    void auditViewShowsWhoDidWhatAndWhyAndIsAdminOnly() throws Exception {
        String id = createSales("audit.user");
        mvc.perform(patch("/api/v1/admin/employees/" + id + "/status").header("Authorization", ADMIN_TOKEN)
                .contentType("application/json").content("{\"active\":false,\"reason\":\"Contract ended\"}")).andExpect(status().isOk());
        mvc.perform(get("/api/v1/admin/audit?entityId=" + id).header("Authorization", ADMIN_TOKEN))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.total").value(3))
                .andExpect(jsonPath("$.items[0].action").value("EMPLOYEE_DEACTIVATED"))
                .andExpect(jsonPath("$.items[0].reason").value("Contract ended"));
        mvc.perform(get("/api/v1/admin/audit").header("Authorization", token(List.of("MANAGER"), List.of("employees.read"))))
                .andExpect(status().isForbidden());
    }
}
