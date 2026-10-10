package com.quantumclk.erp.erp05;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

/** SOW ERP-05: ledger reads (writes go through LoyaltyService — append-only). */
public interface LoyaltyLedgerRepository extends JpaRepository<LoyaltyLedger, UUID> {

  List<LoyaltyLedger> findByMemberIdOrderByCreatedAtAsc(UUID memberId);

  Optional<LoyaltyLedger> findByMemberIdAndRefTypeAndRefId(UUID memberId, String refType,
      String refId);

  @Query("SELECT COALESCE(SUM(l.pointsDelta), 0) FROM LoyaltyLedger l WHERE l.memberId = :member")
  int balance(@Param("member") UUID memberId);

  @Query("SELECT COALESCE(SUM(l.pointsDelta), 0) FROM LoyaltyLedger l WHERE l.memberId = :member"
      + " AND l.pointsDelta > 0 AND l.refType = 'payment'")
  long earnedFromPayments(@Param("member") UUID memberId);
}
