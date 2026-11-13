package com.quantumclk.lead;

import com.quantumclk.lead.domain.NotificationStatus;
import com.quantumclk.lead.domain.WhatsAppNotification;
import com.quantumclk.lead.dto.InquiryDtos.CreateInquiryRequest;
import com.quantumclk.lead.notification.MockWhatsAppSender;
import com.quantumclk.lead.notification.StaffDirectory;
import com.quantumclk.lead.notification.StaffDirectory.StaffContact;
import com.quantumclk.lead.notification.WhatsAppNotificationService;
import com.quantumclk.lead.notification.WhatsAppSendException;
import com.quantumclk.lead.repository.LeadRepository;
import com.quantumclk.lead.repository.WhatsAppNotificationRepository;
import com.quantumclk.lead.service.LeadService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Primary;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.web.client.RestClient;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.HexFormat;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class WhatsAppIntegrationTest {

    private static final String APP_SECRET = "test-app-secret";
    private static final StaffContact PRIYA = new StaffContact("sales-staff", "Priya Rao", "+91 98765 43210");

    @Autowired private MockMvc mvc;
    @Autowired private LeadService leadService;
    @Autowired private LeadRepository leadRepository;
    @Autowired private WhatsAppNotificationRepository notifications;
    @Autowired private WhatsAppNotificationService whatsApp;
    @Autowired private SwitchableSender sender;
    @Autowired private FakeStaffDirectory staff;

    /** Hand-written doubles: Mockito's Byte Buddy cannot instrument classes on JDK 25. */
    @TestConfiguration
    static class Doubles {
        @Bean @Primary SwitchableSender switchableSender() { return new SwitchableSender(); }
        @Bean @Primary FakeStaffDirectory fakeStaffDirectory() { return new FakeStaffDirectory(); }
    }

    static class SwitchableSender extends MockWhatsAppSender {
        WhatsAppSendException failWith;

        @Override
        public String send(String to, String templateName, String language, List<String> vars) {
            if (failWith != null) {
                throw failWith;
            }
            return super.send(to, templateName, language, vars);
        }
    }

    static class FakeStaffDirectory extends StaffDirectory {
        List<StaffContact> onDuty = List.of();

        FakeStaffDirectory() {
            super(RestClient.builder(), "http://unused", "resort", "lead-service", "unused");
        }

        @Override public boolean configured() { return true; }
        @Override public List<StaffContact> onDutySalesStaff() { return onDuty; }
        @Override public Optional<StaffContact> findByUsername(String username) {
            return onDuty.stream().filter(c -> c.username().equals(username)).findFirst();
        }
    }

    @BeforeEach
    void setUp() {
        leadRepository.deleteAll();
        sender.clearHistory();
        sender.failWith = null;
        staff.onDuty = List.of(PRIYA);
    }

    @Test
    void newLeadQueuesAlertAndDispatchSendsTemplate() {
        UUID leadId = createLead();

        WhatsAppNotification queued = onlyRow(leadId);
        assertEquals(NotificationStatus.PENDING, queued.getStatus());
        assertEquals("+91******3210", queued.getRecipientPhoneMasked());

        whatsApp.dispatchDue();

        WhatsAppNotification sent = onlyRow(leadId);
        assertEquals(NotificationStatus.ACCEPTED, sent.getStatus(), "API acceptance is not delivery");
        assertTrue(sent.getWaMessageId().startsWith("wamid.mock-"));
        MockWhatsAppSender.DispatchedMessage msg = sender.getDispatchedMessages().get(0);
        assertEquals("919876543210", msg.to());
        assertEquals("new_lead_assigned", msg.templateName());
        String ref = leadRepository.findById(leadId).orElseThrow().getPublicReference();
        assertEquals(List.of("Priya Rao", "Vikram Malhotra", "+91-9123456789", "Luxury Pool Villa", ref), msg.bodyVariables());
    }

    @Test
    void noOnDutyStaffSendsNothingAndNotesTheLead() {
        staff.onDuty = List.of();
        UUID leadId = createLead();

        assertTrue(notifications.findByLeadId(leadId).isEmpty());
        assertTrue(hasActivity(leadId, "WHATSAPP_SKIPPED", "no on-duty sales staff"));
    }

    @Test
    void invalidRecipientNumberIsNeverQueued() {
        staff.onDuty = List.of(new StaffContact("sales-staff", "Priya", "12ab"));
        UUID leadId = createLead();

        assertTrue(notifications.findByLeadId(leadId).isEmpty());
        assertTrue(hasActivity(leadId, "WHATSAPP_SKIPPED", "invalid phone number"));
    }

    @Test
    void sameLeadEventTwiceQueuesOneMessage() {
        UUID leadId = createLead();
        whatsApp.queueNewLeadAlerts(leadRepository.findById(leadId).orElseThrow());

        assertEquals(1, notifications.findByLeadId(leadId).size());
    }

    @Test
    void temporaryFailureRetriesThenFailsAfterMaxAttempts() {
        sender.failWith = new WhatsAppSendException(true, "META_131000", "HTTP 500");
        UUID leadId = createLead();

        whatsApp.dispatchDue();
        WhatsAppNotification afterFirst = onlyRow(leadId);
        assertEquals(NotificationStatus.PENDING, afterFirst.getStatus());
        assertEquals(1, afterFirst.getAttempts());
        assertTrue(afterFirst.getNextAttemptAt().isAfter(OffsetDateTime.now()));

        for (int i = 0; i < 2; i++) {
            WhatsAppNotification n = onlyRow(leadId);
            n.setNextAttemptAt(OffsetDateTime.now().minusSeconds(1));
            notifications.save(n);
            whatsApp.dispatchDue();
        }

        WhatsAppNotification failed = onlyRow(leadId);
        assertEquals(NotificationStatus.FAILED, failed.getStatus());
        assertEquals(3, failed.getAttempts());
        assertEquals("META_131000", failed.getErrorCode());
        assertTrue(hasActivity(leadId, "WHATSAPP_FAILED", "META_131000"));
    }

    @Test
    void authFailureFailsImmediatelyWithoutRetry() {
        sender.failWith = new WhatsAppSendException(false, "META_190", "HTTP 401 OAuthException: token expired");
        UUID leadId = createLead();

        whatsApp.dispatchDue();

        WhatsAppNotification n = onlyRow(leadId);
        assertEquals(NotificationStatus.FAILED, n.getStatus());
        assertEquals(1, n.getAttempts());
        assertEquals("META_190", n.getErrorCode());
    }

    @Test
    void deliveredWebhookMovesStatusForwardAndIgnoresDuplicatesAndOutOfOrder() throws Exception {
        String wamid = sentMessageId();

        postWebhook(statusPayload(wamid, "delivered", null)).andExpect(status().isOk());
        assertEquals(NotificationStatus.DELIVERED, notifications.findByWaMessageId(wamid).orElseThrow().getStatus());

        postWebhook(statusPayload(wamid, "delivered", null)).andExpect(status().isOk());
        postWebhook(statusPayload(wamid, "sent", null)).andExpect(status().isOk());
        assertEquals(NotificationStatus.DELIVERED, notifications.findByWaMessageId(wamid).orElseThrow().getStatus());

        postWebhook(statusPayload(wamid, "read", null)).andExpect(status().isOk());
        assertEquals(NotificationStatus.READ, notifications.findByWaMessageId(wamid).orElseThrow().getStatus());
    }

    @Test
    void failedWebhookStoresMetaError() throws Exception {
        String wamid = sentMessageId();

        postWebhook(statusPayload(wamid, "failed", "131026")).andExpect(status().isOk());

        WhatsAppNotification n = notifications.findByWaMessageId(wamid).orElseThrow();
        assertEquals(NotificationStatus.FAILED, n.getStatus());
        assertEquals("META_131026", n.getErrorCode());
    }

    @Test
    void invalidOrMissingSignatureIsRejected() throws Exception {
        String wamid = sentMessageId();
        String body = statusPayload(wamid, "delivered", null);

        mvc.perform(post("/api/v1/webhooks/whatsapp").contentType(MediaType.APPLICATION_JSON).content(body)
                .header("X-Hub-Signature-256", "sha256=" + "0".repeat(64)))
            .andExpect(status().isUnauthorized());
        mvc.perform(post("/api/v1/webhooks/whatsapp").contentType(MediaType.APPLICATION_JSON).content(body))
            .andExpect(status().isUnauthorized());

        assertEquals(NotificationStatus.ACCEPTED, notifications.findByWaMessageId(wamid).orElseThrow().getStatus());
    }

    @Test
    void unknownMessageIdIsAcknowledgedAndIgnored() throws Exception {
        postWebhook(statusPayload("wamid.unknown", "delivered", null)).andExpect(status().isOk());
    }

    @Test
    void subscriptionCheckEchoesChallengeOnlyForTheRightToken() throws Exception {
        mvc.perform(get("/api/v1/webhooks/whatsapp")
                .param("hub.mode", "subscribe").param("hub.verify_token", "test-verify-token").param("hub.challenge", "12345"))
            .andExpect(status().isOk())
            .andExpect(content().string("12345"));
        mvc.perform(get("/api/v1/webhooks/whatsapp")
                .param("hub.mode", "subscribe").param("hub.verify_token", "wrong").param("hub.challenge", "12345"))
            .andExpect(status().isForbidden());
    }

    private UUID createLead() {
        return leadService.createInquiry(new CreateInquiryRequest(
            "Vikram Malhotra", "vikram@example.com", "+91-9123456789",
            LocalDate.now().plusDays(5), LocalDate.now().plusDays(7),
            "Luxury Pool Villa", 2, "Anniversary"), null).id();
    }

    private String sentMessageId() {
        UUID leadId = createLead();
        whatsApp.dispatchDue();
        return onlyRow(leadId).getWaMessageId();
    }

    private WhatsAppNotification onlyRow(UUID leadId) {
        List<WhatsAppNotification> rows = notifications.findByLeadId(leadId);
        assertEquals(1, rows.size());
        return rows.get(0);
    }

    private boolean hasActivity(UUID leadId, String type, String text) {
        return leadService.getLeadDetail(leadId).activities().stream()
            .anyMatch(a -> a.activityType().equals(type) && a.description().contains(text));
    }

    private org.springframework.test.web.servlet.ResultActions postWebhook(String body) throws Exception {
        return mvc.perform(post("/api/v1/webhooks/whatsapp")
            .contentType(MediaType.APPLICATION_JSON)
            .content(body)
            .header("X-Hub-Signature-256", sign(body)));
    }

    private static String statusPayload(String wamid, String status, String errorCode) {
        String errors = errorCode == null ? "" :
            ",\"errors\":[{\"code\":" + errorCode + ",\"title\":\"Recipient not available\"}]";
        return "{\"object\":\"whatsapp_business_account\",\"entry\":[{\"id\":\"1\",\"changes\":[{\"field\":\"messages\","
            + "\"value\":{\"messaging_product\":\"whatsapp\",\"statuses\":[{\"id\":\"" + wamid + "\",\"status\":\"" + status
            + "\",\"timestamp\":\"1700000000\",\"recipient_id\":\"919876543210\"" + errors + "}]}}]}]}";
    }

    private static String sign(String body) throws Exception {
        Mac mac = Mac.getInstance("HmacSHA256");
        mac.init(new SecretKeySpec(APP_SECRET.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
        return "sha256=" + HexFormat.of().formatHex(mac.doFinal(body.getBytes(StandardCharsets.UTF_8)));
    }
}
