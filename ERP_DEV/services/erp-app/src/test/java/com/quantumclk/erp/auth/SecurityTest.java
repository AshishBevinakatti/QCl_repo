package com.quantumclk.erp.auth;

import static org.hamcrest.Matchers.is;
import static org.hamcrest.Matchers.notNullValue;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.quantumclk.erp.audit.AuditEventRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

/**
 * RBAC deny-by-default proof (security.md matrix): closed endpoints reject
 * anonymous callers, enforce roles, and audit privileged writes.
 * (Token-signature verification is Keycloak's job at runtime; the
 * claims→authorities mapping has its own unit test in JwtRolesMappingTest.)
 */
@SpringBootTest
@AutoConfigureMockMvc
class SecurityTest {

  @Autowired private MockMvc mvc;
  @Autowired private AuditEventRepository auditEvents;

  @Test
  void anonymousCannotReadCategories() throws Exception {
    mvc.perform(get("/api/v1/room-categories"))
        .andExpect(status().isUnauthorized())
        .andExpect(jsonPath("$.code", is("AUTH_REQUIRED")))
        .andExpect(jsonPath("$.requestId", notNullValue()));
  }

  @Test
  void healthStaysPublic() throws Exception {
    mvc.perform(get("/api/v1/health")).andExpect(status().isOk());
  }

  @Test
  @WithMockUser(username = "reception-user", authorities = "RECEPTION")
  void receptionCanReadButCannotChangeConfig() throws Exception {
    mvc.perform(get("/api/v1/config"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.length()", is(14)));
    mvc.perform(
            patch("/api/v1/config/tax.gst_pct")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"value\":\"18\"}"))
        .andExpect(status().isForbidden())
        .andExpect(jsonPath("$.code", is("FORBIDDEN")));
  }

  @Test
  @WithMockUser(username = "test-user", authorities = "SUPERADMIN")
  void superadminConfigChangeIsAudited() throws Exception {
    long before = auditEvents.count();
    mvc.perform(
            patch("/api/v1/config/tax.gst_pct")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"value\":\"12\",\"reason\":\"slice test\"}"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.value", is("12")));
    assertEquals(before + 1, auditEvents.count());
    assertTrue(
        auditEvents.findAll().stream()
            .anyMatch(e -> "config.changed".equals(e.getAction()) && "test-user".equals(e.getActor())));
  }
}
