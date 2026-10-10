package com.quantumclk.erp.erp02;

import static org.junit.jupiter.api.Assertions.assertEquals;

import com.quantumclk.erp.erp02.BookingService.NewGuest;
import com.quantumclk.erp.erp07.PaymentService;
import java.time.Instant;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.Callable;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.web.server.ResponseStatusException;

/**
 * THE critical test (playbook §15 top risk): N guests race for the last room
 * in a category pool — exactly one booking may succeed. Runs at the service
 * layer (transactions are the unit under test; HTTP auth is covered by
 * BookingApiTest).
 */
@SpringBootTest
class BookingRaceTest {

  static final UUID VILLA = UUID.fromString("44444444-4444-4444-4444-444444444444");
  static final UUID PROPERTY = RoomCategoryController.GOLDEN_HILLS_PROPERTY_ID;
  static final LocalDate FROM = LocalDate.of(2026, 11, 16); // Mon
  static final LocalDate TO = LocalDate.of(2026, 11, 18); // Wed

  @Autowired private BookingService bookings;
  @Autowired private PaymentService payments;
  @Autowired private ReservationRepository reservations;
  @Autowired private ReservationHoldRepository holds;

  @Test
  void lastRoomGoesToExactlyOneGuest() throws Exception {
    // Occupy 9 of 10 Villas with confirmed holds (advance settled via sandbox).
    for (int i = 0; i < 9; i++) {
      Reservation reservation =
          bookings.book(PROPERTY, null, new NewGuest("Pre Guest " + i, "+91-9822001" + String.format("%03d", i)),
              VILLA, FROM, TO, null, "race-pre-" + i, "web", "race-test", "test");
      payments.sandboxSettle(PROPERTY, null, reservation.getId(), reservation.getAdvanceDuePaise(),
          "race-test", "test");
      bookings.confirm(PROPERTY, reservation.getId(), false, "race-test", "test");
    }
    // 4 guests race for the last Villa at the same instant.
    ExecutorService pool = Executors.newFixedThreadPool(4);
    List<Future<Boolean>> futures = new ArrayList<>();
    for (int i = 0; i < 4; i++) {
      final int n = i;
      Callable<Boolean> attempt =
          () -> {
            try {
              bookings.book(PROPERTY, null, new NewGuest("Racer " + n, "+91-9822002" + String.format("%03d", n)),
                  VILLA, FROM, TO, null, "race-last-" + n, "web", "race-test", "test");
              return true;
            } catch (ResponseStatusException e) {
              return false;
            }
          };
      futures.add(pool.submit(attempt));
    }
    int winners = 0;
    for (Future<Boolean> future : futures) {
      if (future.get()) {
        winners++;
      }
    }
    pool.shutdown();
    assertEquals(1, winners, "exactly one racer may take the last room");
    assertEquals(
        10, reservations.countOverlapping(PROPERTY, VILLA, FROM, TO),
        "pool fully consumed, never overbooked");
  }

  @Test
  void expiredHoldsReleaseInventory() {
    Reservation reservation =
        bookings.book(PROPERTY, null, new NewGuest("Expiry Guest", "+91-9822002999"), VILLA, FROM, TO,
            null, "race-expiry-1", "web", "race-test", "test");
    ReservationHold hold = holds.findById(reservation.getId()).orElseThrow();
    hold.setExpiresAt(Instant.now().minusSeconds(1));
    holds.save(hold);
    assertEquals(1, bookings.expireHolds(Instant.now(), "test"));
    assertEquals(
        Reservation.EXPIRED,
        reservations.findById(reservation.getId()).orElseThrow().getStatus());
  }
}
