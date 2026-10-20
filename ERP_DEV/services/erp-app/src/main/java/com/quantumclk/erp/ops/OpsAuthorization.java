package com.quantumclk.erp.ops;

import com.quantumclk.erp.auth.RolePermissionRepository;
import java.util.Collection;
import java.util.Set;
import java.util.stream.Collectors;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

/**
 * Resolves ops permissions from the database on every call. The JWT only proves
 * who the user is; it does not carry the permission list.
 */
@Component("opsAuth")
public class OpsAuthorization {

  private final RolePermissionRepository repository;

  public OpsAuthorization(RolePermissionRepository repository) {
    this.repository = repository;
  }

  public boolean has(String permission) {
    Authentication auth = SecurityContextHolder.getContext().getAuthentication();
    if (auth == null || !auth.isAuthenticated()) {
      return false;
    }
    Set<String> roles =
        auth.getAuthorities().stream()
            .map(GrantedAuthority::getAuthority)
            .collect(Collectors.toSet());
    if (roles.contains("SUPERADMIN")) {
      return true;
    }
    if (roles.isEmpty()) {
      return false;
    }
    Collection<String> held =
        repository.findByRoleIn(roles).stream().map(rp -> rp.getPermission()).collect(Collectors.toSet());
    return held.contains("*") || held.contains(permission);
  }
}
