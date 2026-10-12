package com.quantumclk.erp.erp02;

import static org.hamcrest.Matchers.is;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
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
 * SOW ERP-02 (REQ-ERP02-001…010): availability, pricing, holds, tiers,
 * idempotency, RBAC. The parallel-race proof lives in BookingRaceTest.
 */
@SpringBootTest
@AutoConfigureMockMvc
@WithMockUser(username = "reception-user", authorities = "RECEPTION")
class BookingApiTest {

  static final UUID DELUXE = UUID.fromString("22222222-2222-2222-2222-222222222222");
  // Rolling dates: fixed 2026 dates rotted (past check-ins reject with 400),
  // so both windows roll to the next matching weekday on every run.
  static final LocalDate WEEKDAY_FROM = next(java.time.DayOfWeek.MONDAY);
  static final LocalDate WEEKDAY_TO = WEEKDAY_FROM.plusDays(2); // Mon → Wed
  static final LocalDate WEEKEND_FROM = next(java.time.DayOfWeek.SATURDAY);
  static final LocalDate WEEKEND_TO = WEEKEND_FROM.plusDays(2); // Sat → Mon

  static LocalDate next(java.time.DayOfWeek dow) {
    LocalDate d = LocalDate.now();
    while (d.getDayOfWeek() != dow) d = d.plusDays(1);
    return d;
  }

  @Autowired private MockMvc mvc;

