package com.quantumclk.erp.erp03;

import static org.junit.jupiter.api.Assertions.assertEquals;

import com.quantumclk.erp.erp02.BookingService;
import com.quantumclk.erp.erp02.BookingService.NewGuest;
import com.quantumclk.erp.erp02.Reservation;
import com.quantumclk.erp.erp02.RoomCategoryController;
import com.quantumclk.erp.erp07.PaymentService;
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
 * Room-level race proof (companion to BookingRaceTest): two stays racing for
 * the same physical room on overlapping dates — exactly one may win.
 */
@SpringBootTest
class StayRaceTest {

  static final UUID PROPERTY = RoomCategoryController.GOLDEN_HILLS_PROPERTY_ID;
  static final UUID DELUXE = UUID.fromString("22222222-2222-2222-2222-222222222222");
  static final UUID ROOM = UUID.fromString("a1010000-0000-0000-0000-000000000007"); // DEL-107
  static final LocalDate FROM = LocalDate.of(2027, 7, 1);
  static final LocalDate TO = LocalDate.of(2027, 7, 3);

  @Autowired private BookingService bookings;
  @Autowired private PaymentService payments;
  @Autowired private StayService stays;

  @Test
  void sameRoomGoesToExactlyOneStay() throws Exception {
    Reservation first =
        bookings.book(PROPERTY, null, new NewGuest("Race A", "+91-9822000501"), DELUXE, FROM, TO,
            null, "stay-race-a", "web", "race-test", "test");
    Reservation second =
        bookings.book(PROPERTY, null, new NewGuest("Race B", "+91-9822000502"), DELUXE, FROM, TO,
            null, "stay-race-b", "web", "race-test", "test");
    payments.sandboxSettle(PROPERTY, null, first.getId(), first.getAdvanceDuePaise(),
        "race-test", "test");
    payments.sandboxSettle(PROPERTY, null, second.getId(), second.getAdvanceDuePaise(),
        "race-test", "test");
    bookings.confirm(PROPERTY, first.getId(), false, "race-test", "test");
    bookings.confirm(PROPERTY, second.getId(), false, "race-test", "test");

    ExecutorService pool = Executors.newFixedThreadPool(2);
    List<Future<Boolean>> futures = new ArrayList<>();
    for (Reservation reservation : List.of(first, second)) {
      Callable<Boolean> attempt =
          () -> {
            try {
              stays.checkIn(PROPERTY, reservation.getId(), ROOM, "race-test", "test");
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
    assertEquals(1, winners, "exactly one stay may take the room");
  }
}
