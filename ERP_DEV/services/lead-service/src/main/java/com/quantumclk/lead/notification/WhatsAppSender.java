package com.quantumclk.lead.notification;

import java.util.List;

/** Provider-neutral WhatsApp template sender (integrations.md contract: send(template, to, vars)). */
public interface WhatsAppSender {

    /** Provider name stored on each notification row, e.g. MOCK or META. */
    String providerName();

    /**
     * Sends one template message.
     *
     * @param to digits-only E.164 number, no '+'
     * @return the provider message id; acceptance only, not delivery
     * @throws WhatsAppSendException on any failure
     */
    String send(String to, String templateName, String language, List<String> bodyVariables);
}
