package com.quantumclk.erp.erp07;

import java.util.UUID;

/**
 * SOW ERP-07: gateway contract. One interface, sandbox now, real provider
 * later (keys from the client per SOW §29) — swapping never touches callers.
 */
public interface PaymentGateway {

  /** Start a charge; returns the provider reference (status stays pending). */
  String initiate(UUID propertyId, long amountPaise, String idempotencyKey);

  /**
   * Verify a provider callback signature over {@code gatewayRef:amountPaise}.
   * Real providers sign server-to-server; the sandbox signs with the
   * configured webhook secret (DEV-ONLY fake until Vault/K8s Secrets).
   */
  boolean verifySignature(String gatewayRef, long amountPaise, String signature);

  /** Build a valid signature (sandbox only — used by tests and the desk simulator). */
  String sign(String gatewayRef, long amountPaise);

  /** Send a refund to the provider (idempotent per refund id). */
  void refund(String gatewayRef, long amountPaise, String refundId);

  /** Provider-side captured state (drives reconciliation mismatches). */
  boolean capturedAtProvider(String gatewayRef);

  /** Provider-side refunded total (drives reconciliation mismatches). */
  long refundedAtProvider(String gatewayRef);

  /** Thrown when the provider refuses (used for failure-injection tests). */
  class GatewayException extends RuntimeException {
    public GatewayException(String message) {
      super(message);
    }
  }
}
