package com.quantumclk.lead.web;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.quantumclk.lead.notification.WhatsAppNotificationService;
import com.quantumclk.lead.notification.WhatsAppProperties;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.security.GeneralSecurityException;
import java.security.MessageDigest;
import java.util.HexFormat;

/** Meta WhatsApp webhook: subscription check (GET) and signed delivery-status events (POST). */
@RestController
@RequestMapping("/api/v1/webhooks/whatsapp")
public class WhatsAppWebhookController {

    private static final ObjectMapper JSON = new ObjectMapper();

    private final WhatsAppProperties props;
    private final WhatsAppNotificationService notifications;

    public WhatsAppWebhookController(WhatsAppProperties props, WhatsAppNotificationService notifications) {
        this.props = props;
        this.notifications = notifications;
    }

    @GetMapping(produces = MediaType.TEXT_PLAIN_VALUE)
    public ResponseEntity<String> verify(
        @RequestParam(name = "hub.mode", required = false) String mode,
        @RequestParam(name = "hub.verify_token", required = false) String token,
        @RequestParam(name = "hub.challenge", required = false) String challenge
    ) {
        if ("subscribe".equals(mode) && challenge != null && constantTimeEquals(props.verifyToken(), token)) {
            return ResponseEntity.ok(challenge);
        }
        return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
    }

    @PostMapping
    public ResponseEntity<Void> receive(
        @RequestBody(required = false) byte[] body,
        @RequestHeader(name = "X-Hub-Signature-256", required = false) String signature
    ) {
        if (!validSignature(props.appSecret(), body, signature)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        JsonNode root;
        try {
            root = JSON.readTree(body);
        } catch (IOException e) {
            return ResponseEntity.badRequest().build();
        }
        for (JsonNode entry : root.path("entry")) {
            for (JsonNode change : entry.path("changes")) {
                for (JsonNode status : change.path("value").path("statuses")) {
                    JsonNode error = status.path("errors").path(0);
                    notifications.applyStatus(
                        status.path("id").asText(),
                        status.path("status").asText(),
                        error.isMissingNode() ? null : error.path("code").asText(),
                        error.isMissingNode() ? null : error.path("title").asText()
                    );
                }
            }
        }
        return ResponseEntity.ok().build();
    }

    /** X-Hub-Signature-256 = "sha256=" + hex(HMAC-SHA256(app secret, raw body)). */
    static boolean validSignature(String appSecret, byte[] body, String header) {
        if (appSecret == null || appSecret.isBlank() || body == null || header == null || !header.startsWith("sha256=")) {
            return false;
        }
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(appSecret.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
            String expected = "sha256=" + HexFormat.of().formatHex(mac.doFinal(body));
            return MessageDigest.isEqual(expected.getBytes(StandardCharsets.UTF_8), header.toLowerCase().getBytes(StandardCharsets.UTF_8));
        } catch (GeneralSecurityException e) {
            return false;
        }
    }

    private static boolean constantTimeEquals(String expected, String given) {
        if (expected == null || expected.isBlank() || given == null) {
            return false;
        }
        return MessageDigest.isEqual(expected.getBytes(StandardCharsets.UTF_8), given.getBytes(StandardCharsets.UTF_8));
    }
}
