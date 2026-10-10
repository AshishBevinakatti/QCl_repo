package com.quantumclk.erp.erp05;

import static org.hamcrest.Matchers.is;
import static org.hamcrest.Matchers.notNullValue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.time.LocalDate;
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
 * SOW ERP-05 (REQ-ERP05-001…006): enroll, earn on capture, redeem with cap,
 * adjustments, renewals, expiry, RBAC. The concurrent-earn proof lives in
 * EarnRaceTest. NOTE: shared H2 across tests — unique dates/phones per test.
 */
@SpringBootTest
@AutoConfigureMockMvc
@WithMockUser(username = "reception-user", authorities = {"RECEPTION", "MEMBERSHIP", "ACCOUNTS"})
class MemberApiTest {

  static final UUID DELUXE = UUID.fromString("22222222-2222-2222-2222-222222222222");

  @Autowired private MockMvc mvc;
  @Autowired private LoyaltyService loyalty;

  @Test
  void enrollAndGuestChip() throws Exception {
    String guest = createGuest("+91-9822000801", "Member One");
    MvcResult enrolled =
        mvc.perform(
                post("/api/v1/members")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("{\"guestId\":\"" + guest + "\"}"))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.tier", is("Silver")))
            .andExpect(jsonPath("$.status", is("active")))
            .andExpect(jsonPath("$.membershipNo", notNullValue()))
            .andExpect(jsonPath("$.points", is(0)))
            .andReturn();
    String memberId = json(enrolled, "id");
    // Duplicate enrollment is refused...
    mvc.perform(
            post("/api/v1/members")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"guestId\":\"" + guest + "\"}"))
        .andExpect(status().isConflict());
    // ...and the guest profile carries the member chip (REQ-ERP04-004).
    mvc.perform(get("/api/v1/guests/" + guest))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.memberId", is(memberId)));
  }

  @Test
  void earnOnCaptureAndRedeemWithCap() throws Exception {
    String guest = createGuest("+91-9822000802", "Member Two");
    String member = enroll(guest);
    // Book + pay + confirm: earn fires on capture (advance 30% of quote).
    String reservation = book("+91-9822000802", "test-key-mem-1", "2027-08-10", "2027-08-12");
    int advance = payAdvance(reservation, "test-key-mem-1-pay");
    confirm(reservation);
    int expectedPoints = advance / 100 / 100; // 1pt per Rs 100, rate 1.
    mvc.perform(get("/api/v1/members/" + member))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.points", is(expectedPoints)));
    // Ledger shows the earn line.
    mvc.perform(get("/api/v1/members/" + member + "/ledger"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.length()", is(1)));
    // Check in → folio: redeem 10 pts (Rs 10 credit) against it.
    String stay = checkIn(reservation);
    String folio = folioForStay(stay);
    MvcResult redeemed =
        mvc.perform(
                post("/api/v1/members/" + member + "/redeem")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("{\"folioId\":\"" + folio + "\",\"points\":10,"
                        + "\"idempotencyKey\":\"test-key-mem-1-red\"}"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.points", is(expectedPoints - 10)))
            .andReturn();
    // Over-cap redemption is refused (50% of outstanding per use).
    mvc.perform(
            post("/api/v1/members/" + member + "/redeem")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"folioId\":\"" + folio + "\",\"points\":999999,"
                    + "\"idempotencyKey\":\"test-key-mem-1-red2\"}"))
        .andExpect(status().isUnprocessableEntity());
  }

  @Test
  @WithMockUser(username = "manager-user", authorities = "MANAGER")
  void adjustAndRenew() throws Exception {
    String guest = createGuest("+91-9822000803", "Member Three");
    String member = enroll(guest);
    // Manual +500 with reason.
    mvc.perform(
            post("/api/v1/members/" + member + "/adjust")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"delta\":500,\"reason\":\"goodwill\"}"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.points", is(500)));
    // Reason is mandatory...
    mvc.perform(
            post("/api/v1/members/" + member + "/adjust")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"delta\":10,\"reason\":\"\"}"))
        .andExpect(status().isBadRequest());
    // ...and overdrafts are refused.
    mvc.perform(
            post("/api/v1/members/" + member + "/adjust")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"delta\":-99999,\"reason\":\"oops\"}"))
        .andExpect(status().isUnprocessableEntity());
    // Renew extends validity and keeps status active.
    mvc.perform(post("/api/v1/members/" + member + "/renew"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.status", is("active")));
  }

  @Test
  void receptionCannotAdjust() throws Exception {
    mvc.perform(
            post("/api/v1/members/00000000-0000-0000-0000-000000000000/adjust")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"delta\":10,\"reason\":\"x\"}"))
        .andExpect(status().isForbidden());
  }

  @Test
  void expiryJobExpiresLapsed() throws Exception {
    // Enroll here (not relying on other tests): far-future "today" lapses it.
    String guest = createGuest("+91-9822000804", "Member Four");
    enroll(guest);
    UUID property =
        com.quantumclk.erp.erp02.RoomCategoryController.GOLDEN_HILLS_PROPERTY_ID;
    int expired = loyalty.expireMembers(property, LocalDate.now().plusYears(5), "test");
    org.junit.jupiter.api.Assertions.assertTrue(expired >= 1);
  }

  // ---- helpers (class user has RECEPTION + MEMBERSHIP + ACCOUNTS) ----

  String createGuest(String phone, String name) throws Exception {
    MvcResult result =
        mvc.perform(
                post("/api/v1/guests")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("{\"name\":\"" + name + "\",\"phone\":\"" + phone + "\"}"))
            .andExpect(status().isCreated())
            .andReturn();
    return json(result, "id");
  }

  String enroll(String guest) throws Exception {
    MvcResult result =
        mvc.perform(
                post("/api/v1/members")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("{\"guestId\":\"" + guest + "\"}"))
            .andExpect(status().isCreated())
            .andReturn();
    return json(result, "id");
  }

  String book(String phone, String key, String from, String to) throws Exception {
    MvcResult result =
        mvc.perform(
                post("/api/v1/reservations")
                    .header("Idempotency-Key", key)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(
                        "{\"newGuest\":{\"name\":\"Loyal Guest\",\"phone\":\"" + phone + "\"},"
                            + "\"categoryId\":\"" + DELUXE + "\","
                            + "\"checkinDate\":\"" + from + "\",\"checkoutDate\":\"" + to + "\","
                            + "\"source\":\"web\"}"))
            .andExpect(status().isCreated())
            .andReturn();
    return json(result, "id");
  }

  int payAdvance(String reservation, String key) throws Exception {
    MvcResult initiated =
        mvc.perform(
                post("/api/v1/payments/initiate")
                    .header("Idempotency-Key", key)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("{\"reservationId\":\"" + reservation + "\"}"))
            .andExpect(status().isCreated())
            .andReturn();
    String body = initiated.getResponse().getContentAsString();
    String ref = body.split("\"gatewayRef\":\"")[1].split("\"")[0];
    String sig = body.split("\"signature\":\"")[1].split("\"")[0];
    MvcResult confirmed =
        mvc.perform(
                post("/api/v1/payments/confirm")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("{\"gatewayRef\":\"" + ref + "\",\"signature\":\"" + sig + "\"}"))
            .andExpect(status().isOk())
            .andReturn();
    return Integer.parseInt(
        confirmed.getResponse().getContentAsString().split("\"amountPaise\":")[1].split("[,}]")[0]);
  }

  void confirm(String reservation) throws Exception {
    mvc.perform(post("/api/v1/reservations/" + reservation + "/confirm")
            .contentType(MediaType.APPLICATION_JSON).content("{}"))
        .andExpect(status().isOk());
  }

  String checkIn(String reservation) throws Exception {
    MvcResult stay =
        mvc.perform(
                post("/api/v1/stays/check-in")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("{\"reservationId\":\"" + reservation + "\"}"))
            .andExpect(status().isOk())
            .andReturn();
    return json(stay, "id");
  }

  String folioForStay(String stay) throws Exception {
    MvcResult folio =
        mvc.perform(get("/api/v1/folios").param("stayId", stay))
            .andExpect(status().isOk())
            .andReturn();
    return json(folio, "id");
  }

  static String json(MvcResult result, String field) throws Exception {
    String body = result.getResponse().getContentAsString();
    return body.split("\"" + field + "\":\"")[1].split("\"")[0];
  }
}
