package com.quantumclk.erp.ops;

import java.util.List;
import java.util.Map;

/** Stable, secret-free JSON shapes for the read-only ops console. */
public final class OpsDtos {

  private OpsDtos() {}

  public record OpsStatusResponse(
      String generatedAt,
      String state,
      String environment,
      ServiceStatus service,
      TelemetryStatus telemetry,
      Map<String, String> links) {}

  public record ServiceStatus(
      String name,
      String version,
      String state,
      String observedAt,
      long uptimeSeconds,
      DatabaseStatus database) {}

  public record DatabaseStatus(String state, long latencyMs) {}

  public record TelemetryStatus(
      boolean configured,
      boolean stale,
      String lastCheckedAt,
      List<SourceStatus> sources) {}

  public record SourceStatus(
      String id,
      String state,
      boolean configured,
      String observedAt,
      String lastSuccessAt,
      String detail) {}

  public record OpsFlagsResponse(String generatedAt, List<FlagDto> items) {}

  public record FlagDto(
      String key, String value, String type, String updatedBy, String updatedAt) {}

  public record OpsAuditPage(
      List<AuditDto> items, int page, int size, long total, int totalPages) {}

  public record AuditDto(
      String id,
      String actor,
      String action,
      String objectType,
      String objectId,
      String before,
      String after,
      String reason,
      String createdAt) {}
}
