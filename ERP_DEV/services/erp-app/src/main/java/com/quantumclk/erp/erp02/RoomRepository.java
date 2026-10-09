package com.quantumclk.erp.erp02;

import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

/** SOW ERP-02: room catalogue reads (assignment lives in 3.3 front-office). */
public interface RoomRepository extends JpaRepository<Room, UUID> {

  long countByPropertyIdAndCategoryId(UUID propertyId, UUID categoryId);
}
