package com.quantumclk.erp.ops;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

/** Read-only telemetry endpoints and display metadata (never secrets). */
@Component
@ConfigurationProperties(prefix = "ops")
public class OpsProperties {

  private String environment = "local";
  private String prometheusUrl = "";
  private String lokiUrl = "";
  private String tempoUrl = "";
  private String grafanaUrl = "";
  private long integrationTimeoutMs = 2000;
  private long telemetryStaleSeconds = 120;

  public String getEnvironment() {
    return environment;
  }

  public void setEnvironment(String environment) {
    this.environment = environment;
  }

  public String getPrometheusUrl() {
    return prometheusUrl;
  }

  public void setPrometheusUrl(String prometheusUrl) {
    this.prometheusUrl = prometheusUrl;
  }

  public String getLokiUrl() {
    return lokiUrl;
  }

  public void setLokiUrl(String lokiUrl) {
    this.lokiUrl = lokiUrl;
  }

  public String getTempoUrl() {
    return tempoUrl;
  }

  public void setTempoUrl(String tempoUrl) {
    this.tempoUrl = tempoUrl;
  }

  public String getGrafanaUrl() {
    return grafanaUrl;
  }

  public void setGrafanaUrl(String grafanaUrl) {
    this.grafanaUrl = grafanaUrl;
  }

  public long getIntegrationTimeoutMs() {
    return integrationTimeoutMs;
  }

  public void setIntegrationTimeoutMs(long integrationTimeoutMs) {
    this.integrationTimeoutMs = integrationTimeoutMs;
  }

  public long getTelemetryStaleSeconds() {
    return telemetryStaleSeconds;
  }

  public void setTelemetryStaleSeconds(long telemetryStaleSeconds) {
    this.telemetryStaleSeconds = telemetryStaleSeconds;
  }
}
