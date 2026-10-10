package com.quantumclk.erp.erp07;

import static org.junit.jupiter.api.Assertions.assertEquals;

import com.quantumclk.erp.erp02.BookingService;
import com.quantumclk.erp.erp02.BookingService.NewGuest;
import com.quantumclk.erp.erp02.Reservation;
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
 * Money race proof (companion to BookingRaceTest): two concurrent attempts to
 * process the same approved refund — the row lock serializes them, the second
 * is a safe replay, and the provider is charged exactly once.
 */
@SpringBootTest
class RefundRaceTest {

  static final UUID PROPERTY = com.quantumclk.erp.erp02.RoomCategoryController.GOLDEN_HILLS_PROPERTY_ID;
  static final UUID DELUXE = UUID.fromString("22222222-2222-2222-2222-222222222222");

  @Autowired private BookingService bookings;
  @Autowired private PaymentService payments;
  @Autowired private SandboxGateway gateway;

  @Test
  void doubleProcessRefundsOnce() throws Exception {
    Reservation reservation =
        bookings.book(PROPERTY, null, new NewGuest("Refund Race", "+91-9822000701"), DELUXE,
            LocalDate.of(2026, 11, 23), LocalDate.of(2026, 11, 25), null, "refund-race-book",
            "web", "race-test", "test");
    PaymentService.Initiated initiated =
        payments.initiate(PROPERTY, null, reservation.getId(), reservation.getAdvanceDuePaise(),
            reservation.getAdvanceDuePaise(), "refund-race-pay", "race-test", "test");
    payments.confirmByRef(PROPERTY, initiated.payment().getGatewayRef(), initiated.signature(),
        "test");
    Refund refund =
        payments.requestRefund(PROPERTY, initiated.payment().getId(), 50000, "race",
            "refund-race-r1", "race-test", "test");
    payments.approveRefund(PROPERTY, refund.getId(), "race-test", "test");

    ExecutorService pool = Executors.newFixedThreadPool(2);
    List<Future<String>> futures = new ArrayList<>();
    for (int i = 0; i < 2; i++) {
      Callable<String> attempt =
          () -> payments.processRefund(PROPERTY, refund.getId(), "race-test", "test").getStatus();
      futures.add(pool.submit(attempt));
    }
    for (Future<String> future : futures) {
      assertEquals(Refund.PROCESSED, future.get());
    }
    pool.shutdown();
    assertEquals(50000, gateway.refundedAtProvider(initiated.payment().getGatewayRef()),
        "provider refunded exactly once");
  }
}
