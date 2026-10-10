package com.quantumclk.erp.erp05;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

/** SOW ERP-05: tier rules (seeded V7, admin-extensible). */
public interface TierRuleRepository extends JpaRepository<TierRule, String> {

  List<TierRule> findAllByOrderByMinSpendPaiseAsc();
}
