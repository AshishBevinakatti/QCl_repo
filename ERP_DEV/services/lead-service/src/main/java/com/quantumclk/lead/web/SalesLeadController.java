package com.quantumclk.lead.web;

import com.quantumclk.lead.dto.SalesDtos.*;
import com.quantumclk.lead.service.LeadService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/sales")
public class SalesLeadController {

    private final LeadService leadService;

    public SalesLeadController(LeadService leadService) {
        this.leadService = leadService;
    }

    @GetMapping("/leads")
    public ResponseEntity<List<LeadDetailDto>> listLeads() {
        return ResponseEntity.ok(leadService.listAllLeads());
    }

    @GetMapping("/leads/{id}")
    public ResponseEntity<LeadDetailDto> getLead(@PathVariable("id") UUID id) {
        return ResponseEntity.ok(leadService.getLeadDetail(id));
    }

    @PostMapping("/leads/{id}/claim")
    public ResponseEntity<LeadDetailDto> claimLead(
        @PathVariable("id") UUID id,
        @AuthenticationPrincipal Jwt jwt
    ) {
        return ResponseEntity.ok(leadService.claimLead(id, resolveActor(jwt)));
    }

    @PostMapping("/leads/{id}/activities")
    public ResponseEntity<LeadDetailDto> addActivity(
        @PathVariable("id") UUID id,
        @Valid @RequestBody AddActivityRequest req,
        @AuthenticationPrincipal Jwt jwt
    ) {
        return ResponseEntity.ok(leadService.addActivity(id, resolveActor(jwt), req));
    }

    @PatchMapping("/leads/{id}/status")
    public ResponseEntity<LeadDetailDto> updateStatus(
        @PathVariable("id") UUID id,
        @Valid @RequestBody UpdateLeadStatusRequest req,
        @AuthenticationPrincipal Jwt jwt
    ) {
        return ResponseEntity.ok(leadService.updateStatus(id, resolveActor(jwt), req));
    }

    @PostMapping("/leads/{id}/convert")
    public ResponseEntity<LeadDetailDto> convertLead(
        @PathVariable("id") UUID id,
        @RequestBody(required = false) ConvertLeadRequest req,
        @AuthenticationPrincipal Jwt jwt
    ) {
        ConvertLeadRequest request = req != null ? req : new ConvertLeadRequest(null, null);
        return ResponseEntity.ok(leadService.convertLead(id, resolveActor(jwt), request));
    }

    @GetMapping("/dashboard/summary")
    public ResponseEntity<SalesDashboardSummary> getSummary() {
        return ResponseEntity.ok(leadService.getDashboardSummary());
    }

    private String resolveActor(Jwt jwt) {
        if (jwt == null) {
            return "system";
        }
        String preferred = jwt.getClaimAsString("preferred_username");
        if (preferred != null && !preferred.isBlank()) {
            return preferred;
        }
        String email = jwt.getClaimAsString("email");
        if (email != null && !email.isBlank()) {
            return email;
        }
        return jwt.getSubject() != null ? jwt.getSubject() : "sales_staff";
    }
}
