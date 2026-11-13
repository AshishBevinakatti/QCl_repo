package com.quantumclk.lead.service;

import com.quantumclk.lead.domain.Lead;
import com.quantumclk.lead.domain.LeadActivity;
import com.quantumclk.lead.notification.VoiceTelephonyAdapter;
import com.quantumclk.lead.repository.LeadActivityRepository;
import com.quantumclk.lead.repository.LeadRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

@Service
public class SlaEscalationScheduler {

    private static final Logger log = LoggerFactory.getLogger(SlaEscalationScheduler.class);

    private final LeadRepository leadRepository;
    private final LeadActivityRepository activityRepository;
    private final VoiceTelephonyAdapter voiceAdapter;

    public SlaEscalationScheduler(
        LeadRepository leadRepository,
        LeadActivityRepository activityRepository,
        VoiceTelephonyAdapter voiceAdapter
    ) {
        this.leadRepository = leadRepository;
        this.activityRepository = activityRepository;
        this.voiceAdapter = voiceAdapter;
    }

    @Scheduled(fixedDelayString = "${app.sla.scheduler-interval-ms:10000}")
    @Transactional
    public void checkAndEscalateOverdueLeads() {
        OffsetDateTime now = OffsetDateTime.now();
        List<Lead> overdueLeads = leadRepository.findPendingVoiceEscalations(now);

        if (overdueLeads.isEmpty()) {
            return;
        }

        log.info("Found {} unattended leads exceeding the 5-minute SLA. Triggering voice escalation...", overdueLeads.size());

        for (Lead lead : overdueLeads) {
            long overdueSeconds = Duration.between(lead.getSlaDeadline(), now).toSeconds();
            lead.setSlaBreached(true);
            lead.setVoiceEscalationTriggered(true);
            lead.setUpdatedAt(now);
            leadRepository.save(lead);

            // Record escalation activity
            LeadActivity act = new LeadActivity(
                UUID.randomUUID(),
                lead,
                "SYSTEM_SLA_WATCHER",
                "VOICE_ESCALATION",
                "Lead unacknowledged after 5 minutes (overdue by " + overdueSeconds + "s). Automated voice phone call placed to Sales Executive.",
                now
            );
            activityRepository.save(act);

            // Place phone call via voice adapter
            voiceAdapter.placeEscalationCall(lead.getPublicReference(), lead.getName(), overdueSeconds);
        }
    }
}
