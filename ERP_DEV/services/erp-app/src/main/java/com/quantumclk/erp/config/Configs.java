package com.quantumclk.erp.config;

import org.springframework.stereotype.Service;

/**
 * Typed reads over `app_config` with safe fallbacks (used when a key was
 * never seeded — the default always mirrors the Phase 1 `[ASSUMED]` value).
 */
@Service
public class Configs {

  private final AppConfigRepository repository;

  public Configs(AppConfigRepository repository) {
    this.repository = repository;
  }

  public String get(String key, String fallback) {
    return repository.findById(key).map(AppConfig::getValue).orElse(fallback);
  }

  public int getInt(String key, int fallback) {
    try {
      return Integer.parseInt(get(key, String.valueOf(fallback)).trim());
    } catch (NumberFormatException e) {
      return fallback;
    }
  }
}
