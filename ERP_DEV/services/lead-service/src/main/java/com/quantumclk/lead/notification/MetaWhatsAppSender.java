package com.quantumclk.lead.notification;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.MissingNode;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestClient;

import java.io.IOException;
import java.io.InputStream;
import java.util.List;
import java.util.Map;

/** Meta WhatsApp Cloud API: POST /{version}/{phone-number-id}/messages with a template. */
public class MetaWhatsAppSender implements WhatsAppSender {

    private static final ObjectMapper JSON = new ObjectMapper();

    private final RestClient http;
    private final WhatsAppProperties props;

    public MetaWhatsAppSender(RestClient http, WhatsAppProperties props) {
        this.http = http;
        this.props = props;
    }

    @Override
    public String providerName() {
        return "META";
    }

    @Override
    public String send(String to, String templateName, String language, List<String> bodyVariables) {
        Map<String, Object> body = Map.of(
            "messaging_product", "whatsapp",
            "recipient_type", "individual",
            "to", to,
            "type", "template",
            "template", Map.of(
                "name", templateName,
                "language", Map.of("code", language),
                "components", List.of(Map.of(
                    "type", "body",
                    "parameters", bodyVariables.stream().map(v -> Map.of("type", "text", "text", v)).toList()
                ))
            )
        );
        try {
            return http.post()
                .uri("/{version}/{phoneNumberId}/messages", props.apiVersion(), props.phoneNumberId())
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + props.accessToken())
                .contentType(MediaType.APPLICATION_JSON)
                .body(body)
                .exchange((req, res) -> {
                    JsonNode json = read(res.getBody());
                    int status = res.getStatusCode().value();
                    if (res.getStatusCode().is2xxSuccessful()) {
                        String id = json.path("messages").path(0).path("id").asText("");
                        if (id.isEmpty()) {
                            throw new WhatsAppSendException(false, "META_NO_MESSAGE_ID", "Meta returned 2xx without a message id");
                        }
                        return id;
                    }
                    JsonNode err = json.path("error");
                    boolean retryable = status == 429 || status >= 500;
                    String code = "META_" + err.path("code").asText(String.valueOf(status));
                    String msg = "HTTP " + status + " " + err.path("type").asText("") + ": " + err.path("message").asText("");
                    throw new WhatsAppSendException(retryable, code, msg.length() > 300 ? msg.substring(0, 300) : msg);
                });
        } catch (ResourceAccessException e) {
            throw new WhatsAppSendException(true, "META_NETWORK", "Meta API unreachable or timed out");
        }
    }

    private static JsonNode read(InputStream in) {
        try {
            JsonNode node = JSON.readTree(in);
            return node == null ? MissingNode.getInstance() : node;
        } catch (IOException e) {
            return MissingNode.getInstance();
        }
    }
}
