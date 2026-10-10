package com.quantumclk.erp.erp07;

import static org.hamcrest.Matchers.is;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

/**
 * SOW ERP-07 (REQ-ERP07-001…006): sandbox settle, forged-signature reject,
 * invoice math + immutability shape, refund approve/process, reconciliation.
 * The concurrent double-refund proof lives in RefundRaceTest.
 */
@SpringBootTest
@AutoConfigureMockMvc
@WithMockUser(username = "accounts-user", authorities = {"ACCOUNTS", "MANAGER", "SUPERADMIN"})
class BillingApiTest {

  static final UUID DELUXE = UUID.fromString("22222222-2222-2222-2222-222222222222");

  @Autowired private MockMvc mvc;

  @Test
  void fullMoneyJourney() throws Exception {
    // Book (no promo, 2026-11-09→11: 2 x 500000 = 1000000, advance 300000).
    MvcResult booking =
        mvc.perform(
                post("/api/v1/reservations")
                    .header("Idempotency-Key", "test-key-bill-1")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(
                        "{\"newGuest\":{\"name\":\"Bill Guest\",\"phone\":\"+91-9822000601\"},"
                            + "\"categoryId\":\"" + DELUXE + "\","
                            + "\"checkinDate\":\"2026-11-09\",\"checkoutDate\":\"2026-11-11\","
                            + "\"source\":\"web\"}"))
            .andExpect(status().isCreated())
            .andReturn();
    String reservationId = json(booking, "id");
    // Advance is due but not captured: confirm is blocked.
    mvc.perform(post("/api/v1/reservations/" + reservationId + "/confirm")
            .contentType(MediaType.APPLICATION_JSON).content("{}"))
        .andExpect(status().isUnprocessableEntity());
    // Settle through the sandbox (initiate returns ref + signature).
    MvcResult initiated =
        mvc.perform(
                post("/api/v1/payments/initiate")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("{\"reservationId\":\"" + reservationId + "\"}"))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.amountPaise", is(300000)))
            .andReturn();
    String ref = json(initiated, "gatewayRef");
    String sig = json(initiated, "signature");
    String paymentId = json(initiated, "paymentId");
    // Forged callback is rejected (and marks the payment failed).
    mvc.perform(
            post("/api/v1/payments/confirm")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"gatewayRef\":\"" + ref + "\",\"signature\":\"forged\"}"))
        .andExpect(status().isUnauthorized());
    // Re-initiate after the forgery (new key) and confirm properly.
    MvcResult initiated2 =
        mvc.perform(
                post("/api/v1/payments/initiate")
                    .header("Idempotency-Key", "test-key-bill-1-pay2")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("{\"reservationId\":\"" + reservationId + "\"}"))
            .andExpect(status().isCreated())
            .andReturn();
    String ref2 = json(initiated2, "gatewayRef");
    String sig2 = json(initiated2, "signature");
    String paymentId2 = json(initiated2, "paymentId");
    mvc.perform(
            post("/api/v1/payments/confirm")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"gatewayRef\":\"" + ref2 + "\",\"signature\":\"" + sig2 + "\"}"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.status", is("captured")));
    // Now confirm succeeds.
    mvc.perform(post("/api/v1/reservations/" + reservationId + "/confirm")
            .contentType(MediaType.APPLICATION_JSON).content("{}"))
        .andExpect(status().isOk());
    // Check in: room charge posts to a folio.
    MvcResult stay =
        mvc.perform(
                post("/api/v1/stays/check-in")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("{\"reservationId\":\"" + reservationId + "\"}"))
            .andExpect(status().isOk())
            .andReturn();
    String stayId = json(stay, "id");
    // Request + approve + process a partial refund of the advance.
    MvcResult refund =
        mvc.perform(
                post("/api/v1/refunds")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("{\"paymentId\":\"" + paymentId2 + "\",\"amountPaise\":50000,"
                        + "\"reason\":\"goodwill\",\"idempotencyKey\":\"test-key-bill-1-r1\"}"))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.status", is("requested")))
            .andReturn();
    String refundId = json(refund, "id");
    mvc.perform(post("/api/v1/refunds/" + refundId + "/approve"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.status", is("approved")));
    mvc.perform(post("/api/v1/refunds/" + refundId + "/process"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.status", is("processed")));
    // Re-processing is a safe replay, not a double refund.
    mvc.perform(post("/api/v1/refunds/" + refundId + "/process"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.status", is("processed")));
    // Over-cap refund is rejected.
    mvc.perform(
            post("/api/v1/refunds")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"paymentId\":\"" + paymentId2 + "\",\"amountPaise\":99999999,"
                    + "\"reason\":\"greed\",\"idempotencyKey\":\"test-key-bill-1-r2\"}"))
        .andExpect(status().isBadRequest());
    // Reconciliation lists the payment with matching provider state.
    MvcResult recon =
        mvc.perform(get("/api/v1/reconciliation"))
            .andExpect(status().isOk())
            .andReturn();
    org.junit.jupiter.api.Assertions.assertTrue(
        recon.getResponse().getContentAsString().contains(paymentId2));
  }

  @Test
  void invoiceMathAndRead() throws Exception {
    // Fresh stay: room charge 1000000, advance 300000 linked at check-in.
    // Invoice: subtotal 1000000, GST 12% = 120000, credits 300000 → total 820000.
    MvcResult booking =
        mvc.perform(
                post("/api/v1/reservations")
                    .header("Idempotency-Key", "test-key-bill-inv-1")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(
                        "{\"newGuest\":{\"name\":\"Invoice Guest\",\"phone\":\"+91-9822000602\"},"
                            + "\"categoryId\":\"" + DELUXE + "\","
                            + "\"checkinDate\":\"2026-11-09\",\"checkoutDate\":\"2026-11-11\","
                            + "\"source\":\"web\"}"))
            .andExpect(status().isCreated())
            .andReturn();
    String reservationId = json(booking, "id");
    payAdvance(reservationId, "test-key-bill-inv-1-pay");
    mvc.perform(post("/api/v1/reservations/" + reservationId + "/confirm")
            .contentType(MediaType.APPLICATION_JSON).content("{}"))
        .andExpect(status().isOk());
    MvcResult stay =
        mvc.perform(
                post("/api/v1/stays/check-in")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("{\"reservationId\":\"" + reservationId + "\"}"))
            .andExpect(status().isOk())
            .andReturn();
    String stayId = json(stay, "id");
    // Folio for the stay: outstanding = 1000000 − 300000 = 700000.
    MvcResult folioLookup =
        mvc.perform(get("/api/v1/folios").param("stayId", stayId))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.outstandingPaise", is(700000)))
            .andExpect(jsonPath("$.entries.length()", is(2)))
            .andReturn();
    String folioId = json(folioLookup, "id");
    MvcResult invoice =
        mvc.perform(
                post("/api/v1/invoices")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("{\"folioId\":\"" + folioId + "\"}"))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.taxPaise", is(120000)))
            .andExpect(jsonPath("$.totalPaise", is(820000)))
            .andReturn();
    String invoiceId = json(invoice, "id");
    // Issued invoices read back unchanged (immutable: no update route exists).
    mvc.perform(get("/api/v1/invoices/" + invoiceId))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.totalPaise", is(820000)));
  }

  void payAdvance(String reservationId, String key) throws Exception {
    MvcResult initiated =
        mvc.perform(
                post("/api/v1/payments/initiate")
                    .header("Idempotency-Key", key)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("{\"reservationId\":\"" + reservationId + "\"}"))
            .andExpect(status().isCreated())
            .andReturn();
    String body = initiated.getResponse().getContentAsString();
    String ref = body.split("\"gatewayRef\":\"")[1].split("\"")[0];
    String sig = body.split("\"signature\":\"")[1].split("\"")[0];
    mvc.perform(
            post("/api/v1/payments/confirm")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"gatewayRef\":\"" + ref + "\",\"signature\":\"" + sig + "\"}"))
        .andExpect(status().isOk());
  }

  static String json(MvcResult result, String field) throws Exception {
    String body = result.getResponse().getContentAsString();
    return body.split("\"" + field + "\":\"")[1].split("\"")[0];
  }
}
