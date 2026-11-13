package com.quantumclk.lead.notification;

import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.boot.web.client.RestClientCustomizer;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.web.client.RestClient;

@Configuration
@EnableConfigurationProperties(WhatsAppProperties.class)
public class WhatsAppConfig {

    /** Timeouts for every outbound RestClient (Meta, Keycloak). */
    @Bean
    public RestClientCustomizer outboundTimeouts() {
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(5_000);
        factory.setReadTimeout(10_000);
        return builder -> builder.requestFactory(factory);
    }

    @Bean
    @ConditionalOnProperty(name = "app.whatsapp.provider", havingValue = "meta")
    public WhatsAppSender metaWhatsAppSender(WhatsAppProperties props, RestClient.Builder builder) {
        props.requireMetaConfig();
        return new MetaWhatsAppSender(builder.baseUrl(props.graphBaseUrl()).build(), props);
    }

    @Bean
    @ConditionalOnProperty(name = "app.whatsapp.provider", havingValue = "mock", matchIfMissing = true)
    public WhatsAppSender mockWhatsAppSender() {
        return new MockWhatsAppSender();
    }
}
