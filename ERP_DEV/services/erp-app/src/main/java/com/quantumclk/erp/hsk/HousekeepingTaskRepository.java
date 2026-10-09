package com.quantumclk.erp.hsk;

import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

/** SOW §19: task queue reads (transitions go through HousekeepingService). */
public interface HousekeepingTaskRepository extends JpaRepository<HousekeepingTask, UUID> {

  List<HousekeepingTask> findByPropertyIdAndStatus(UUID propertyId, String status);

  List<HousekeepingTask> findByPropertyId(UUID propertyId);

  List<HousekeepingTask> findByRoomIdAndStatus(UUID roomId, String status);
}
