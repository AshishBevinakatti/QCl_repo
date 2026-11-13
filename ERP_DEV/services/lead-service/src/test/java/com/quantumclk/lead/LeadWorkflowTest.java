package com.quantumclk.lead;

import com.quantumclk.lead.domain.LeadStatus;
import com.quantumclk.lead.dto.InquiryDtos.*;
import com.quantumclk.lead.dto.SalesDtos.*;
import com.quantumclk.lead.service.LeadService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
public class LeadWorkflowTest {

    @Autowired
    private LeadService leadService;

    @Test
    void endToEndLeadIntakeClaimAndConversion() {
        // 1. Submit Inquiry
        CreateInquiryRequest req = new CreateInquiryRequest(
            "Vikram Malhotra",
            "vikram@example.com",
            "+91-9123456789",
            LocalDate.now().plusDays(5),
            LocalDate.now().plusDays(7),
            "Luxury Pool Villa",
            2,
            "Anniversary celebration, requested floral setup."
        );

        InquiryResponse inq = leadService.createInquiry(req, null);
        assertNotNull(inq.id());
        assertTrue(inq.publicReference().startsWith("GHR-"));
        assertEquals(LeadStatus.NEW, inq.status());

        // 2. Sales Executive Claims the Lead
        LeadDetailDto claimed = leadService.claimLead(inq.id(), "sales_exec_priya");
        assertEquals(LeadStatus.IN_PROGRESS, claimed.status());
        assertEquals("sales_exec_priya", claimed.claimedBy());
        assertNotNull(claimed.claimedAt());

        // Concurrency test: second attempt to claim should be rejected
        assertThrows(IllegalStateException.class, () -> leadService.claimLead(inq.id(), "sales_exec_amit"));

        // 3. Sales Exec logs a phone call note
        AddActivityRequest actReq = new AddActivityRequest(
            "CALL",
            "Called guest, confirmed anniversary arrangement package."
        );
        LeadDetailDto withNote = leadService.addActivity(inq.id(), "sales_exec_priya", actReq);
        assertTrue(withNote.activities().stream().anyMatch(a -> a.description().contains("anniversary arrangement")));

        // 4. Convert to ERP Guest Record
        UUID erpGuestId = UUID.randomUUID();
        UUID erpReservationId = UUID.randomUUID();
        ConvertLeadRequest convReq = new ConvertLeadRequest(erpGuestId, erpReservationId);

        LeadDetailDto converted = leadService.convertLead(inq.id(), "sales_exec_priya", convReq);
        assertEquals(LeadStatus.CONVERTED, converted.status());
        assertEquals(erpGuestId, converted.erpGuestId());
        assertEquals(erpReservationId, converted.erpReservationId());
    }
}
