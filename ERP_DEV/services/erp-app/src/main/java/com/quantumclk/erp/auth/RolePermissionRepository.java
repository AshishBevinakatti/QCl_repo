package com.quantumclk.erp.auth;

import java.util.Collection;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

/** Request-time permission lookup (V2/V9 seeds; no wildcard except SUPERADMIN's `*`). */
public interface RolePermissionRepository extends JpaRepository<RolePermission, RolePermission.Pk> {

  List<RolePermission> findByRoleIn(Collection<String> roles);
}
