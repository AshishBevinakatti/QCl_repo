package com.quantumclk.erp.ops;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotEquals;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.boot.test.web.server.LocalManagementPort;
import org.springframework.http.ResponseEntity;

/** The loopback management port serves health without a staff token; the API stays closed. */
@SpringBootTest(
    webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT,
    properties = "management.server.port=0")
class ManagementHealthTest {

  @Autowired private TestRestTemplate rest;
  @LocalManagementPort private int managementPort;

  @Test
  void healthIsPublicOnManagementPortAndNotOnMainPort() {
    ResponseEntity<String> management =
        rest.getForEntity("http://127.0.0.1:" + managementPort + "/actuator/health", String.class);
    assertEquals(200, management.getStatusCode().value());
    assertEquals("{\"status\":\"UP\"}", management.getBody());

    ResponseEntity<String> main = rest.getForEntity("/actuator/health", String.class);
    assertNotEquals(200, main.getStatusCode().value());
  }

  @Test
  void onlyHealthAndInfoAreExposed() {
    ResponseEntity<String> env =
        rest.getForEntity("http://127.0.0.1:" + managementPort + "/actuator/env", String.class);
    assertNotEquals(200, env.getStatusCode().value());
  }
}
