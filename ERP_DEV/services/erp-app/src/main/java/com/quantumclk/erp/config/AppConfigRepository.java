package com.quantumclk.erp.config;

import org.springframework.data.jpa.repository.JpaRepository;

/** Config reads/writes (writes are SUPERADMIN-only + audited in the controller). */
public interface AppConfigRepository extends JpaRepository<AppConfig, String> {}
