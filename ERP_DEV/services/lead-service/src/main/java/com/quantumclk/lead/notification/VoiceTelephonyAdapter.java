package com.quantumclk.lead.notification;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

@Component
public class VoiceTelephonyAdapter {
    private static final Logger log = LoggerFactory.getLogger(VoiceTelephonyAdapter.class);

    @Value("${app.notification.sales-executive-phone:+91-9876543210}")
    private String salesExecutivePhone;

    @Value("${app.notification.voice-escalation-enabled:true}")
    private boolean enabled;

    private final List<DispatchedCall> dispatchedCalls = Collections.synchronizedList(new ArrayList<>());

    public record DispatchedCall(
        String destinationPhone,
        String leadReference,
        long overdueSeconds,
        String ttsScript,
        OffsetDateTime placedAt
    ) {}

    public boolean placeEscalationCall(String leadRef, String guestName, long overdueSeconds) {
        if (!enabled) {
            log.info("[VOICE MOCK] Voice escalation disabled; skipping call for lead {}", leadRef);
            return false;
        }

        String ttsScript = String.format(
            "Hello Sales Executive, this is Golden Hills Resort automated alert system. " +
            "You have an unacknowledged guest inquiry %s from %s waiting for more than 5 minutes. " +
            "Please open your ERP dashboard and attend to the guest immediately.",
            leadRef, guestName
        );

        log.warn("🚨 [VOICE CALL MOCK PLACED] >>> Dialing: {} | Lead: {} | Overdue: {}s", salesExecutivePhone, leadRef, overdueSeconds);
        log.warn("🔊 [VOICE TTS AUDIO]: \"{}\"", ttsScript);

        dispatchedCalls.add(new DispatchedCall(salesExecutivePhone, leadRef, overdueSeconds, ttsScript, OffsetDateTime.now()));
        return true;
    }

    public List<DispatchedCall> getDispatchedCalls() {
        return Collections.unmodifiableList(new ArrayList<>(dispatchedCalls));
    }

    public void clearHistory() {
        dispatchedCalls.clear();
    }
}
