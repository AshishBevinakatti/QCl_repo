package com.quantumclk.erp.auth;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.IdClass;
import jakarta.persistence.Table;
import java.io.Serializable;
import java.util.Objects;

/** SOW ERP-08: which role holds which permission (deny-by-default; seeded in V2). */
@Entity
@Table(name = "role_permission")
@IdClass(RolePermission.Pk.class)
public class RolePermission {

  @Id private String role;

  @Id private String permission;

  protected RolePermission() {}

  public String getRole() {
    return role;
  }

  public String getPermission() {
    return permission;
  }

  /** Composite key for (role, permission). */
  public static class Pk implements Serializable {
    private String role;
    private String permission;

    @Override
    public boolean equals(Object o) {
      if (!(o instanceof Pk other)) {
        return false;
      }
      return Objects.equals(role, other.role) && Objects.equals(permission, other.permission);
    }

    @Override
    public int hashCode() {
      return Objects.hash(role, permission);
    }
  }
}
