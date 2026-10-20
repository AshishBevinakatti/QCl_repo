package com.quantumclk.erp.ops;

import static org.hamcrest.Matchers.hasItem;
import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.is;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.quantumclk.erp.audit.AuditEventRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

/** Phase 1 contract: DB-backed ops permissions + honest, read-only status. */
@SpringBootTest
@AutoConfigureMockMvc
class OpsApiTest {

  @Autowired private MockMvc mvc;
  @Autowired private AuditEventRepository auditEvents;

  @Test
  void anonymousIsRejected() throws Exception {
    mvc.perform(get("/api/v1/ops/status"))
        .andExpect(status().isUnauthorized())
        .andExpect(jsonPath("$.code", is("AUTH_REQUIRED")));
  }

  @Test
  @WithMockUser(username = "reception-user", authorities = "RECEPTION")
  void resortRolesCannotOpenOpsConsole() throws Exception {
    mvc.perform(get("/api/v1/ops/status"))
        .andExpect(status().isForbidden())
        .andExpect(jsonPath("$.code", is("FORBIDDEN")));
  }

  @Test
  @WithMockUser(username = "ops-viewer", authorities = "OPS_VIEWER")
  void viewerSeesHonestStatusAndFlagsButNotAudit() throws Exception {
    mvc.perform(get("/api/v1/ops/status"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.state", is("OK")))
        .andExpect(jsonPath("$.environment", is("local")))
        .andExpect(jsonPath("$.service.name", is("erp-app")))
        .andExpect(jsonPath("$.service.state", is("UP")))
        .andExpect(jsonPath("$.service.database.state", is("UP")))
        .andExpect(jsonPath("$.telemetry.configured", is(false)))
        .andExpect(jsonPath("$.telemetry.stale", is(false)))
        .andExpect(jsonPath("$.telemetry.sources", hasSize(4)))
        .andExpect(jsonPath("$.telemetry.sources[0].state", is("NOT_CONFIGURED")));

    mvc.perform(get("/api/v1/ops/integrations"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.sources", hasSize(4)))
        .andExpect(jsonPath("$.configured", is(false)));

    mvc.perform(get("/api/v1/ops/flags"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.items[0].key", is("module.guest_portal.enabled")))
        .andExpect(jsonPath("$.items[0].type", is("boolean")))
        .andExpect(
            jsonPath(
                "$.items[?(@.key=='module.restaurant.enabled')].value", hasItem("false")));

    mvc.perform(get("/api/v1/ops/audit"))
        .andExpect(status().isForbidden())
        .andExpect(jsonPath("$.code", is("FORBIDDEN")));
  }

  @Test
  @WithMockUser(username = "ops-admin", authorities = "OPS_ADMIN")
  void adminCanSearchAuditAndTheReadIsRecorded() throws Exception {
    mvc.perform(get("/api/v1/ops/audit").param("size", "5").param("days", "1"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.page", is(0)))
        .andExpect(jsonPath("$.size", is(5)))
        .andExpect(jsonPath("$.items").isArray());

    assertTrue(
        auditEvents.findAll().stream()
            .anyMatch(
                e ->
                    "ops.audit.read".equals(e.getAction())
                        && "ops-admin".equals(e.getActor())));
  }

  @Test
  @WithMockUser(username = "super-user", authorities = "SUPERADMIN")
  void superadminKeepsFullAccess() throws Exception {
    mvc.perform(get("/api/v1/ops/status")).andExpect(status().isOk());
    mvc.perform(get("/api/v1/ops/flags")).andExpect(status().isOk());
    mvc.perform(get("/api/v1/ops/audit")).andExpect(status().isOk());
  }

  @Test
  void requestIdIsEchoedAndUsedInTheErrorContract() throws Exception {
    MvcResult result =
        mvc.perform(get("/api/v1/ops/status").header("X-Request-Id", "test-request-1234"))
            .andExpect(status().isUnauthorized())
            .andExpect(header().string("X-Request-Id", "test-request-1234"))
            .andReturn();
    JsonNode body = new ObjectMapper().readTree(result.getResponse().getContentAsString());
    assertEquals("test-request-1234", body.get("requestId").asText());
  }

  @Test
  void unsafeRequestIdIsReplacedAndStillCorrelates() throws Exception {
    MvcResult result =
        mvc.perform(get("/api/v1/ops/status").header("X-Request-Id", "bad id"))
            .andExpect(status().isUnauthorized())
            .andReturn();
    String generated = result.getResponse().getHeader("X-Request-Id");
    assertNotNull(generated);
    assertNotEquals("bad id", generated);
    assertTrue(
        generated.matches("[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}"));
    JsonNode body = new ObjectMapper().readTree(result.getResponse().getContentAsString());
    assertEquals(generated, body.get("requestId").asText());
  }
}
