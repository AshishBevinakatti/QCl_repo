package com.quantumclk.erp.erp03;

import static org.hamcrest.Matchers.containsString;
import static org.hamcrest.Matchers.hasItem;
import static org.hamcrest.Matchers.is;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithAnonymousUser;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

/**
 * SOW ERP-03 (Slice 3.6): departures, in-house, alerts lists.
 * Shared-H2 discipline: own 2027-06 dates, containment assertions only.
 */
@SpringBootTest
@AutoConfigureMockMvc
@WithMockUser(username = "reception-user", authorities = "RECEPTION")
class FrontOfficeListsApiTest {

  // Suite pool: no other test class touches it (Deluxe is shared and crowded).
  static final UUID SUITE = UUID.fromString("33333333-3333-3333-3333-333333333333");

  @Autowired private MockMvc mvc;

  @Test
  void departuresListsCheckoutDayStay() throws Exception {
    String reservation = bookAndConfirm("+91-9822000902", "test-key-fo-l1", "2027-06-01", "2027-06-03");
    String stayId = checkIn(reservation, null);
    mvc.perform(get("/api/v1/departures").param("date", "2027-06-03"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$[*].stayId", hasItem(stayId)))
        .andExpect(jsonPath("$[?(@.stayId=='" + stayId + "')].guestName", hasItem("FO Guest")))
        // Advance is 30% — the rest is outstanding after check-in.
        .andExpect(jsonPath("$[?(@.stayId=='" + stayId + "')].status", hasItem("Pending Payment")));
  }

  @Test
  void departuresEmptyOnQuietDate() throws Exception {
    mvc.perform(get("/api/v1/departures").param("date", "2027-06-09"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.length()", is(0)));
  }

  @Test
  void departureTurnsReadyWhenSettled() throws Exception {
    String reservation = bookAndConfirm("+91-9822000903", "test-key-fo-l2", "2027-06-04", "2027-06-06");
    String stayId = checkIn(reservation, null);
    String folioBody =
        mvc.perform(get("/api/v1/folios").param("stayId", stayId))
            .andExpect(status().isOk())
            .andReturn().getResponse().getContentAsString();
    String folioId = folioBody.split("\"id\":\"")[1].split("\"")[0];
    long outstanding = Long.parseLong(folioBody.split("\"outstandingPaise\":")[1].split("}")[0]);
    MvcResult initiated =
        mvc.perform(
                post("/api/v1/payments/initiate")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("{\"folioId\":\"" + folioId + "\",\"amount\":" + outstanding + "}"))
            .andExpect(status().isCreated())
            .andReturn();
    String initBody = initiated.getResponse().getContentAsString();
    String ref = initBody.split("\"gatewayRef\":\"")[1].split("\"")[0];
    String sig = initBody.split("\"signature\":\"")[1].split("\"")[0];
    mvc.perform(
            post("/api/v1/payments/confirm")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"gatewayRef\":\"" + ref + "\",\"signature\":\"" + sig + "\"}"))
        .andExpect(status().isOk());
    mvc.perform(get("/api/v1/departures").param("date", "2027-06-06"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$[?(@.stayId=='" + stayId + "')].status", hasItem("Ready")))
        .andExpect(jsonPath("$[?(@.stayId=='" + stayId + "')].outstandingPaise", hasItem(0)));
  }

  @Test
  void inHouseContainsFreshCheckIn() throws Exception {
    String reservation = bookAndConfirm("+91-9822000904", "test-key-fo-l3", "2027-06-10", "2027-06-12");
    String stayId = checkIn(reservation, null);
    mvc.perform(get("/api/v1/in-house"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$[*].stayId", hasItem(stayId)))
        .andExpect(jsonPath("$[?(@.stayId=='" + stayId + "')].guestName", hasItem("FO Guest")))
        .andExpect(jsonPath("$[?(@.stayId=='" + stayId + "')].checkoutDate", hasItem("2027-06-12")));
  }

  @Test
  void alertsFlagDirtyRoomAndPendingPayment() throws Exception {
    // Pending (initiated, never confirmed) payment → verification alert.
    String reservation = bookAndConfirm("+91-9822000905", "test-key-fo-l4", "2027-06-13", "2027-06-15");
    mvc.perform(
            post("/api/v1/payments/initiate")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"reservationId\":\"" + reservation + "\"}"))
        .andExpect(status().isCreated());
    // Checkout dirties the room + opens a housekeeping task → readiness alert.
    String stayId = checkIn(reservation, null);
    mvc.perform(
            post("/api/v1/stays/" + stayId + "/check-out")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"managerOverride\":true}"))
        .andExpect(status().isOk());
    mvc.perform(get("/api/v1/alerts"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$[*].text", hasItem(containsString("not ready"))))
        .andExpect(jsonPath("$[*].text", hasItem(containsString("Payment verification"))));
  }

  @Test
  @WithAnonymousUser
  void anonymousIsRejected() throws Exception {
    mvc.perform(get("/api/v1/departures").param("date", "2027-06-03"))
        .andExpect(status().isUnauthorized());
    mvc.perform(get("/api/v1/in-house")).andExpect(status().isUnauthorized());
    mvc.perform(get("/api/v1/alerts")).andExpect(status().isUnauthorized());
  }

  String checkIn(String reservationId, String roomId) throws Exception {
    MvcResult stay =
        mvc.perform(
                post("/api/v1/stays/check-in")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("{\"reservationId\":\"" + reservationId + "\""
                        + (roomId == null ? "" : ",\"roomId\":\"" + roomId + "\"") + "}"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.status", is("checked-in")))
            .andReturn();
    return json(stay, "id");
  }

  String book(String phone, String key, String from, String to) throws Exception {
    MvcResult result =
        mvc.perform(
                post("/api/v1/reservations")
                    .header("Idempotency-Key", key)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(
                        "{\"newGuest\":{\"name\":\"FO Guest\",\"phone\":\"" + phone + "\"},"
                            + "\"categoryId\":\"" + SUITE + "\","
                            + "\"checkinDate\":\"" + from + "\",\"checkoutDate\":\"" + to + "\","
                            + "\"source\":\"web\"}"))
            .andExpect(status().isCreated())
            .andReturn();
    return json(result, "id");
  }

  String bookAndConfirm(String phone, String key, String from, String to) throws Exception {
    String reservation = book(phone, key, from, to);
    payAdvance(reservation);
    mvc.perform(post("/api/v1/reservations/" + reservation + "/confirm")
            .contentType(MediaType.APPLICATION_JSON).content("{}"))
        .andExpect(status().isOk());
    return reservation;
  }

  void payAdvance(String reservationId) throws Exception {
    MvcResult initiated =
        mvc.perform(
                post("/api/v1/payments/initiate")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("{\"reservationId\":\"" + reservationId + "\"}"))
            .andExpect(status().isCreated())
            .andReturn();
    String body = initiated.getResponse().getContentAsString();
    String ref = body.split("\"gatewayRef\":\"")[1].split("\"")[0];
    String sig = body.split("\"signature\":\"")[1].split("\"")[0];
    mvc.perform(
            post("/api/v1/payments/confirm")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"gatewayRef\":\"" + ref + "\",\"signature\":\"" + sig + "\"}"))
        .andExpect(status().isOk());
  }

  static String json(MvcResult result, String field) throws Exception {
    String body = result.getResponse().getContentAsString();
    return body.split("\"" + field + "\":\"")[1].split("\"")[0];
  }
}
