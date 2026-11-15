package com.quantumclk.erp.access.employee;

import com.quantumclk.erp.access.employee.AuditLog.Actor;
import com.quantumclk.erp.access.employee.EmployeeService.CreateCommand;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

/** Employee administration (api.md §3). Permissions come from the token; MANAGER cannot manage (D-113). */
@RestController
@RequestMapping("/api/v1/admin/employees")
public class EmployeeController {

    public record CreateRequest(
            @NotBlank @Size(max = 100) String firstName,
            @NotBlank @Size(max = 100) String lastName,
            @NotBlank @Email @Size(max = 254) String email,
            @NotBlank @Pattern(regexp = "^[A-Za-z0-9._-]{3,50}$", message = "3–50 letters, digits, dot, dash or underscore") String username,
            @NotBlank @Pattern(regexp = "^\\+[1-9][0-9 -]{7,18}$", message = "international format, e.g. +91 98765 43210") String mobile,
            @NotNull JobRole jobRole,
            Boolean whatsappOptIn) { }   // optional, default false (Jackson 3 rejects a missing primitive)

    public record PageView<T>(List<T> items, int page, int size, long total) {
        static <T> PageView<T> of(Page<T> p) { return new PageView<>(p.getContent(), p.getNumber(), p.getSize(), p.getTotalElements()); }
    }

    private final EmployeeService service;
    private final EmployeeRepository employees;

    EmployeeController(EmployeeService service, EmployeeRepository employees) {
        this.service = service;
        this.employees = employees;
    }

    @PostMapping
    @PreAuthorize("hasAuthority('PERM_employees.manage')")
    ResponseEntity<EmployeeView> create(@Valid @RequestBody CreateRequest r, @RequestHeader("Idempotency-Key") UUID key,
                                        JwtAuthenticationToken auth, HttpServletRequest http) {
        var result = service.create(new CreateCommand(r.firstName(), r.lastName(), r.email(), r.username(), r.mobile(),
                r.jobRole(), Boolean.TRUE.equals(r.whatsappOptIn())), actor(auth, http), key);
        // 201 when Keycloak is set up; 202 when it is still pending (AUTHENTICATION §10 F1/F2).
        return ResponseEntity.status(result.provisioned() ? HttpStatus.CREATED : HttpStatus.ACCEPTED).body(result.employee());
    }

    @GetMapping
    @PreAuthorize("hasAuthority('PERM_employees.read')")
    PageView<EmployeeView> list(@RequestParam(required = false) String status, @RequestParam(required = false) String role,
                                @RequestParam(required = false) String q, @RequestParam(defaultValue = "0") int page,
                                @RequestParam(defaultValue = "20") int size) {
        return PageView.of(service.list(status, role, q, Math.max(page, 0), size));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAuthority('PERM_employees.read')")
    EmployeeView get(@PathVariable UUID id) {
        return service.get(id);
    }

    @PostMapping("/{id}/retry-provisioning")
    @PreAuthorize("hasAuthority('PERM_employees.manage')")
    EmployeeView retry(@PathVariable UUID id, JwtAuthenticationToken auth, HttpServletRequest http) {
        service.get(id); // 404 if unknown
        service.provision(id, actor(auth, http));
        return service.get(id);
    }

    /** The acting employee's ERP id when known (it goes into created_by/updated_by), else the Keycloak subject. */
    Actor actor(JwtAuthenticationToken auth, HttpServletRequest http) {
        UUID sub = UUID.fromString(auth.getToken().getSubject());
        UUID id = employees.findByKeycloakUserId(sub).map(Employee::getId).orElse(sub);
        String label = auth.getToken().getClaimAsString("preferred_username");
        return new Actor(id, label != null ? label : sub.toString(), http.getRemoteAddr());
    }
}
