package com.quantumclk.lead.notification;

import org.springframework.boot.context.properties.ConfigurationProperties;

import java.util.ArrayList;
import java.util.List;

@ConfigurationProperties(prefix = "app.whatsapp")
public record WhatsAppProperties(
    boolean enabled,
    String provider,
    String graphBaseUrl,
    String apiVersion,
    String phoneNumberId,
    String accessToken,
    String appSecret,
    String verifyToken,
    String templateName,
    String templateLanguage
) {

    /** Fails startup with the names (never the values) of missing settings. */
    public void requireMetaConfig() {
        List<String> missing = new ArrayList<>();
        if (isBlank(apiVersion)) missing.add("WHATSAPP_API_VERSION");
        if (isBlank(phoneNumberId)) missing.add("WHATSAPP_PHONE_NUMBER_ID");
        if (isBlank(accessToken)) missing.add("WHATSAPP_ACCESS_TOKEN");
        if (isBlank(appSecret)) missing.add("WHATSAPP_APP_SECRET");
        if (isBlank(verifyToken)) missing.add("WHATSAPP_VERIFY_TOKEN");
        if (isBlank(templateName)) missing.add("WHATSAPP_TEMPLATE_NAME");
        if (isBlank(templateLanguage)) missing.add("WHATSAPP_TEMPLATE_LANGUAGE");
        if (!missing.isEmpty()) {
            throw new IllegalStateException("WHATSAPP_PROVIDER=meta but these settings are missing: " + String.join(", ", missing));
        }
    }

    static boolean isBlank(String s) {
        return s == null || s.isBlank();
    }
}
