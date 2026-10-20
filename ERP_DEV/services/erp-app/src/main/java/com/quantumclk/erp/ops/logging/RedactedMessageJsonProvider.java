package com.quantumclk.erp.ops.logging;

import ch.qos.logback.classic.spi.ILoggingEvent;
import com.fasterxml.jackson.core.JsonGenerator;
import java.io.IOException;
import net.logstash.logback.composite.loggingevent.MessageJsonProvider;

/** JSON message provider that applies the shared redaction rules. */
public class RedactedMessageJsonProvider extends MessageJsonProvider {

  public RedactedMessageJsonProvider() {
    setFieldName("message");
  }

  @Override
  public void writeTo(JsonGenerator generator, ILoggingEvent event) throws IOException {
    generator.writeStringField(getFieldName(), LogRedactor.redact(event.getFormattedMessage()));
  }
}
