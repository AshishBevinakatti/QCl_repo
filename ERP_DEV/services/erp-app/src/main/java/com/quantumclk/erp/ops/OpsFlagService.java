package com.quantumclk.erp.ops;

import com.quantumclk.erp.config.AppConfig;
import com.quantumclk.erp.config.AppConfigRepository;
import com.quantumclk.erp.ops.OpsDtos.FlagDto;
import com.quantumclk.erp.ops.OpsDtos.OpsFlagsResponse;
import java.time.Instant;
import java.util.List;
import java.util.regex.Pattern;
import org.springframework.stereotype.Service;

/** Read-only view of module/feature configuration; writes stay SUPERADMIN-only. */
@Service
public class OpsFlagService {

  private static final Pattern SENSITIVE =
      Pattern.compile("(?i)(password|secret|token|api[_-]?key|credential)");

  private final AppConfigRepository repository;

  public OpsFlagService(AppConfigRepository repository) {
    this.repository = repository;
  }

  public OpsFlagsResponse flags() {
    List<FlagDto> items =
        repository.findAll().stream()
            .filter(c -> c.getKey().startsWith("feature.") || c.getKey().startsWith("module."))
            .filter(c -> !SENSITIVE.matcher(c.getKey()).find())
            .sorted((a, b) -> a.getKey().compareTo(b.getKey()))
            .map(this::toDto)
            .toList();
    return new OpsFlagsResponse(Instant.now().toString(), items);
  }

  private FlagDto toDto(AppConfig config) {
    String value = config.getValue();
    return new FlagDto(
        config.getKey(),
        value,
        type(value),
        config.getUpdatedBy(),
        config.getUpdatedAt() == null ? null : config.getUpdatedAt().toString());
  }

  static String type(String value) {
    if (value == null) {
      return "string";
    }
    String trimmed = value.trim();
    if ("true".equalsIgnoreCase(trimmed) || "false".equalsIgnoreCase(trimmed)) {
      return "boolean";
    }
    if (trimmed.matches("-?\\d+(\\.\\d+)?")) {
      return "number";
    }
    if ((trimmed.startsWith("{") && trimmed.endsWith("}"))
        || (trimmed.startsWith("[") && trimmed.endsWith("]"))) {
      return "json";
    }
    return "string";
  }
}
