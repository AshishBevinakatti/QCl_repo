package com.quantumclk.erp.erp04;

import com.quantumclk.erp.audit.AuditLog;
import com.quantumclk.erp.erp02.RoomCategoryController;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

/**
 * SOW ERP-04 (REQ-ERP04-001…005): guest profiles. Phone is the identity key
 * ([ASSUMED] D-107): creating a duplicate active phone returns 409 with the
 * existing id — the desk then corrects or merges (manager-only).
 */
@RestController
@RequestMapping("/api/v1/guests")
public class GuestController {

  private final GuestRepository guests;
  private final AuditLog auditLog;

  public GuestController(GuestRepository guests, AuditLog auditLog) {
    this.guests = guests;
    this.auditLog = auditLog;
  }

  @PostMapping
  @ResponseStatus(HttpStatus.CREATED)
  public GuestDto create(@Valid @RequestBody CreateGuest body, HttpServletRequest req) {
    var existing =
        guests.findByPropertyIdAndPhoneAndMergedIntoIsNull(
            RoomCategoryController.GOLDEN_HILLS_PROPERTY_ID, body.phone());
    if (existing.isPresent()) {
      throw new ResponseStatusException(
          HttpStatus.CONFLICT, "guest exists for this phone: " + existing.get().getId());
    }
    Guest g =
        new Guest(
            RoomCategoryController.GOLDEN_HILLS_PROPERTY_ID,
            body.name(),
            body.phone(),
            body.idType(),
            body.preferences());
    guests.save(g);
    audit("guest.created", g.getId().toString(), null, g.getPhone(), body.reason(), req);
    return toDto(g);
  }

  @GetMapping("/{id}")
  public GuestDto get(@PathVariable UUID id) {
    return toDto(or404(id));
  }

  @PatchMapping("/{id}")
  public GuestDto update(
      @PathVariable UUID id, @RequestBody Map<String, String> body, HttpServletRequest req) {
    Guest g = or404(id);
    String before = g.getName() + "|" + g.getPhone();
    if (body.containsKey("name")) {
      g.setName(body.get("name"));
    }
    if (body.containsKey("phone") && !body.get("phone").equals(g.getPhone())) {
      var clash =
          guests.findByPropertyIdAndPhoneAndMergedIntoIsNull(
              RoomCategoryController.GOLDEN_HILLS_PROPERTY_ID, body.get("phone"));
      if (clash.isPresent()) {
        throw new ResponseStatusException(HttpStatus.CONFLICT, "another guest holds this phone");
      }
      g.setPhone(body.get("phone"));
    }
    if (body.containsKey("idType")) {
      g.setIdType(body.get("idType"));
    }
    if (body.containsKey("preferences")) {
      g.setPreferences(body.get("preferences"));
    }
    guests.save(g);
    audit(
        "guest.updated",
        g.getId().toString(),
        before,
        g.getName() + "|" + g.getPhone(),
        body.get("reason"),
        req);
    return toDto(g);
  }

  @GetMapping
  public GuestPage search(
      @RequestParam(required = false) String search, @PageableDefault(size = 20) Pageable pageable) {
    Page<Guest> page =
        (search == null || search.isBlank())
            ? guests.findByPropertyIdAndMergedIntoIsNull(
                RoomCategoryController.GOLDEN_HILLS_PROPERTY_ID, pageable)
            : guests.search(RoomCategoryController.GOLDEN_HILLS_PROPERTY_ID, search, pageable);
    return new GuestPage(page.getContent().stream().map(this::toDto).toList(),
        page.getNumber(), page.getTotalElements());
  }

  /** Stay history hook — populated by unit 3.2 reservations; contract stable now. */
  @GetMapping("/{id}/stays")
  public Map<String, Object> stays(@PathVariable UUID id) {
    or404(id);
    return Map.of("items", List.of(), "page", 0, "total", 0);
  }

  @PreAuthorize("hasAnyAuthority('MANAGER','SUPERADMIN')")
  @PostMapping("/merge")
  public GuestDto merge(@RequestBody Map<String, String> body, HttpServletRequest req) {
    UUID primaryId = UUID.fromString(body.get("primaryId"));
    UUID duplicateId = UUID.fromString(body.get("duplicateId"));
    if (primaryId.equals(duplicateId)) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "cannot merge a guest into itself");
    }
    Guest primary = or404(primaryId);
    Guest duplicate = or404(duplicateId);
    duplicate.mergeInto(primary);
    guests.save(duplicate);
    audit(
        "guest.merged",
        duplicate.getId().toString(),
        "active",
        "merged->" + primary.getId(),
        body.get("reason"),
        req);
    return toDto(primary);
  }

  Guest or404(UUID id) {
    return guests
        .findById(id)
        .filter(g -> RoomCategoryController.GOLDEN_HILLS_PROPERTY_ID.equals(g.getPropertyId()))
        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "guest not found"));
  }

  void audit(
      String action, String objectId, String before, String after, String reason,
      HttpServletRequest req) {
    String actor = req.getUserPrincipal() != null ? req.getUserPrincipal().getName() : "unknown";
    auditLog.append(
        RoomCategoryController.GOLDEN_HILLS_PROPERTY_ID,
        actor,
        action,
        "guest",
        objectId,
        before,
        after,
        reason,
        req.getRemoteAddr());
  }

  GuestDto toDto(Guest g) {
    return new GuestDto(
        g.getId(),
        g.getName(),
        g.getPhone(),
        g.getIdType(),
        g.getPreferences(),
        g.getStatus(),
        g.getMergedInto() != null ? g.getMergedInto().getId() : null);
  }

  public record CreateGuest(
      @NotBlank String name,
      @NotBlank @Pattern(regexp = "^[+]?[0-9][0-9 ()-]{5,}$", message = "phone looks invalid")
          String phone,
      String idType,
      String preferences,
      String reason) {}

  public record GuestDto(
      UUID id, String name, String phone, String idType, String preferences, String status,
      UUID mergedIntoId) {}

  public record GuestPage(List<GuestDto> items, int page, long total) {}
}
