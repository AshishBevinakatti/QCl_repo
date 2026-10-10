package com.quantumclk.erp.erp05;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

/** SOW ERP-05: member reads + row lock for concurrent earn/redeem. */
public interface MemberRepository extends JpaRepository<Member, UUID> {

  Optional<Member> findByPropertyIdAndGuestId(UUID propertyId, UUID guestId);

  List<Member> findByPropertyIdAndStatusAndValidToBefore(UUID propertyId, String status,
      java.time.LocalDate date);

  @Lock(jakarta.persistence.LockModeType.PESSIMISTIC_WRITE)
  @Query("SELECT m FROM Member m WHERE m.id = :id")
  Optional<Member> lockById(@Param("id") UUID id);
}
