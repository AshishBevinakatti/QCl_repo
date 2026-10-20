package com.quantumclk.erp.ops.logging;

import ch.qos.logback.classic.spi.ILoggingEvent;
import com.fasterxml.jackson.core.JsonGenerator;
import java.io.IOException;
import net.logstash.logback.composite.AbstractJsonProvider;

/** Emits service and environment on every JSON log line (including startup/jobs). */
public class StaticFieldsJsonProvider extends AbstractJsonProvider<ILoggingEvent> {

  private String service = "erp-app";
  private String environment = "local";

  public void setService(String service) {
    this.service = service;
  }

  public void setEnvironment(String environment) {
    this.environment = environment;
  }

  @Override
  public void writeTo(JsonGenerator generator, ILoggingEvent event) throws IOException {
    generator.writeStringField("service", service);
    generator.writeStringField("environment", environment);
  }
}
