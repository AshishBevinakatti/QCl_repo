package com.quantumclk.erp.erp05;

import static org.junit.jupiter.api.Assertions.assertEquals;

import com.quantumclk.erp.erp02.BookingService;
import com.quantumclk.erp.erp02.BookingService.NewGuest;
import com.quantumclk.erp.erp02.Reservation;
import com.quantumclk.erp.erp04.Guest;
import com.quantumclk.erp.erp04.GuestRepository;
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

/**
 * Points race proof: two concurrent captures for the same payment — the
 * ledger's (member, payment) uniqueness plus the member lock mean exactly
 * one earn lands, the other is a safe replay.
 */
@SpringBootTest
class EarnRaceTest {

  static final UUID PROPERTY =
      com.quantumclk.erp.erp02.RoomCategoryController.GOLDEN_HILLS_PROPERTY_ID;
  static final UUID DELUXE = UUID.fromString("22222222-2222-2222-2222-222222222222");

  @Autowired private BookingService bookings;
  @Autowired private PaymentService payments;
  @Autowired private LoyaltyService loyalty;
  @Autowired private GuestRepository guests;
  @Autowired private LoyaltyLedgerRepository ledger;

  @Test
  void concurrentCaptureEarnsOnce() throws Exception {
    Guest guest = guests.save(new Guest(PROPERTY, "Race Member", "+91-9822000901", null, "{}"));
    var member = loyalty.enroll(PROPERTY, guest.getId(), "race-test", "test");
    Reservation reservation =
        bookings.book(PROPERTY, guest.getId(), null, DELUXE, LocalDate.of(2027, 9, 6),
            LocalDate.of(2027, 9, 8), null, "earn-race-book", "web", "race-test", "test");
    var initiated =
        payments.initiate(PROPERTY, null, reservation.getId(), reservation.getAdvanceDuePaise(),
            reservation.getAdvanceDuePaise(), "earn-race-pay", "race-test", "test");

    ExecutorService pool = Executors.newFixedThreadPool(2);
    List<Future<Integer>> futures = new ArrayList<>();
    for (int i = 0; i < 2; i++) {
      Callable<Integer> attempt =
          () -> payments.confirmByRef(PROPERTY, initiated.payment().getGatewayRef(),
              initiated.signature(), "test") != null
              ? loyalty.balance(member.getId())
              : -1;
      futures.add(pool.submit(attempt));
    }
    for (Future<Integer> future : futures) {
      future.get();
    }
    pool.shutdown();
    long earnRows =
        ledger.findByMemberIdOrderByCreatedAtAsc(member.getId()).stream()
            .filter(e -> "payment".equals(e.getRefType()))
            .count();
    assertEquals(1, earnRows, "exactly one earn per payment");
    int expected = (int) (reservation.getAdvanceDuePaise() / 100 * 1 / 100);
    assertEquals(expected, loyalty.balance(member.getId()));
  }
}
