package com.quantumclk.erp.ops;

import com.quantumclk.erp.ops.OpsDtos.DatabaseStatus;
import com.quantumclk.erp.ops.OpsDtos.OpsStatusResponse;
import com.quantumclk.erp.ops.OpsDtos.ServiceStatus;
import com.quantumclk.erp.ops.OpsDtos.SourceStatus;
import com.quantumclk.erp.ops.OpsDtos.TelemetryStatus;
import java.lang.management.ManagementFactory;
import java.net.URI;
import java.sql.Connection;
import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import javax.sql.DataSource;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

/** Performs bounded, read-only health checks; never mutates telemetry systems. */
@Service
public class OpsTelemetryService {

  private final OpsProperties properties;
  private final DataSource dataSource;
  private final RestClient client;
  private final Map<String, Instant> lastSuccess = new ConcurrentHashMap<>();

  private final String appName;
  private final String appVersion;

  public OpsTelemetryService(
      OpsProperties properties,
      DataSource dataSource,
      @Value("${spring.application.name:erp-app}") String appName,
      @Value("${APP_VERSION:dev}") String appVersion) {
    this.properties = properties;
    this.dataSource = dataSource;
    this.appName = appName;
    this.appVersion = appVersion;
    SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
    int timeout = (int) Math.max(250, properties.getIntegrationTimeoutMs());
    factory.setConnectTimeout(timeout);
    factory.setReadTimeout(timeout);
    this.client = RestClient.builder().requestFactory(factory).build();
  }

  public OpsStatusResponse status() {
    Instant now = Instant.now();
    ServiceStatus service = serviceStatus(now);
    TelemetryStatus telemetry = telemetry();
    boolean degraded =
        telemetry.configured()
            && telemetry.sources().stream().anyMatch(s -> !"UP".equals(s.state()));
    String state = "UP".equals(service.state()) ? (degraded ? "DEGRADED" : "OK") : "DOWN";

    Map<String, String> links = new LinkedHashMap<>();
    putLink(links, "grafana", properties.getGrafanaUrl());
    putLink(links, "prometheus", properties.getPrometheusUrl());
    putLink(links, "loki", properties.getLokiUrl());
    putLink(links, "tempo", properties.getTempoUrl());

    return new OpsStatusResponse(
        now.toString(), state, properties.getEnvironment(), service, telemetry, links);
  }

  public TelemetryStatus telemetry() {
    Instant checkedAt = Instant.now();
    List<SourceStatus> sources = new ArrayList<>();
    sources.add(check("prometheus", "OPS_PROMETHEUS_URL", properties.getPrometheusUrl(), "/-/ready"));
    sources.add(check("loki", "OPS_LOKI_URL", properties.getLokiUrl(), "/ready"));
    sources.add(check("tempo", "OPS_TEMPO_URL", properties.getTempoUrl(), "/ready"));
    sources.add(check("grafana", "OPS_GRAFANA_URL", properties.getGrafanaUrl(), "/api/health"));
    boolean configured = sources.stream().anyMatch(SourceStatus::configured);
    boolean stale =
        configured
            && sources.stream()
                .filter(SourceStatus::configured)
                .anyMatch(
                    s ->
                        s.lastSuccessAt() == null
                            || Duration.between(Instant.parse(s.lastSuccessAt()), checkedAt)
                                    .getSeconds()
                                > properties.getTelemetryStaleSeconds());
    return new TelemetryStatus(configured, stale, checkedAt.toString(), sources);
  }

  private SourceStatus check(String id, String envName, String configuredUrl, String path) {
    Instant observedAt = Instant.now();
    String url = configuredUrl == null ? "" : configuredUrl.trim();
    if (url.isEmpty()) {
      return new SourceStatus(
          id, "NOT_CONFIGURED", false, observedAt.toString(), null, "Set " + envName);
    }
    try {
      client.get().uri(URI.create(stripTrailingSlash(url) + path)).retrieve().toBodilessEntity();
      Instant success = Instant.now();
      lastSuccess.put(id, success);
      return new SourceStatus(
          id, "UP", true, observedAt.toString(), success.toString(), "Health check passed");
    } catch (org.springframework.web.client.RestClientResponseException ex) {
      return new SourceStatus(
          id,
          "UNAVAILABLE",
          true,
          observedAt.toString(),
          lastSuccess(id),
          "Health check returned HTTP " + ex.getStatusCode().value());
    } catch (RuntimeException ex) {
      return new SourceStatus(
          id, "UNAVAILABLE", true, observedAt.toString(), lastSuccess(id), "Health check failed");
    }
  }

  private String lastSuccess(String id) {
    Instant instant = lastSuccess.get(id);
    return instant == null ? null : instant.toString();
  }

  private ServiceStatus serviceStatus(Instant observedAt) {
    long start = System.nanoTime();
    String state = "UP";
    try (Connection connection = dataSource.getConnection()) {
      if (!connection.isValid(2)) {
        state = "DOWN";
      }
    } catch (Exception ex) {
      state = "DOWN";
    }
    long latencyMs = Math.max(0, (System.nanoTime() - start) / 1_000_000);
    return new ServiceStatus(
        appName,
        appVersion,
        state,
        observedAt.toString(),
        ManagementFactory.getRuntimeMXBean().getUptime() / 1000,
        new DatabaseStatus(state, latencyMs));
  }

  private static void putLink(Map<String, String> links, String name, String url) {
    if (url != null && !url.isBlank()) {
      links.put(name, stripTrailingSlash(url.trim()));
    }
  }

  private static String stripTrailingSlash(String value) {
    return value.endsWith("/") ? value.substring(0, value.length() - 1) : value;
  }
}
