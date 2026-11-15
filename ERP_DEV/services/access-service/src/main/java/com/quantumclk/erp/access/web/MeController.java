package com.quantumclk.erp.access.web;

import com.quantumclk.erp.access.employee.Employee;
import com.quantumclk.erp.access.employee.EmployeeRepository;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

/** GET /api/v1/me: own profile + roles + permissions + modules the menu may show (api.md §3). */
@RestController
public class MeController {

    private final EmployeeRepository employees;

    MeController(EmployeeRepository employees) {
        this.employees = employees;
    }

    public record Profile(UUID id, String firstName, String lastName, String email, String username, String jobRole, String status) {
        static Profile of(Employee e) {
            return new Profile(e.getId(), e.getFirstName(), e.getLastName(), e.getEmail(), e.getUsername(), e.getJobRole(), e.getStatus());
        }
    }

    /** employee is null when a Keycloak user has no ERP record yet (e.g. created outside the ERP). */
    public record Me(Profile employee, List<String> roles, List<String> permissions, List<String> modules) { }

    @GetMapping("/api/v1/me")
    Me me(JwtAuthenticationToken auth) {
        List<String> roles = strip(auth, "ROLE_");
        List<String> permissions = strip(auth, "PERM_");
        Profile profile = parseUuid(auth.getToken().getSubject())
                .flatMap(employees::findByKeycloakUserId).map(Profile::of).orElse(null);
        return new Me(profile, roles, permissions, modules(permissions));
    }

    // Cosmetic only: the backend still checks every request (AUTHENTICATION §5 step 6).
    static List<String> modules(List<String> permissions) {
        List<String> m = new ArrayList<>(List.of("dashboard"));
        if (permissions.contains("employees.read")) m.add("employees");
        if (permissions.contains("leads.read_queue") || permissions.contains("leads.read_team")) m.add("leads");
        if (permissions.contains("audit.read")) m.add("audit");
        return m;
    }

    private static List<String> strip(JwtAuthenticationToken auth, String prefix) {
        return auth.getAuthorities().stream().map(GrantedAuthority::getAuthority)
                .filter(a -> a.startsWith(prefix)).map(a -> a.substring(prefix.length())).sorted().toList();
    }

    private static java.util.Optional<UUID> parseUuid(String s) {
        try {
            return java.util.Optional.of(UUID.fromString(s));
        } catch (IllegalArgumentException | NullPointerException e) {
            return java.util.Optional.empty();
        }
    }
}
