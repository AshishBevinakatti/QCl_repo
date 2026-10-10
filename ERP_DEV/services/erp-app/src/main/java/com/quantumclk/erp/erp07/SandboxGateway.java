package com.quantumclk.erp.erp07;

import com.quantumclk.erp.config.Configs;
import java.nio.charset.StandardCharsets;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import org.springframework.stereotype.Service;

/**
 * Sandbox gateway (contract tests + dev). Behaves like a real provider:
 * refs, HMAC-signed callbacks, refunds, failure injection (refs starting
 * with "fail_" are refused). Real provider implements the same interface.
 */
@Service
public class SandboxGateway implements PaymentGateway {

  private final Configs configs;
  private final Map<String, Long> captured = new ConcurrentHashMap<>();
  private final Map<String, Long> refunded = new ConcurrentHashMap<>();

  public SandboxGateway(Configs configs) {
    this.configs = configs;
  }

  @Override
  public String initiate(UUID propertyId, long amountPaise, String idempotencyKey) {
    // Deterministic ref per idempotency key: provider-side idempotency.
    return "sbx_" + UUID.nameUUIDFromBytes(
        (propertyId + ":" + idempotencyKey).getBytes(StandardCharsets.UTF_8))
        .toString().replace("-", "").substring(0, 20);
  }

  @Override
  public boolean verifySignature(String gatewayRef, long amountPaise, String signature) {
    return sign(gatewayRef, amountPaise).equals(signature);
  }

  @Override
  public String sign(String gatewayRef, long amountPaise) {
    try {
      Mac mac = Mac.getInstance("HmacSHA256");
      mac.init(new SecretKeySpec(secret().getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
      byte[] digest = mac.doFinal((gatewayRef + ":" + amountPaise).getBytes(StandardCharsets.UTF_8));
      StringBuilder hex = new StringBuilder();
      for (byte b : digest) {
        hex.append(String.format("%02x", b));
      }
      return hex.toString();
    } catch (Exception e) {
      throw new IllegalStateException("hmac unavailable", e);
    }
  }

  @Override
  public void refund(String gatewayRef, long amountPaise, String refundId) {
    if (gatewayRef.startsWith("fail_")) {
      throw new GatewayException("provider refused refund for " + gatewayRef);
    }
    refunded.merge(gatewayRef, amountPaise, Long::sum);
  }

  /** Sandbox capture hook: a signed callback means money moved. */
  public void markCaptured(String gatewayRef, long amountPaise) {
    if (gatewayRef.startsWith("fail_")) {
      throw new GatewayException("provider refused capture for " + gatewayRef);
    }
    captured.put(gatewayRef, amountPaise);
  }

  @Override
  public boolean capturedAtProvider(String gatewayRef) {
    return captured.containsKey(gatewayRef);
  }

  @Override
  public long refundedAtProvider(String gatewayRef) {
    return refunded.getOrDefault(gatewayRef, 0L);
  }

  String secret() {
    return configs.get("gateway.webhook_secret", "sandbox-secret-CHANGE-ME");
  }
}
