package com.quantumclk.erp.auth;

import java.util.Arrays;
import java.util.Collection;
import java.util.Set;
import java.util.TreeSet;
import java.util.stream.Collectors;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

/**
 * SOW ERP-08: the single access rule for every endpoint. The JWT proves who the
 * user is (roles); what a role may do lives in role_permission (admin-editable,
 * placeholder defaults until the client's roles matrix arrives — Q-003).
 * Used as {@code @PreAuthorize("@perm.has('guests:view')")}.
 */
@Component("perm")
public class Permissions {

  public static final String ALL = "*";

  private final RolePermissionRepository repository;

  public Permissions(RolePermissionRepository repository) {
    this.repository = repository;
  }

  public boolean has(String permission) {
    return hasAny(permission);
  }

  public boolean hasAny(String... permissions) {
    Set<String> held = permissionsOf(currentRoles());
    return held.contains(ALL) || Arrays.stream(permissions).anyMatch(held::contains);
  }

  /** Permissions granted to the given roles; SUPERADMIN always holds "*". */
  public Set<String> permissionsOf(Collection<String> roles) {
    Set<String> out = new TreeSet<>();
    if (roles.isEmpty()) {
      return out;
    }
    if (roles.contains("SUPERADMIN")) {
      out.add(ALL);
    }
    repository.findByRoleIn(roles).forEach(rp -> out.add(rp.getPermission()));
    return out;
  }

  static Set<String> rolesOf(Authentication auth) {
    if (auth == null || !auth.isAuthenticated()) {
      return Set.of();
    }
    return auth.getAuthorities().stream().map(GrantedAuthority::getAuthority).collect(Collectors.toSet());
  }

  private static Set<String> currentRoles() {
    return rolesOf(SecurityContextHolder.getContext().getAuthentication());
  }
}
