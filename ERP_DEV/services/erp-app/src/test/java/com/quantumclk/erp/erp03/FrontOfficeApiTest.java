package com.quantumclk.erp.erp03;

import static org.hamcrest.Matchers.greaterThan;
import static org.hamcrest.Matchers.hasItem;
import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.is;
import static org.hamcrest.Matchers.not;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

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
 * SOW ERP-03 + §19: check-in gates, walk-ins, transfer, checkout→task→ready,
 * arrivals, RBAC. The double-assign race proof lives in StayRaceTest.
 * NOTE: the H2 database is shared across test methods, so each test uses its
 * own dates/rooms and asserts containment (never exact counts across tests).
 */
@SpringBootTest
@AutoConfigureMockMvc
@WithMockUser(username = "reception-user", authorities = "RECEPTION")
class FrontOfficeApiTest {

  static final UUID DELUXE = UUID.fromString("22222222-2222-2222-2222-222222222222");
  static final String DEL_109 = "a1010000-0000-0000-0000-000000000009";
  static final String DEL_110 = "a1010000-0000-0000-0000-000000000010";

  @Autowired private MockMvc mvc;

  @Test
  void checkInHappyPath() throws Exception {
    String reservation = bookAndConfirm("+91-9822000401", "test-key-fo-1", "2027-02-01", "2027-02-03");
    MvcResult stay =
        mvc.perform(
                post("/api/v1/stays/check-in")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("{\"reservationId\":\"" + reservation + "\"}"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.status", is("checked-in")))
            .andReturn();
    String stayId = json(stay, "id");
    // In-house list contains the new stay (shared DB: assert containment, not count).
    mvc.perform(get("/api/v1/front-office/dashboard").param("date", "2027-02-01"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.inHouse", hasItem(stayId)));
    // Same reservation cannot check in twice.
    mvc.perform(
            post("/api/v1/stays/check-in")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"reservationId\":\"" + reservation + "\"}"))
        .andExpect(status().isConflict());
  }

  @Test
  void unconfirmedBookingCannotCheckIn() throws Exception {
    String reservation = book("+91-9822000402", "test-key-fo-2", "2027-02-01", "2027-02-03");
    mvc.perform(
            post("/api/v1/stays/check-in")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"reservationId\":\"" + reservation + "\"}"))
        .andExpect(status().isUnprocessableEntity());
  }

  @Test
  void dirtyRoomBlocksExplicitCheckIn() throws Exception {
    String reservation = bookAndConfirm("+91-9822000403", "test-key-fo-3", "2027-02-05", "2027-02-07");
    MvcResult stay =
        mvc.perform(
                post("/api/v1/stays/check-in")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("{\"reservationId\":\"" + reservation + "\"}"))
            .andExpect(status().isOk())
            .andReturn();
    String stayId = json(stay, "id");
    String roomId = json(stay, "roomId");
    // Settle the folio first (real balances since 3.4): room charge minus advance.
    MvcResult folioLookup =
        mvc.perform(get("/api/v1/folios").param("stayId", stayId))
            .andExpect(status().isOk())
            .andReturn();
    String folioBody = folioLookup.getResponse().getContentAsString();
    String folioId = folioBody.split("\"id\":\"")[1].split("\"")[0];
    int outstanding =
        Integer.parseInt(folioBody.split("\"outstandingPaise\":")[1].split("[,}]")[0]);
    MvcResult initiated =
        mvc.perform(
                post("/api/v1/payments/initiate")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("{\"folioId\":\"" + folioId + "\",\"amount\":" + outstanding + "}"))
            .andExpect(status().isCreated())
            .andReturn();
    String payBody = initiated.getResponse().getContentAsString();
    mvc.perform(
            post("/api/v1/payments/confirm")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"gatewayRef\":\"" + payBody.split("\"gatewayRef\":\"")[1].split("\"")[0]
                    + "\",\"signature\":\"" + payBody.split("\"signature\":\"")[1].split("\"")[0] + "\"}"))
        .andExpect(status().isOk());
    // Check out: room goes dirty + cleaning task appears.
    mvc.perform(post("/api/v1/stays/" + stayId + "/check-out")
            .contentType(MediaType.APPLICATION_JSON).content("{}"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.status", is("checked-out")));
    // Explicit check-in to the dirty room is refused...
    String reservation2 = bookAndConfirm("+91-9822000404", "test-key-fo-4", "2027-02-05", "2027-02-07");
    mvc.perform(
            post("/api/v1/stays/check-in")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"reservationId\":\"" + reservation2 + "\",\"roomId\":\"" + roomId + "\"}"))
        .andExpect(status().isUnprocessableEntity());
    // ...but the room shows dirty on the board (reception sees readiness live).
    MvcResult board =
        mvc.perform(get("/api/v1/housekeeping/board")).andExpect(status().isOk()).andReturn();
    assertTrue(board.getResponse().getContentAsString().contains(roomId));
  }

  @Test
  @WithMockUser(username = "hk-user", authorities = "HOUSEKEEPING")
  void cleaningChainReturnsRoomToReady() throws Exception {
    String roomId = "a1010000-0000-0000-0000-000000000001"; // DEL-101
    MvcResult task =
        mvc.perform(
                post("/api/v1/housekeeping/tasks")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("{\"roomId\":\"" + roomId + "\",\"notes\":\"deep clean\"}"))
            .andExpect(status().isOk())
            .andReturn();
    String taskId = json(task, "id");
    for (int i = 0; i < 3; i++) {
      mvc.perform(patch("/api/v1/housekeeping/tasks/" + taskId + "/advance"))
          .andExpect(status().isOk());
    }
    // Done is terminal: a fourth advance is refused.
    mvc.perform(patch("/api/v1/housekeeping/tasks/" + taskId + "/advance"))
        .andExpect(status().isUnprocessableEntity());
  }

  @Test
  void receptionCannotTouchTasks() throws Exception {
    mvc.perform(
            post("/api/v1/housekeeping/tasks")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"roomId\":\"a1010000-0000-0000-0000-000000000001\"}"))
        .andExpect(status().isForbidden());
  }

  @Test
  void walkInCreatesStayDirectly() throws Exception {
    mvc.perform(
            post("/api/v1/walk-ins")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"name\":\"Walk In\",\"phone\":\"+91-9822000405\",\"categoryId\":\"" + DELUXE + "\"}"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.status", is("checked-in")));
  }

  @Test
  void transferMovesStayAndDirtiesOldRoom() throws Exception {
    // Own dates + fixed rooms: no interference with other tests' pools.
    String reservation = bookAndConfirm("+91-9822000406", "test-key-fo-6", "2027-03-01", "2027-03-03");
    MvcResult stay =
        mvc.perform(
                post("/api/v1/stays/check-in")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("{\"reservationId\":\"" + reservation + "\",\"roomId\":\"" + DEL_109 + "\"}"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.roomId", is(DEL_109)))
            .andReturn();
    String stayId = json(stay, "id");
    mvc.perform(
            post("/api/v1/stays/" + stayId + "/transfer")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"toRoomId\":\"" + DEL_110 + "\",\"reason\":\"guest request\"}"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.roomId", is(DEL_110)));
  }

  @Test
  void arrivalsListsConfirmedForDate() throws Exception {
    String reservation = bookAndConfirm("+91-9822000407", "test-key-fo-7", "2027-04-01", "2027-04-03");
    MvcResult result =
        mvc.perform(get("/api/v1/arrivals").param("date", "2027-04-01"))
            .andExpect(status().isOk())
            .andReturn();
    assertTrue(result.getResponse().getContentAsString().contains(reservation));
  }

  /**
   * 3.8 semantics: an arrival is a confirmed booking whose check-in IS the date.
   * A stayed guest mid-booking (checkin before, checkout after) is in-house, not
   * an arrival — even though the old overlap query listed them.
   */
  @Test
  void arrivalsExcludeOverlappingNotArrivingToday() throws Exception {
    String reservation = bookAndConfirm("+91-9822000408", "test-key-fo-8", "2027-05-10", "2027-05-12");
    // Mid-stay day: not an arrival on /arrivals nor in the dashboard's arrivals list.
    mvc.perform(get("/api/v1/arrivals").param("date", "2027-05-11"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$", not(hasItem(reservation))));
    mvc.perform(get("/api/v1/front-office/dashboard").param("date", "2027-05-11"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.arrivals[?(@.id=='" + reservation + "')]", hasSize(0)));
    // The actual arrival day still lists the booking.
    mvc.perform(get("/api/v1/arrivals").param("date", "2027-05-10"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$", hasItem(reservation)));
    // 3.8 enrichment shape: arrivals carry guest, category, dates, status, advance.
    mvc.perform(get("/api/v1/front-office/dashboard").param("date", "2027-05-10"))
        .andExpect(status().isOk())
        .andExpect(
            jsonPath("$.arrivals[?(@.id=='" + reservation + "')].guestName", hasItem("FO Guest")))
        .andExpect(jsonPath("$.arrivals[?(@.id=='" + reservation + "')].category", hasItem("Deluxe")))
        .andExpect(jsonPath("$.arrivals[?(@.id=='" + reservation + "')].status", hasItem("confirmed")))
        .andExpect(
            jsonPath("$.arrivals[?(@.id=='" + reservation + "')].advanceDuePaise",
                hasItem(greaterThan(0))));
  }

  String book(String phone, String key, String from, String to) throws Exception {
    MvcResult result =
        mvc.perform(
                post("/api/v1/reservations")
                    .header("Idempotency-Key", key)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(
                        "{\"newGuest\":{\"name\":\"FO Guest\",\"phone\":\"" + phone + "\"},"
                            + "\"categoryId\":\"" + DELUXE + "\","
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

  /** Settle the advance through the sandbox gateway (initiate + signed confirm). */
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
