package com.quantumclk.erp;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

/**
 * Golden Hills Resort ERP — modular monolith entry point (ADR-001).
 * SOW modules live in sub-packages (erp02 booking, erp03 front-office, …);
 * each package owns its tables and exposes versioned REST resources.
 */
@SpringBootApplication
public class ErpApplication {

  public static void main(String[] args) {
    SpringApplication.run(ErpApplication.class, args);
  }
}
