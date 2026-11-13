package com.quantumclk.lead;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.quantumclk.lead.domain.Lead;
import com.quantumclk.lead.domain.LeadStatus;
import com.quantumclk.lead.repository.LeadRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.UUID;

import static org.hamcrest.Matchers.is;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.jwt;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
public class SalesSecurityTest {

    @Autowired
    private MockMvc mvc;

    @Autowired
    private LeadRepository leadRepository;

    private Lead testLead;

    @BeforeEach
    void setUp() {
        leadRepository.deleteAll();

        Lead lead = new Lead();
        lead.setId(UUID.randomUUID());
        lead.setPublicReference("GHR-555123");
        lead.setName("Rahul Sharma");
        lead.setEmail("rahul@example.com");
        lead.setPhone("+91-9876543210");
        lead.setCheckinDate(LocalDate.now().plusDays(3));
        lead.setCheckoutDate(LocalDate.now().plusDays(6));
        lead.setRoomCategory("Luxury Pool Villa");
        lead.setGuestCount(2);
        lead.setStatus(LeadStatus.NEW);
        lead.setPriority("MEDIUM");
        lead.setSlaDeadline(OffsetDateTime.now().plusMinutes(5));
        lead.setSlaBreached(false);
        lead.setVoiceEscalationTriggered(false);
        lead.setCreatedAt(OffsetDateTime.now());
        lead.setUpdatedAt(OffsetDateTime.now());

        testLead = leadRepository.save(lead);
    }

    @Test
    void unauthenticatedCallToSalesLeadsReturns401() throws Exception {
        mvc.perform(get("/api/v1/sales/leads"))
            .andExpect(status().isUnauthorized())
            .andExpect(jsonPath("$.code", is("AUTH_REQUIRED")));
    }

    @Test
    void unauthorizedRoleReturns403() throws Exception {
        mvc.perform(get("/api/v1/sales/leads")
                .with(jwt().authorities(new SimpleGrantedAuthority("HOUSEKEEPING"))))
            .andExpect(status().isForbidden())
            .andExpect(jsonPath("$.code", is("FORBIDDEN")));
    }

    @Test
    void salesExecRoleReturns200() throws Exception {
        mvc.perform(get("/api/v1/sales/leads")
                .with(jwt().authorities(new SimpleGrantedAuthority("SALES_EXEC"))))
            .andExpect(status().isOk());
    }

    @Test
    void claimLeadExtractsActorFromTokenPreferredUsername() throws Exception {
        mvc.perform(post("/api/v1/sales/leads/" + testLead.getId() + "/claim")
                .with(jwt()
                    .authorities(new SimpleGrantedAuthority("SALES_EXEC"))
                    .jwt(jwt -> jwt.claim("preferred_username", "priya_sales_exec"))
                )
                .contentType(MediaType.APPLICATION_JSON)
                .content("{}"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.claimedBy", is("priya_sales_exec")))
            .andExpect(jsonPath("$.status", is("IN_PROGRESS")));

        Lead reloaded = leadRepository.findById(testLead.getId()).orElseThrow();
        assertEquals("priya_sales_exec", reloaded.getClaimedBy());
    }

    @Test
    void portalInquiryStaysPublic() throws Exception {
        String reqJson = """
            {
              "name": "Ananya Sen",
              "email": "ananya@example.com",
              "phone": "+91-9988776655",
              "checkinDate": "2026-12-01",
              "checkoutDate": "2026-12-05",
              "roomCategory": "Heritage Villa",
              "guestCount": 2,
              "notes": "Late check-in"
            }
            """;

        mvc.perform(post("/api/v1/portal/inquiries")
                .contentType(MediaType.APPLICATION_JSON)
                .content(reqJson))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.publicReference").isNotEmpty());
    }
}
