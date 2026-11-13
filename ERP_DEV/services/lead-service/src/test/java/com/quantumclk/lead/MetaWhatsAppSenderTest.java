package com.quantumclk.lead;

import com.quantumclk.lead.notification.MetaWhatsAppSender;
import com.quantumclk.lead.notification.PhoneNumbers;
import com.quantumclk.lead.notification.WhatsAppProperties;
import com.quantumclk.lead.notification.WhatsAppSendException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.test.web.client.MockRestServiceServer;
import org.springframework.web.client.RestClient;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.*;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withStatus;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withSuccess;

class MetaWhatsAppSenderTest {

    private static final WhatsAppProperties PROPS = new WhatsAppProperties(true, "meta", "https://graph.test",
        "v21.0", "123456", "secret-token", "app-secret", "verify", "new_lead_assigned", "en");
    private static final List<String> VARS = List.of("Priya", "Vikram", "+91-9123456789", "Pool Cottage", "GHR-123456");

    private MockRestServiceServer server;
    private MetaWhatsAppSender sender;

    @BeforeEach
    void setUp() {
        RestClient.Builder builder = RestClient.builder().baseUrl(PROPS.graphBaseUrl());
        server = MockRestServiceServer.bindTo(builder).build();
        sender = new MetaWhatsAppSender(builder.build(), PROPS);
    }

    @Test
    void sendsTemplateAndReturnsMessageId() {
        server.expect(requestTo("https://graph.test/v21.0/123456/messages"))
            .andExpect(method(HttpMethod.POST))
            .andExpect(header("Authorization", "Bearer secret-token"))
            .andExpect(jsonPath("$.messaging_product").value("whatsapp"))
            .andExpect(jsonPath("$.to").value("919876543210"))
            .andExpect(jsonPath("$.template.name").value("new_lead_assigned"))
            .andExpect(jsonPath("$.template.language.code").value("en"))
            .andExpect(jsonPath("$.template.components[0].parameters[4].text").value("GHR-123456"))
            .andRespond(withSuccess("{\"messaging_product\":\"whatsapp\",\"contacts\":[{\"input\":\"919876543210\",\"wa_id\":\"919876543210\"}],"
                + "\"messages\":[{\"id\":\"wamid.HBgM123\"}]}", MediaType.APPLICATION_JSON));

        assertEquals("wamid.HBgM123", sender.send("919876543210", "new_lead_assigned", "en", VARS));
        server.verify();
    }

    @Test
    void authFailureIsPermanent() {
        server.expect(requestTo("https://graph.test/v21.0/123456/messages"))
            .andRespond(withStatus(HttpStatus.UNAUTHORIZED).contentType(MediaType.APPLICATION_JSON)
                .body("{\"error\":{\"message\":\"Error validating access token\",\"type\":\"OAuthException\",\"code\":190,\"fbtrace_id\":\"x\"}}"));

        WhatsAppSendException e = assertThrows(WhatsAppSendException.class,
            () -> sender.send("919876543210", "new_lead_assigned", "en", VARS));
        assertFalse(e.retryable());
        assertEquals("META_190", e.code());
        assertFalse(e.getMessage().contains("secret-token"));
    }

    @Test
    void serverErrorIsRetryable() {
        server.expect(requestTo("https://graph.test/v21.0/123456/messages"))
            .andRespond(withStatus(HttpStatus.INTERNAL_SERVER_ERROR).contentType(MediaType.APPLICATION_JSON)
                .body("{\"error\":{\"message\":\"Service temporarily unavailable\",\"type\":\"OAuthException\",\"code\":131000}}"));

        WhatsAppSendException e = assertThrows(WhatsAppSendException.class,
            () -> sender.send("919876543210", "new_lead_assigned", "en", VARS));
        assertTrue(e.retryable());
        assertEquals("META_131000", e.code());
    }

    @Test
    void templateNotApprovedIsPermanent() {
        server.expect(requestTo("https://graph.test/v21.0/123456/messages"))
            .andRespond(withStatus(HttpStatus.BAD_REQUEST).contentType(MediaType.APPLICATION_JSON)
                .body("{\"error\":{\"message\":\"Template name does not exist in the translation\",\"type\":\"OAuthException\",\"code\":132001}}"));

        WhatsAppSendException e = assertThrows(WhatsAppSendException.class,
            () -> sender.send("919876543210", "new_lead_assigned", "en", VARS));
        assertFalse(e.retryable());
        assertEquals("META_132001", e.code());
    }

    @Test
    void missingMetaConfigFailsWithNamesOnly() {
        WhatsAppProperties incomplete = new WhatsAppProperties(true, "meta", "https://graph.test",
            "v21.0", "", null, "app-secret", "", "new_lead_assigned", "en");

        IllegalStateException e = assertThrows(IllegalStateException.class, incomplete::requireMetaConfig);
        assertTrue(e.getMessage().contains("WHATSAPP_PHONE_NUMBER_ID"));
        assertTrue(e.getMessage().contains("WHATSAPP_ACCESS_TOKEN"));
        assertTrue(e.getMessage().contains("WHATSAPP_VERIFY_TOKEN"));
        assertFalse(e.getMessage().contains("app-secret"));
    }

    @Test
    void phoneNumbersAreNormalizedAndMasked() {
        assertEquals("919876543210", PhoneNumbers.normalize("+91 98765-43210"));
        assertNull(PhoneNumbers.normalize("12ab"));
        assertNull(PhoneNumbers.normalize("0919876543210"));
        assertNull(PhoneNumbers.normalize(null));
        assertEquals("+91******3210", PhoneNumbers.mask("919876543210"));
    }
}
