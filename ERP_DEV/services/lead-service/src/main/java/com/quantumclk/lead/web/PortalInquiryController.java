package com.quantumclk.lead.web;

import com.quantumclk.lead.dto.InquiryDtos.*;
import com.quantumclk.lead.security.JwtTokenService;
import com.quantumclk.lead.service.LeadService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/portal/inquiries")
public class PortalInquiryController {

    private final LeadService leadService;
    private final JwtTokenService jwtTokenService;

    public PortalInquiryController(LeadService leadService, JwtTokenService jwtTokenService) {
        this.leadService = leadService;
        this.jwtTokenService = jwtTokenService;
    }

    @PostMapping
    public ResponseEntity<InquiryResponse> submitInquiry(
        @Valid @RequestBody CreateInquiryRequest req,
        @RequestHeader(value = "Authorization", required = false) String authHeader
    ) {
        UUID guestId = null;
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            String token = authHeader.substring(7);
            if (jwtTokenService.validateToken(token)) {
                guestId = jwtTokenService.getGuestIdFromToken(token);
            }
        }

        InquiryResponse res = leadService.createInquiry(req, guestId);
        return ResponseEntity.status(HttpStatus.CREATED).body(res);
    }

    @GetMapping("/me")
    public ResponseEntity<List<InquiryResponse>> getMyInquiries(
        @RequestHeader(value = "Authorization") String authHeader
    ) {
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        String token = authHeader.substring(7);
        if (!jwtTokenService.validateToken(token)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        UUID guestId = jwtTokenService.getGuestIdFromToken(token);
        List<InquiryResponse> list = leadService.listGuestInquiries(guestId);
        return ResponseEntity.ok(list);
    }
}
