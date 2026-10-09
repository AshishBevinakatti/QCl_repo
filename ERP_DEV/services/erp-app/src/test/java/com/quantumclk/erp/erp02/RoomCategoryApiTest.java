package com.quantumclk.erp.erp02;

import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.is;
import static org.hamcrest.Matchers.notNullValue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.web.servlet.MockMvc;

/**
 * Slice contract tests (H2, Flyway V1 seed): health + category reads.
 * WHY these exist: they prove API → DB wiring and lock the envelope/error
 * shape before Phase 3 builds on it.
 */
@SpringBootTest
@AutoConfigureMockMvc
class RoomCategoryApiTest {

  @Autowired private MockMvc mvc;

  @Test
  void healthIsUp() throws Exception {
    mvc.perform(get("/api/v1/health"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.status", is("UP")))
        .andExpect(jsonPath("$.service", is("erp-app")));
  }

  @Test
  void listReturnsSeededCategoriesInEnvelope() throws Exception {
    mvc.perform(get("/api/v1/room-categories"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.items", hasSize(3)))
        .andExpect(jsonPath("$.total", is(3)))
        .andExpect(jsonPath("$.items[0].currency", is("INR")));
  }

  @Test
  void getOneById() throws Exception {
    mvc.perform(get("/api/v1/room-categories/22222222-2222-2222-2222-222222222222"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.name", is("Deluxe")))
        .andExpect(jsonPath("$.basePricePaise", is(500000)));
  }

  @Test
  void unknownIdIs404WithContractShape() throws Exception {
    mvc.perform(get("/api/v1/room-categories/99999999-9999-9999-9999-999999999999"))
        .andExpect(status().isNotFound())
        .andExpect(jsonPath("$.code", is("NOT_FOUND")))
        .andExpect(jsonPath("$.requestId", notNullValue()));
  }
}
