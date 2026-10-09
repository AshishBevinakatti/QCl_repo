package com.quantumclk.erp.erp03;

import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

/** SOW ERP-03: transfer history (append-only, no updates). */
public interface RoomTransferRepository extends JpaRepository<RoomTransfer, UUID> {}
