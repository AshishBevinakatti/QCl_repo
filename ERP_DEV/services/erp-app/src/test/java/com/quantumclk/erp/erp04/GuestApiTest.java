package com.quantumclk.erp.erp04;

import static org.hamcrest.Matchers.is;
import static org.hamcrest.Matchers.notNullValue;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
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
import org.springframework.test.web.servlet.MvcResult;

/**
 * SOW ERP-04 (REQ-ERP04-001…005): phone-key dedupe, search, merge, audit.
 * WHY: one guest = one history; duplicates corrupt loyalty + folio links.
 */
@SpringBootTest
@AutoConfigureMockMvc
@WithMockUser(username = "reception-user", authorities = "RECEPTION")
class GuestApiTest {

  @Autowired private MockMvc mvc;
  @Autowired private AuditEventRepository auditEvents;
  @Autowired private GuestRepository guests;

  @Test
  void createGuestAndAudit() throws Exception {
    long before = auditEvents.count();
    mvc.perform(
            post("/api/v1/guests")
                .contentType(MediaType.APPLICATION_JSON)
                .content(
                    "{\"name\":\"Meera Rao\",\"phone\":\"+91-9822000100\",\"idType\":\"Aadhaar\",\"reason\":\"walk-in\"}"))
        .andExpect(status().isCreated())
        .andExpect(jsonPath("$.name", is("Meera Rao")))
        .andExpect(jsonPath("$.status", is("active")));
    assertEquals(before + 1, auditEvents.count());
  }

  @Test
  void duplicatePhoneIsConflict() throws Exception {
    // No seeded guests exist (user rule): create one, then collide with it.
    mvc.perform(
            post("/api/v1/guests")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"name\":\"First Copy\",\"phone\":\"+91-9822000111\"}"))
        .andExpect(status().isCreated());
    mvc.perform(
            post("/api/v1/guests")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"name\":\"Copy Cat\",\"phone\":\"+91-9822000111\"}"))
        .andExpect(status().isConflict())
        .andExpect(jsonPath("$.code", is("GUEST_EXISTS")))
        .andExpect(jsonPath("$.details.existingGuestId", notNullValue()));
  }

  @Test
  void badPhoneIs400WithContractShape() throws Exception {
    mvc.perform(
            post("/api/v1/guests")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"name\":\"No Phone\",\"phone\":\"abc\"}"))
        .andExpect(status().isBadRequest())
        .andExpect(jsonPath("$.code", is("VALIDATION_FAILED")));
  }

  @Test
  void searchFindsByNameAndPhone() throws Exception {
    // Tests own their data (no seeds): create, then find by name and by phone.
    mvc.perform(
            post("/api/v1/guests")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"name\":\"Diya Search\",\"phone\":\"+91-9822000112\"}"))
        .andExpect(status().isCreated());
    mvc.perform(get("/api/v1/guests").param("search", "diya search"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.items[0].name", is("Diya Search")));
    mvc.perform(get("/api/v1/guests").param("search", "9822000112"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.items[0].name", is("Diya Search")));
  }

  @Test
  void updateAndPhoneClash() throws Exception {
    MvcResult first =
        mvc.perform(
                post("/api/v1/guests")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("{\"name\":\"Update Me\",\"phone\":\"+91-9822000113\"}"))
            .andExpect(status().isCreated())
            .andReturn();
    mvc.perform(
            post("/api/v1/guests")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"name\":\"Clash Holder\",\"phone\":\"+91-9822000114\"}"))
        .andExpect(status().isCreated());
    String id = jsonId(first, "id");
    mvc.perform(
            patch("/api/v1/guests/" + id)
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"preferences\":\"{\\\"preference\\\": \\\"veg\\\"}\"}"))
        .andExpect(status().isOk());
    mvc.perform(
            patch("/api/v1/guests/" + id)
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"phone\":\"+91-9822000114\"}"))
        .andExpect(status().isConflict());
  }

  @Test
  void unknownGuestIs404() throws Exception {
    mvc.perform(get("/api/v1/guests/99999999-9999-9999-9999-999999999998"))
        .andExpect(status().isNotFound())
        .andExpect(jsonPath("$.code", is("NOT_FOUND")));
  }

  @Test
  void staysHookIsEmptyUntilBookings() throws Exception {
    MvcResult created =
        mvc.perform(
                post("/api/v1/guests")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("{\"name\":\"Stay Less\",\"phone\":\"+91-9822000115\"}"))
            .andExpect(status().isCreated())
            .andReturn();
    mvc.perform(get("/api/v1/guests/" + jsonId(created, "id") + "/stays"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.total", is(0)));
  }

  @Test
  @WithMockUser(username = "manager-user", authorities = "MANAGER")
  void managerCanMergeAndReceptionCannot() throws Exception {
    // create a fresh pair (tests own their data — no guest seeds exist)
    MvcResult a =
        mvc.perform(
                post("/api/v1/guests")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("{\"name\":\"Merge Primary\",\"phone\":\"+91-9822000201\"}"))
            .andExpect(status().isCreated())
            .andReturn();
    MvcResult b =
        mvc.perform(
                post("/api/v1/guests")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("{\"name\":\"Merge Dup\",\"phone\":\"+91-9822000202\"}"))
            .andExpect(status().isCreated())
            .andReturn();
    String primary = jsonId(a);
    String dup = jsonId(b);
    long before = auditEvents.count();
    mvc.perform(
            post("/api/v1/guests/merge")
                .contentType(MediaType.APPLICATION_JSON)
                .content(
                    "{\"primaryId\":\"" + primary + "\",\"duplicateId\":\"" + dup
                        + "\",\"reason\":\"duplicate registration\"}"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.id", is(primary)));
    assertEquals(before + 1, auditEvents.count());
    assertEquals(
        "merged",
        guests.findById(java.util.UUID.fromString(dup)).orElseThrow().getStatus());
  }

  @Test
  void receptionMergeIsForbidden() throws Exception {
    mvc.perform(
            post("/api/v1/guests/merge")
                .contentType(MediaType.APPLICATION_JSON)
                .content(
                    "{\"primaryId\":\"77777777-7777-7777-7777-777777777777\","
                        + "\"duplicateId\":\"88888888-8888-8888-8888-888888888888\"}"))
        .andExpect(status().isForbidden());
  }

  static String jsonId(MvcResult r, String field) throws Exception {
    String body = r.getResponse().getContentAsString();
    return body.split("\"" + field + "\":\"")[1].split("\"")[0];
  }

  static String jsonId(MvcResult r) throws Exception {
    return jsonId(r, "id");
  }
}
