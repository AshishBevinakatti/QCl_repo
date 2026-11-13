package com.quantumclk.erp.auth;

import java.util.Set;
import java.util.TreeSet;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

/** The signed-in staff member and what they may do; the web app builds its menu from this. */
@RestController
public class MeController {

  private final Permissions permissions;

  public MeController(Permissions permissions) {
    this.permissions = permissions;
  }

  @GetMapping("/api/v1/me")
  public MeDto me(Authentication auth) {
    Set<String> roles = new TreeSet<>(Permissions.rolesOf(auth));
    String username =
        auth.getPrincipal() instanceof Jwt jwt && jwt.getClaimAsString("preferred_username") != null
            ? jwt.getClaimAsString("preferred_username")
            : auth.getName();
    return new MeDto(username, roles, permissions.permissionsOf(roles));
  }

  public record MeDto(String username, Set<String> roles, Set<String> permissions) {}
}
