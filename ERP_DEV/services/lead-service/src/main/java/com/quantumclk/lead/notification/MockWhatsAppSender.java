package com.quantumclk.lead.notification;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.UUID;

/** Local/test sender: records messages in memory, never calls Meta. */
public class MockWhatsAppSender implements WhatsAppSender {

    private static final Logger log = LoggerFactory.getLogger(MockWhatsAppSender.class);

    public record DispatchedMessage(String to, String templateName, String language,
                                    List<String> bodyVariables, String messageId, OffsetDateTime sentAt) {}

    private final List<DispatchedMessage> dispatched = Collections.synchronizedList(new ArrayList<>());

    @Override
    public String providerName() {
        return "MOCK";
    }

    @Override
    public String send(String to, String templateName, String language, List<String> bodyVariables) {
        String id = "wamid.mock-" + UUID.randomUUID();
        log.info("[WHATSAPP MOCK] template={} to={} lead={} id={}",
            templateName, PhoneNumbers.mask(to), bodyVariables.get(bodyVariables.size() - 1), id);
        dispatched.add(new DispatchedMessage(to, templateName, language, List.copyOf(bodyVariables), id, OffsetDateTime.now()));
        return id;
    }

    public List<DispatchedMessage> getDispatchedMessages() {
        return List.copyOf(dispatched);
    }

    public void clearHistory() {
        dispatched.clear();
    }
}
