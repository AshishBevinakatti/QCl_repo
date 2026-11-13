package com.quantumclk.lead.repository;

import com.quantumclk.lead.domain.PortalGuest;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;
import java.util.UUID;

public interface PortalGuestRepository extends JpaRepository<PortalGuest, UUID> {
    Optional<PortalGuest> findByEmail(String email);
    boolean existsByEmail(String email);
}
