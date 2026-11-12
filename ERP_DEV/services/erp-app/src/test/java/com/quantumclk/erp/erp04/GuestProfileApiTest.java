package com.quantumclk.erp.erp04;

import static org.hamcrest.Matchers.containsString;
import static org.hamcrest.Matchers.is;
import static org.hamcrest.Matchers.notNullValue;
import static org.hamcrest.Matchers.nullValue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

/**
 * SOW ERP-04 (REQ-ERP04-001…005): Guest 360 read projection. Tests own their
 * data (no guest seeds) and use a unique villa date pool per test.
 */
@SpringBootTest
@AutoConfigureMockMvc
@WithMockUser(username = "guest-360-user", authorities = {"RECEPTION", "MANAGER"})
class GuestProfileApiTest {

  static final UUID VILLA = UUID.fromString("44444444-4444-4444-4444-444444444444");

  @Autowired private MockMvc mvc;
  @Autowired private ObjectMapper objectMapper;

  @Test
  void emptyProfileIsHonestAndPrefersHumanReadablePreferences() throws Exception {
    String guestId =
        createGuest(
            "No Stay Guest",
            "+91-9822000701",
            "nostay@example.com",
            "{\"diet\":\"vegetarian\",\"floor\":\"high\",\"newspaper\":true}");

    mvc.perform(get("/api/v1/guests/" + guestId + "/profile"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.guest.name", is("No Stay Guest")))
        .andExpect(jsonPath("$.guest.phone", is("+91-9822000701")))
        .andExpect(jsonPath("$.guest.email", is("nostay@example.com")))
        .andExpect(jsonPath("$.guest.preferences").doesNotExist())
        .andExpect(jsonPath("$.membership").value(nullValue()))
        .andExpect(jsonPath("$.currentStay").value(nullValue()))
        .andExpect(jsonPath("$.nextReservation").value(nullValue()))
        .andExpect(jsonPath("$.operationalState", is("NO_STAY")))
        .andExpect(jsonPath("$.reservations.length()", is(0)))
        .andExpect(jsonPath("$.reservationTotal", is(0)))
        .andExpect(jsonPath("$.billing.folioId").value(nullValue()))
        .andExpect(jsonPath("$.billing.outstandingPaise", is(0)))
        .andExpect(jsonPath("$.billing.paymentAlerts.length()", is(0)))
        .andExpect(jsonPath("$.alerts.length()", is(0)))
        .andExpect(jsonPath("$.preferences[0].label", is("Diet")))
        .andExpect(jsonPath("$.preferences[0].value", is("Vegetarian")))
        .andExpect(jsonPath("$.preferences[1].label", is("Floor")))
        .andExpect(jsonPath("$.preferences[1].value", is("High")))
        .andExpect(jsonPath("$.preferences[2].value", is("Yes")))
        .andExpect(content().string(org.hamcrest.Matchers.not(containsString("vegetarian\\\""))));
  }

  @Test
  void unknownGuestProfileIs404() throws Exception {
    mvc.perform(get("/api/v1/guests/99999999-9999-9999-9999-999999999996/profile"))
        .andExpect(status().isNotFound())
        .andExpect(jsonPath("$.code", is("NOT_FOUND")));
  }

  @Test
  void upcomingReservationShowsAdvanceAndPendingPaymentAlert() throws Exception {
    String guestId = createGuest("Upcoming Guest", "+91-9822000702", null, null);
    String reservationId = book(guestId, "2027-07-05", "2027-07-07", "test-key-profile-up-1");

    MvcResult initiated =
        mvc.perform(
                post("/api/v1/payments/initiate")
                    .header("Idempotency-Key", "test-key-profile-up-1-pay")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("{\"reservationId\":\"" + reservationId + "\"}"))
            .andExpect(status().isCreated())
            .andReturn();
    JsonNode payment = json(initiated);
    mvc.perform(
            post("/api/v1/payments/confirm")
                .contentType(MediaType.APPLICATION_JSON)
                .content(
                    "{\"gatewayRef\":\"" + payment.get("gatewayRef").asText()
                        + "\",\"signature\":\"forged\"}"))
        .andExpect(status().isUnauthorized());

    mvc.perform(get("/api/v1/guests/" + guestId + "/profile"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.operationalState", is("UPCOMING")))
        .andExpect(jsonPath("$.currentStay").value(nullValue()))
        .andExpect(jsonPath("$.nextReservation.reservationId", is(reservationId)))
        .andExpect(jsonPath("$.nextReservation.categoryName", is("Villa")))
        .andExpect(jsonPath("$.nextReservation.stayId").value(nullValue()))
        .andExpect(jsonPath("$.reservationTotal", is(1)))
        .andExpect(jsonPath("$.reservations[0].stayStatus").value(nullValue()))
        .andExpect(jsonPath("$.billing.folioId").value(nullValue()))
        .andExpect(jsonPath("$.billing.advanceDuePaise", is(900000)))
        .andExpect(jsonPath("$.billing.advancePaidPaise", is(0)))
        .andExpect(jsonPath("$.billing.paymentAlerts.length()", is(1)))
        .andExpect(jsonPath("$.billing.paymentAlerts[0].status", is("pending")))
        .andExpect(jsonPath("$.alerts[0].severity", is("info")))
        .andExpect(jsonPath("$.alerts[0].text", containsString("awaiting confirmation")));
  }

  @Test
  void membershipAppearsWithRealTierAndZeroPoints() throws Exception {
    String guestId = createGuest("Member Guest", "+91-9822000703", null, null);
    MvcResult enrolled =
        mvc.perform(
                post("/api/v1/members")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("{\"guestId\":\"" + guestId + "\"}"))
            .andExpect(status().isCreated())
            .andReturn();
    String memberId = json(enrolled).get("id").asText();

    mvc.perform(get("/api/v1/guests/" + guestId + "/profile"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.guest.memberId", is(memberId)))
        .andExpect(jsonPath("$.membership.id", is(memberId)))
        .andExpect(jsonPath("$.membership.tier", is("Silver")))
        .andExpect(jsonPath("$.membership.status", is("active")))
        .andExpect(jsonPath("$.membership.points", is(0)))
        .andExpect(jsonPath("$.membership.validFrom", notNullValue()))
        .andExpect(jsonPath("$.membership.validTo", notNullValue()));
  }

  @Test
  void activeStayUsesCanonicalBillingThenBecomesHistoryAfterCheckout() throws Exception {
    String guestId = createGuest("In House Guest", "+91-9822000704", null, null);
    String reservationId = book(guestId, "2027-09-13", "2027-09-15", "test-key-profile-stay-1");
    payAdvance(reservationId, "test-key-profile-stay-1-pay");
    mvc.perform(
            post("/api/v1/reservations/" + reservationId + "/confirm")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{}"))
        .andExpect(status().isOk());
    MvcResult checkedIn =
        mvc.perform(
                post("/api/v1/stays/check-in")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("{\"reservationId\":\"" + reservationId + "\"}"))
            .andExpect(status().isOk())
            .andReturn();
    String stayId = json(checkedIn).get("id").asText();

    MvcResult active =
        mvc.perform(get("/api/v1/guests/" + guestId + "/profile"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.operationalState", is("IN_HOUSE")))
            .andExpect(jsonPath("$.currentStay.reservationId", is(reservationId)))
            .andExpect(jsonPath("$.currentStay.stayId", is(stayId)))
            .andExpect(jsonPath("$.currentStay.roomNo", notNullValue()))
            .andExpect(jsonPath("$.currentStay.categoryName", is("Villa")))
            .andExpect(jsonPath("$.currentStay.checkinAt", notNullValue()))
            .andExpect(jsonPath("$.currentStay.checkoutAt").value(nullValue()))
            .andExpect(jsonPath("$.billing.folioId", notNullValue()))
            .andExpect(jsonPath("$.billing.status", is("open")))
            .andExpect(jsonPath("$.billing.chargesPaise", is(3000000)))
            .andExpect(jsonPath("$.billing.paymentsPaise", is(900000)))
            .andExpect(jsonPath("$.billing.outstandingPaise", is(2100000)))
            .andExpect(jsonPath("$.billing.invoice").value(nullValue()))
            .andExpect(jsonPath("$.billing.paymentAlerts.length()", is(0)))
            .andExpect(jsonPath("$.alerts.length()", is(0)))
            .andReturn();
    String folioId = json(active).get("billing").get("folioId").asText();

    mvc.perform(
            post("/api/v1/invoices")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"folioId\":\"" + folioId + "\"}"))
        .andExpect(status().isCreated())
        .andExpect(jsonPath("$.totalPaise", is(2460000)));
    mvc.perform(get("/api/v1/guests/" + guestId + "/profile"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.billing.invoice.status", is("issued")))
        .andExpect(jsonPath("$.billing.invoice.totalPaise", is(2460000)))
        .andExpect(jsonPath("$.billing.invoice.issuedAt", notNullValue()));

    mvc.perform(
            post("/api/v1/stays/" + stayId + "/check-out")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"managerOverride\":true}"))
        .andExpect(status().isOk());

    mvc.perform(get("/api/v1/guests/" + guestId + "/profile"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.operationalState", is("DEPARTED")))
        .andExpect(jsonPath("$.currentStay").value(nullValue()))
        .andExpect(jsonPath("$.nextReservation").value(nullValue()))
        .andExpect(jsonPath("$.reservationTotal", is(1)))
        .andExpect(jsonPath("$.reservations[0].reservationId", is(reservationId)))
        .andExpect(jsonPath("$.reservations[0].status", is("checked-out")))
        .andExpect(jsonPath("$.reservations[0].stayStatus", is("checked-out")))
        .andExpect(jsonPath("$.reservations[0].checkoutAt", notNullValue()))
        .andExpect(jsonPath("$.billing.outstandingPaise", is(2100000)))
        .andExpect(jsonPath("$.alerts[0].severity", is("high")))
        .andExpect(jsonPath("$.alerts[0].text", containsString("outstanding")));
  }

  private String createGuest(String name, String phone, String email, String preferences)
      throws Exception {
    Map<String, Object> body = new LinkedHashMap<>();
    body.put("name", name);
    body.put("phone", phone);
    if (email != null) {
      body.put("email", email);
    }
    if (preferences != null) {
      body.put("preferences", preferences);
    }
    MvcResult result =
        mvc.perform(
                post("/api/v1/guests")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(body)))
            .andExpect(status().isCreated())
            .andReturn();
    return json(result).get("id").asText();
  }

  private String book(String guestId, String from, String to, String key) throws Exception {
    Map<String, Object> body = new LinkedHashMap<>();
    body.put("guestId", guestId);
    body.put("categoryId", VILLA);
    body.put("checkinDate", from);
    body.put("checkoutDate", to);
    body.put("source", "web");
    MvcResult result =
        mvc.perform(
                post("/api/v1/reservations")
                    .header("Idempotency-Key", key)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(body)))
            .andExpect(status().isCreated())
            .andReturn();
    return json(result).get("id").asText();
  }

  private void payAdvance(String reservationId, String key) throws Exception {
    MvcResult initiated =
        mvc.perform(
                post("/api/v1/payments/initiate")
                    .header("Idempotency-Key", key)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("{\"reservationId\":\"" + reservationId + "\"}"))
            .andExpect(status().isCreated())
            .andReturn();
    JsonNode payment = json(initiated);
    mvc.perform(
            post("/api/v1/payments/confirm")
                .contentType(MediaType.APPLICATION_JSON)
                .content(
                    "{\"gatewayRef\":\"" + payment.get("gatewayRef").asText()
                        + "\",\"signature\":\"" + payment.get("signature").asText() + "\"}"))
        .andExpect(status().isOk());
  }

  private JsonNode json(MvcResult result) throws Exception {
    return objectMapper.readTree(result.getResponse().getContentAsString());
  }
}
