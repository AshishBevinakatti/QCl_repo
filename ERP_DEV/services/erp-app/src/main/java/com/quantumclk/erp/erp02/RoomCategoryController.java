package com.quantumclk.erp.erp02;

import java.util.List;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

/**
 * SOW ERP-02 (read slice): paginated category list + single fetch.
 * Slice scope: single demo property (see GOLDEN_HILLS_PROPERTY_ID); Phase 3.2
 * adds auth scoping, admin writes, and rate/promo-joined quotes.
 */
@RestController
@RequestMapping("/api/v1/room-categories")
public class RoomCategoryController {

  /** Demo property seeded by V1 migration ([ASSUMED] single-property MVP). */
  static final UUID GOLDEN_HILLS_PROPERTY_ID = UUID.fromString("11111111-1111-1111-1111-111111111111");

  private final RoomCategoryRepository repository;

  public RoomCategoryController(RoomCategoryRepository repository) {
    this.repository = repository;
  }

  /** Contract envelope: { items, page, total } (see docs/02-architecture/api.md). */
  @GetMapping
  public CategoryPage list(@PageableDefault(size = 20) Pageable pageable) {
    Page<RoomCategory> page = repository.findByPropertyId(GOLDEN_HILLS_PROPERTY_ID, pageable);
    List<CategoryDto> items =
        page.getContent().stream()
            .map(
                c ->
                    new CategoryDto(
                        c.getId(), c.getName(), c.getBasePricePaise(), "INR", c.getCapacity()))
            .toList();
    return new CategoryPage(items, page.getNumber(), page.getTotalElements());
  }

  @GetMapping("/{id}")
  public CategoryDto get(@PathVariable UUID id) {
    RoomCategory c =
        repository
            .findById(id)
            .filter(r -> GOLDEN_HILLS_PROPERTY_ID.equals(r.getPropertyId()))
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "room category not found"));
    return new CategoryDto(c.getId(), c.getName(), c.getBasePricePaise(), "INR", c.getCapacity());
  }

  public record CategoryDto(UUID id, String name, long basePricePaise, String currency, int capacity) {}

  public record CategoryPage(List<CategoryDto> items, int page, long total) {}
}
