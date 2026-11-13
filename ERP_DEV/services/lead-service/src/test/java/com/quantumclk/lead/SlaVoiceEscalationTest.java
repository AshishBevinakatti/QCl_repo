package com.quantumclk.lead;

import com.quantumclk.lead.domain.Lead;
import com.quantumclk.lead.domain.LeadStatus;
import com.quantumclk.lead.notification.VoiceTelephonyAdapter;
import com.quantumclk.lead.repository.LeadRepository;
import com.quantumclk.lead.service.SlaEscalationScheduler;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
public class SlaVoiceEscalationTest {

    @Autowired
    private LeadRepository leadRepository;

    @Autowired
    private SlaEscalationScheduler scheduler;

    @Autowired
    private VoiceTelephonyAdapter voiceAdapter;

    @BeforeEach
    void setUp() {
        voiceAdapter.clearHistory();
    }

    @Test
    void unattendedLeadTriggersVoicePhoneCallEscalation() {
        // Setup a lead whose 5-minute SLA expired 6 minutes ago
        UUID leadId = UUID.randomUUID();
        OffsetDateTime now = OffsetDateTime.now();
        OffsetDateTime expiredDeadline = now.minusMinutes(6);

        Lead overdueLead = new Lead();
        overdueLead.setId(leadId);
        overdueLead.setPublicReference("GHR-998877");
        overdueLead.setName("Arjun Kapoor");
        overdueLead.setEmail("arjun@example.com");
        overdueLead.setPhone("+91-9988776655");
        overdueLead.setCheckinDate(LocalDate.now().plusDays(2));
        overdueLead.setCheckoutDate(LocalDate.now().plusDays(4));
        overdueLead.setRoomCategory("Hill View Cottage");
        overdueLead.setGuestCount(2);
        overdueLead.setStatus(LeadStatus.NEW);
        overdueLead.setSlaDeadline(expiredDeadline);
        overdueLead.setSlaBreached(false);
        overdueLead.setVoiceEscalationTriggered(false);
        overdueLead.setCreatedAt(now.minusMinutes(11));
        overdueLead.setUpdatedAt(now.minusMinutes(11));

        leadRepository.saveAndFlush(overdueLead);

        // Run the scheduler check
        scheduler.checkAndEscalateOverdueLeads();

        // Verify lead updated
        Lead updated = leadRepository.findById(leadId).orElseThrow();
        assertTrue(updated.isSlaBreached(), "Lead should be flagged as SLA breached");
        assertTrue(updated.isVoiceEscalationTriggered(), "Voice escalation should be triggered");

        // Verify voice call placed via adapter
        assertEquals(1, voiceAdapter.getDispatchedCalls().size(), "One phone call should be placed");
        VoiceTelephonyAdapter.DispatchedCall call = voiceAdapter.getDispatchedCalls().get(0);
        assertEquals("GHR-998877", call.leadReference());
        assertTrue(call.ttsScript().contains("unacknowledged guest inquiry GHR-998877 from Arjun Kapoor"));
    }
}
