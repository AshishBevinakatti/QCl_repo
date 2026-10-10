package com.quantumclk.erp.erp05;

import com.quantumclk.erp.erp02.RoomCategoryController;
import java.time.LocalDate;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

/**
 * SOW ERP-05: membership expiry sweeper (hourly check, date-based action).
 * Expired members stop earning and redeeming until renewed.
 */
@Component
public class MembershipExpiryJob {

  private static final Logger log = LoggerFactory.getLogger(MembershipExpiryJob.class);

  private final LoyaltyService loyalty;

  public MembershipExpiryJob(LoyaltyService loyalty) {
    this.loyalty = loyalty;
  }

  @Scheduled(fixedDelayString = "${membership.expiry.sweep-ms:3600000}")
  public void sweep() {
    int expired =
        loyalty.expireMembers(
            RoomCategoryController.GOLDEN_HILLS_PROPERTY_ID, LocalDate.now(), "scheduler");
    if (expired > 0) {
      log.info("membership-expiry expired {} memberships", expired);
    }
  }
}
