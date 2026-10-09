package com.quantumclk.erp.erp02;

import java.time.Instant;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

/**
 * SOW ERP-02: hold-expiry sweeper (every 60s). The safety net: even if a
 * client never confirms or cancels, the hold releases and inventory returns.
 */
@Component
public class HoldExpiryJob {

  private static final Logger log = LoggerFactory.getLogger(HoldExpiryJob.class);

  private final BookingService bookings;

  public HoldExpiryJob(BookingService bookings) {
    this.bookings = bookings;
  }

  @Scheduled(fixedDelayString = "${booking.expiry.sweep-ms:60000}")
  public void sweep() {
    int released = bookings.expireHolds(Instant.now(), "scheduler");
    if (released > 0) {
      log.info("hold-expiry released {} holds", released);
    }
  }
}
