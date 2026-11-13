package com.quantumclk.erp.auth;

import static org.hamcrest.Matchers.hasItems;
import static org.hamcrest.Matchers.not;
import static org.hamcrest.Matchers.hasItem;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotEquals;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;

/**
 * Unit 3.15: every role reaches only its workspace's endpoints (role_permission,
 * V2 + V9 + V11). "allow" means the permission check passed (any status but 401/403;
 * a fake id may still give 404).
 */
@SpringBootTest
@AutoConfigureMockMvc
class PermissionMatrixTest {

  private static final String ANY_ID = UUID.randomUUID().toString();

  @Autowired private MockMvc mvc;

  @ParameterizedTest(name = "{0} {1} {2} -> {3}")
  @CsvSource({
    // Housekeeping: board yes, front office / bookings / billing no (all were open before 3.15)
    "HOUSEKEEPING, GET, /api/v1/housekeeping/board, allow",
    "HOUSEKEEPING, GET, /api/v1/reservations, deny",
    "HOUSEKEEPING, GET, /api/v1/front-office/dashboard, deny",
    "HOUSEKEEPING, POST, /api/v1/stays/check-in, deny",
    "HOUSEKEEPING, GET, /api/v1/folios?stayId={id}, deny",
    "HOUSEKEEPING, GET, /api/v1/guests/{id}/profile, deny",
    // Sales: view-only guests, nothing else in erp-app
    "SALES_EXEC, GET, /api/v1/guests?search=a, allow",
    "SALES_EXEC, GET, /api/v1/guests/{id}/profile, allow",
    "SALES_EXEC, POST, /api/v1/walk-ins, deny",
    "SALES_EXEC, GET, /api/v1/folios/{id}, deny",
    "SALES_EXEC, GET, /api/v1/reservations, deny",
    "SALES_SUPERVISOR, GET, /api/v1/guests?search=a, allow",
    // Reception: front office + bookings + room board, not ops/reconciliation
    "RECEPTION, GET, /api/v1/front-office/dashboard, allow",
    "RECEPTION, GET, /api/v1/reservations, allow",
    "RECEPTION, GET, /api/v1/room-categories, allow",
    "RECEPTION, GET, /api/v1/housekeeping/board, allow",
    "RECEPTION, GET, /api/v1/ops/status, deny",
    "RECEPTION, GET, /api/v1/reconciliation, deny",
    // Accounts: billing, not housekeeping or front office
    "ACCOUNTS, GET, /api/v1/folios/{id}, allow",
    "ACCOUNTS, GET, /api/v1/reconciliation, allow",
    "ACCOUNTS, GET, /api/v1/housekeeping/board, deny",
    "ACCOUNTS, GET, /api/v1/front-office/dashboard, deny",
    // Membership: guest lookup + members, not bookings
    "MEMBERSHIP, GET, /api/v1/guests?search=a, allow",
    "MEMBERSHIP, GET, /api/v1/members/{id}, allow",
    "MEMBERSHIP, GET, /api/v1/reservations, deny",
    // Ops: console only
    "OPS_VIEWER, GET, /api/v1/ops/status, allow",
    "OPS_VIEWER, GET, /api/v1/guests?search=a, deny",
    // Manager: everything operational, not config changes
    "MANAGER, GET, /api/v1/reservations, allow",
    "MANAGER, GET, /api/v1/housekeeping/board, allow",
    "MANAGER, GET, /api/v1/reconciliation, allow",
    "MANAGER, GET, /api/v1/guests/{id}/profile, allow",
  })
  void roleReachesOnlyItsWorkspace(String role, String method, String path, String expected) throws Exception {
    String url = path.replace("{id}", ANY_ID);
    MockHttpServletRequestBuilder req =
        "POST".equals(method)
            ? post(url).contentType(MediaType.APPLICATION_JSON).content("{}")
            : get(url);
    int status = mvc.perform(req.with(user(role.toLowerCase()).authorities(() -> role))).andReturn().getResponse().getStatus();
    if ("deny".equals(expected)) {
      assertEquals(403, status, role + " " + method + " " + url);
    } else {
      assertNotEquals(403, status, role + " " + method + " " + url);
      assertNotEquals(401, status, role + " " + method + " " + url);
    }
  }

  @Test
  void anonymousIsRejected() throws Exception {
    mvc.perform(get("/api/v1/me")).andExpect(status().isUnauthorized());
    mvc.perform(get("/api/v1/reservations")).andExpect(status().isUnauthorized());
  }

  @Test
  void meListsPermissionsFromTheTable() throws Exception {
    mvc.perform(get("/api/v1/me").with(user("sales-staff").authorities(() -> "SALES_EXEC")))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.username").value("sales-staff"))
        .andExpect(jsonPath("$.roles", hasItem("SALES_EXEC")))
        .andExpect(jsonPath("$.permissions", hasItems("leads:manage", "guests:view")))
        .andExpect(jsonPath("$.permissions", not(hasItem("guests:edit"))));
  }

  @Test
  void superadminHoldsEverything() throws Exception {
    mvc.perform(get("/api/v1/me").with(user("admin").authorities(() -> "SUPERADMIN")))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.permissions", hasItem("*")));
  }
}