  @Test
  @org.springframework.security.test.context.support.WithAnonymousUser
  void anonymousCannotBook() throws Exception {
    mvc.perform(
            post("/api/v1/reservations")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{}"))
        .andExpect(status().isUnauthorized());
  }

  @Test
  void availabilityStartsFull() throws Exception {
    mvc.perform(
            get("/api/v1/availability")
                .param("categoryId", DELUXE.toString())
                .param("from", "2026-12-01")
                .param("to", "2026-12-03"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.totalRooms", is(10)))
        .andExpect(jsonPath("$.available", is(10)));
  }

  @Test
  void bookWeekdayWithPromoMath() throws Exception {
    // 2 nights x 500000 = 1000000, WELCOME10 -> 900000, advance 30% -> 270000.
    MvcResult result =
        mvc.perform(
                post("/api/v1/reservations")
                    .header("Idempotency-Key", "test-key-weekday-1")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(bookingJson("+91-9822000301", WEEKDAY_FROM, WEEKDAY_TO, "WELCOME10")))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.status", is("hold")))
            .andExpect(jsonPath("$.quotedTotalPaise", is(900000)))
            .andExpect(jsonPath("$.advanceDuePaise", is(270000)))
            .andReturn();
    String id = jsonId(result);
    // Replay with the same key: same reservation, no duplicate.
    mvc.perform(
            post("/api/v1/reservations")
                .header("Idempotency-Key", "test-key-weekday-1")
                .contentType(MediaType.APPLICATION_JSON)
                .content(bookingJson("+91-9822000301", WEEKDAY_FROM, WEEKDAY_TO, "WELCOME10")))
        .andExpect(status().isOk())
        .andExpect(header().string("X-Idempotent-Replayed", "true"))
        .andExpect(jsonPath("$.id", is(id)));
    // Confirm the hold (advance must be captured first — the 3.4 gate).
    payAdvance(id);
    // Confirm the hold.
    mvc.perform(post("/api/v1/reservations/" + id + "/confirm")
            .contentType(MediaType.APPLICATION_JSON).content("{}"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.status", is("confirmed")));
  }

  @Test
  void bookWeekendPricing() throws Exception {
    // 2 weekend nights x 600000 = 1200000, WELCOME10 -> 1080000.
    mvc.perform(
            post("/api/v1/reservations")
                .header("Idempotency-Key", "test-key-weekend-1")
                .contentType(MediaType.APPLICATION_JSON)
                .content(bookingJson("+91-9822000302", WEEKEND_FROM, WEEKEND_TO, "WELCOME10")))
        .andExpect(status().isCreated())
        .andExpect(jsonPath("$.quotedTotalPaise", is(1080000)));
  }

  @Test
  void invalidPromoIsRejected() throws Exception {
    mvc.perform(
            post("/api/v1/reservations")
                .header("Idempotency-Key", "test-key-badpromo-1")
                .contentType(MediaType.APPLICATION_JSON)
                .content(bookingJson("+91-9822000303", WEEKDAY_FROM, WEEKDAY_TO, "NOPE")))
        .andExpect(status().isBadRequest());
  }

  @Test
  void badDatesRejected() throws Exception {
    mvc.perform(
            post("/api/v1/reservations")
                .contentType(MediaType.APPLICATION_JSON)
                .content(bookingJson("+91-9822000304", WEEKDAY_TO, WEEKDAY_FROM, null)))
        .andExpect(status().isBadRequest());
  }

  @Test
  void freeCancellationFarOut() throws Exception {
    MvcResult result =
        mvc.perform(
                post("/api/v1/reservations")
                    .header("Idempotency-Key", "test-key-freecancel-1")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(
                        bookingJson("+91-9822000305", LocalDate.of(2027, 3, 1),
                            LocalDate.of(2027, 3, 3), null)))
            .andExpect(status().isCreated())
            .andReturn();
    mvc.perform(
            post("/api/v1/reservations/" + jsonId(result) + "/cancel")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"reason\":\"plans changed\"}"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.status", is("cancelled")))
        .andExpect(jsonPath("$.cancellationFeePaise", is(0)));
  }

  @Test
  void lateCancellationChargesOneNight() throws Exception {
    LocalDate tomorrow = LocalDate.now(BookingService.ZONE).plusDays(1);
    MvcResult result =
        mvc.perform(
                post("/api/v1/reservations")
                    .header("Idempotency-Key", "test-key-latecancel-1")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(bookingJson("+91-9822000306", tomorrow, tomorrow.plusDays(2), null)))
            .andExpect(status().isCreated())
            .andReturn();
    // Fee = one night's rate = half of the 2-night quote, whatever the weekday rate is.
    String body = result.getResponse().getContentAsString();
    int quoted = Integer.parseInt(body.split("\"quotedTotalPaise\":")[1].split("[,}]")[0]);
    mvc.perform(
            post("/api/v1/reservations/" + jsonId(result) + "/cancel")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"reason\":\"emergency\"}"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.status", is("cancelled")))
        .andExpect(jsonPath("$.cancellationFeePaise", is(quoted / 2)));
  }

  @Test
  void modifyRequotes() throws Exception {
    MvcResult result =
        mvc.perform(
                post("/api/v1/reservations")
                    .header("Idempotency-Key", "test-key-modify-1")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(bookingJson("+91-9822000307", WEEKDAY_FROM, WEEKDAY_TO, null)))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.quotedTotalPaise", is(1000000)))
            .andReturn();
    mvc.perform(
            patch("/api/v1/reservations/" + jsonId(result))
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"checkinDate\":\"2026-11-09\",\"checkoutDate\":\"2026-11-12\"}"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.quotedTotalPaise", is(1500000)));
  }

  @Test
  void dashboardListsReservations() throws Exception {
    mvc.perform(get("/api/v1/reservations").param("status", "confirmed"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.page", is(0)));
  }

  @Test
  void confirmBlockedWithoutAdvance() throws Exception {
    MvcResult result =
        mvc.perform(
                post("/api/v1/reservations")
                    .header("Idempotency-Key", "test-key-noadvance-1")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(bookingJson("+91-9822000308", WEEKDAY_FROM, WEEKDAY_TO, null)))
            .andExpect(status().isCreated())
            .andReturn();
    mvc.perform(post("/api/v1/reservations/" + jsonId(result) + "/confirm")
            .contentType(MediaType.APPLICATION_JSON).content("{}"))
        .andExpect(status().isUnprocessableEntity());
  }

  /** Sandbox settle: initiate (returns provider ref + signature) then confirm. */
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
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.status", is("captured")));
  }

  static String bookingJson(String phone, LocalDate from, LocalDate to, String promo) {
    return "{\"newGuest\":{\"name\":\"Booking Guest\",\"phone\":\"" + phone + "\"},"
        + "\"categoryId\":\"" + DELUXE + "\","
        + "\"checkinDate\":\"" + from + "\",\"checkoutDate\":\"" + to + "\","
        + (promo == null ? "" : "\"promoCode\":\"" + promo + "\",")
        + "\"source\":\"web\"}";
  }

  static String jsonId(MvcResult result) throws Exception {
    String body = result.getResponse().getContentAsString();
    return body.split("\"id\":\"")[1].split("\"")[0];
  }
}
