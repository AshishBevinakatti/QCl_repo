package com.quantumclk.erp.access.membership;

import com.quantumclk.erp.access.employee.AuditLog;
import com.quantumclk.erp.access.employee.AuditLog.Actor;
import com.quantumclk.erp.access.membership.MemberView.EnrolledBy;
import com.quantumclk.erp.access.membership.MemberView.NextNumber;
import com.quantumclk.erp.access.membership.MemberView.PageView;
import com.quantumclk.erp.access.membership.MemberView.Payment;
import com.quantumclk.erp.access.membership.MemberView.Proof;
import com.quantumclk.erp.access.web.ApiException;
import com.quantumclk.erp.access.web.FieldErrorsException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.support.TransactionTemplate;
import tools.jackson.databind.json.JsonMapper;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.sql.Timestamp;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.Period;
import java.time.ZoneOffset;
import java.time.format.DateTimeParseException;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;
import java.util.regex.Pattern;

/**
 * Gold Membership registration and verification (SOW ERP-05; inc-membership-PLAN S1; D-116…D-118).
 *
 * <p>A Sales Executive registers a customer and the payment (Cash, Card, or Scan QR with a screenshot). The member
 * gets the next number of the client's series GRH-LM-#### at once, and waits as PENDING_VERIFICATION until an
 * ADMIN or MANAGER — never the person who enrolled them — verifies the payment (ACTIVE for 12 months) or rejects it
 * with a reason. Every step is written to the append-only audit log.
 */
@Service
public class MembershipService {

    public static final String SERIES = "GRH-LM";
    static final String ENTITY = "MEMBER";

    /** Raw form values as typed; everything is checked and normalised here so the rules live in one place. */
    public record RegisterForm(String firstName, String lastName, String dob, String mobile, String email, String address,
                               String paymentType, String amount, String transactionId) { }

    public record Upload(byte[] bytes, String fileName) { }

    record Clean(String firstName, String lastName, LocalDate dob, String mobile, String email, String address,
                 String paymentType, BigDecimal amount, String transactionId) { }

    /** The enrolling or deciding employee: ERP id, display name and username. */
    public record Staff(UUID employeeId, String name, String username, String ip) {
        Actor actor() { return new Actor(employeeId, username, ip); }
    }

    private static final Pattern EMAIL = Pattern.compile("^[^@\\s]{1,64}@[^@\\s]+\\.[^@\\s]{2,}$");
    private static final Pattern E164 = Pattern.compile("^\\+[1-9][0-9]{7,14}$");
    private static final Pattern MONEY = Pattern.compile("^[0-9]{1,10}(\\.[0-9]{1,2})?$");

    private final JdbcTemplate jdbc;
    private final TransactionTemplate tx;
    private final ProofStorage proofs;
    private final AuditLog audit;
    private final JsonMapper json;
    private final Period validity;
    private final GuestAccounts guests;

    MembershipService(JdbcTemplate jdbc, TransactionTemplate tx, ProofStorage proofs, AuditLog audit, JsonMapper json,
                      @Value("${erp.membership.validity:P12M}") String validity, GuestAccounts guests) {
        this.guests = guests;
        this.jdbc = jdbc;
        this.tx = tx;
        this.proofs = proofs;
        this.audit = audit;
        this.json = json;
        this.validity = Period.parse(validity);
    }

    // --- Registration ------------------------------------------------------------------------------------------------

    public NextNumber nextNumber() {
        Integer n = jdbc.queryForObject("SELECT next_number FROM membership_number_counter WHERE series = ?", Integer.class, SERIES);
        return new NextNumber(format(n), true);
    }

    static String format(int n) {
        return SERIES + "-" + String.format(Locale.ROOT, "%04d", n);
    }

    public MemberView register(RegisterForm form, Upload proof, Staff by, UUID idempotencyKey) {
        Clean c = validate(form, proof);
        if (proof != null) ProofStorage.checkImage(proof.bytes());   // type and size before anything is saved
        String hash = ProofStorage.sha256(json.writeValueAsBytes(List.of(c.toString(),
                proof == null ? "" : ProofStorage.sha256(proof.bytes()))));
        MemberView replay = replay(by, idempotencyKey, hash);
        if (replay != null) return replay;

        ProofStorage.Stored stored = proof == null ? null : proofs.store(proof.bytes(), proof.fileName());
        UUID id = UUID.randomUUID();
        try {
            tx.executeWithoutResult(s -> {
                // Claim the key, the number and the rows atomically: a double tap can't create two members, and a
                // failed registration gives its number back (the counter update rolls back with it).
                jdbc.update("INSERT INTO idempotency_key (key, actor_id, request_hash, response_json, created_at) VALUES (?, ?, ?, ?::jsonb, ?)",
                        idempotencyKey, by.employeeId(), hash, json.writeValueAsString(Map.of("memberId", id)), Timestamp.from(now().toInstant()));
                ensureNoLiveMember(c.email(), c.mobile());
                List<Integer> taken = jdbc.queryForList("""
                        UPDATE membership_number_counter SET next_number = next_number + 1
                        WHERE series = ? AND next_number <= last_number RETURNING next_number - 1""", Integer.class, SERIES);
                if (taken.isEmpty()) {
                    throw new ApiException(HttpStatus.CONFLICT, "SERIES_EXHAUSTED",
                            "All membership numbers of the series " + SERIES + " are used. Ask the resort for a new series.");
                }
                String membershipId = format(taken.getFirst());
                OffsetDateTime now = now();
                jdbc.update("""
                        INSERT INTO resort_member (id, membership_id, first_name, last_name, dob, mobile_e164, email, address,
                                                   tier, status, enrolled_by_id, enrolled_by_name, enrolled_by_username,
                                                   created_at, updated_at)
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'GOLD', 'PENDING_VERIFICATION', ?, ?, ?, ?, ?)""",
                        id, membershipId, c.firstName(), c.lastName(), c.dob(), c.mobile(), c.email(), c.address(),
                        by.employeeId(), by.name(), by.username(), now, now);
                jdbc.update("""
                        INSERT INTO member_payment (id, member_id, payment_type, amount, currency, transaction_id,
                                                    proof_file_key, proof_file_name, proof_content_type, proof_size_bytes,
                                                    proof_sha256, status, created_at)
                        VALUES (?, ?, ?, ?, 'INR', ?, ?, ?, ?, ?, ?, 'PENDING', ?)""",
                        UUID.randomUUID(), id, c.paymentType(), c.amount(), c.transactionId(),
                        stored == null ? null : stored.key(), stored == null ? null : stored.fileName(),
                        stored == null ? null : stored.contentType(), stored == null ? null : stored.sizeBytes(),
                        stored == null ? null : stored.sha256(), now);
                audit.record(by.actor(), "MEMBER_REGISTERED", ENTITY, id, null,
                        Map.of("membershipId", membershipId, "paymentType", c.paymentType(), "amount", c.amount().toPlainString(),
                                "proof", stored == null ? "none" : stored.sha256()), null, true);
            });
        } catch (RuntimeException e) {
            if (stored != null) proofs.delete(stored.key());
            if (e instanceof DataIntegrityViolationException d) {
                MemberView again = replay(by, idempotencyKey, hash);   // lost a race on the same key
                if (again != null) return again;
                if (mentions(d, "resort_member_email_live", "resort_member_mobile_live")) throw memberExists();
            }
            throw e;
        }
        return get(id);
    }

    private MemberView replay(Staff by, UUID key, String hash) {
        List<Map<String, Object>> rows = jdbc.queryForList(
                "SELECT request_hash, response_json::text AS response FROM idempotency_key WHERE key = ? AND actor_id = ?", key, by.employeeId());
        if (rows.isEmpty()) return null;
        if (!hash.equals(rows.getFirst().get("request_hash"))) {
            throw new ApiException(HttpStatus.CONFLICT, "IDEMPOTENCY_KEY_REUSED", "This request key was already used for a different registration.");
        }
        String memberId = json.readTree((String) rows.getFirst().get("response")).get("memberId").asString();
        return get(UUID.fromString(memberId));
    }

    private void ensureNoLiveMember(String email, String mobile) {
        Integer n = jdbc.queryForObject("""
                SELECT count(*) FROM resort_member WHERE status <> 'REJECTED' AND (email = ? OR mobile_e164 = ?)""",
                Integer.class, email, mobile);
        if (n != null && n > 0) throw memberExists();
    }

    private static ApiException memberExists() {
        return new ApiException(HttpStatus.CONFLICT, "MEMBER_EXISTS",
                "A membership with this email or mobile number already exists (pending or active).");
    }

    private static boolean mentions(Throwable e, String... names) {
        for (Throwable t = e; t != null; t = t.getCause()) {
            String m = String.valueOf(t.getMessage());
            for (String n : names) if (m.contains(n)) return true;
        }
        return false;
    }

    static Clean validate(RegisterForm f, Upload proof) {
        Map<String, String> errors = new LinkedHashMap<>();
        String first = text(f.firstName(), 100, "firstName", "Enter the first name.", errors);
        String last = text(f.lastName(), 100, "lastName", "Enter the last name.", errors);
        String address = text(f.address(), 500, "address", "Enter the complete address.", errors);

        LocalDate dob = null;
        try {
            dob = LocalDate.parse(f.dob() == null ? "" : f.dob().strip());
            if (!dob.isBefore(LocalDate.now(ZoneOffset.UTC)) || !dob.isAfter(LocalDate.of(1900, 1, 1))) {
                errors.put("dob", "Enter a real date of birth in the past.");
            }
        } catch (DateTimeParseException e) {
            errors.put("dob", "Enter the date of birth (YYYY-MM-DD).");
        }

        String mobile = normaliseMobile(f.mobile());
        if (mobile == null) errors.put("mobile", "Enter a mobile number, e.g. +91 98765 43210.");

        String email = f.email() == null ? "" : f.email().strip().toLowerCase(Locale.ROOT);
        if (email.length() > 254 || !EMAIL.matcher(email).matches()) errors.put("email", "Enter a valid email address.");

        String type = f.paymentType() == null ? "" : f.paymentType().strip().toUpperCase(Locale.ROOT);
        if (!List.of("CASH", "CARD", "SCAN_QR").contains(type)) errors.put("paymentType", "Choose Cash, Card or Scan QR.");

        BigDecimal amount = null;
        String a = f.amount() == null ? "" : f.amount().strip().replace(",", "");
        if (MONEY.matcher(a).matches() && new BigDecimal(a).signum() > 0) {
            amount = new BigDecimal(a).setScale(2, RoundingMode.UNNECESSARY);
        } else {
            errors.put("amount", "Enter the amount received in rupees, e.g. 25000 or 25000.50.");
        }

        String txn = f.transactionId() == null || f.transactionId().isBlank() ? null : f.transactionId().strip();
        if (txn != null && txn.length() > 100) errors.put("transactionId", "At most 100 characters.");
        if ("CARD".equals(type) && txn == null) errors.put("transactionId", "Enter the card transaction ID.");
        if ("SCAN_QR".equals(type) && (proof == null || proof.bytes().length == 0)) {
            errors.put("proof", "Add the payment screenshot (gallery or camera).");
        }

        if (!errors.isEmpty()) throw new FieldErrorsException(errors);
        return new Clean(first, last, dob, mobile, email, address, type, amount, txn);
    }

    private static String text(String v, int max, String field, String missing, Map<String, String> errors) {
        String s = v == null ? "" : v.strip();
        if (s.isEmpty()) errors.put(field, missing);
        else if (s.length() > max) errors.put(field, "At most " + max + " characters.");
        return s;
    }

    /** "+91 98765-43210" → "+919876543210"; a bare 10-digit Indian mobile gets +91. Null when invalid. */
    static String normaliseMobile(String raw) {
        if (raw == null) return null;
        String s = raw.replaceAll("[\\s()-]", "");
        if (s.matches("^[6-9][0-9]{9}$")) s = "+91" + s;
        return E164.matcher(s).matches() ? s : null;
    }

    // --- Verification ------------------------------------------------------------------------------------------------

    public MemberView verify(UUID id, Staff by) {
        tx.executeWithoutResult(s -> {
            Map<String, Object> m = lockPending(id);
            if (by.employeeId().equals(m.get("enrolled_by_id"))) {
                throw new ApiException(HttpStatus.FORBIDDEN, "SELF_VERIFICATION",
                        "You enrolled this member, so another Admin or Manager must verify the payment.");
            }
            OffsetDateTime now = now();
            OffsetDateTime until = now.plus(validity);
            jdbc.update("""
                    UPDATE resort_member SET status = 'ACTIVE', decided_by_id = ?, decided_at = ?, valid_from = ?, valid_until = ?,
                                             updated_at = ?, version = version + 1
                    WHERE id = ?""", by.employeeId(), now, now, until, now, id);
            jdbc.update("""
                    UPDATE member_payment SET status = 'VERIFIED', decided_by_id = ?, decided_by_username = ?, decided_at = ?
                    WHERE member_id = ?""", by.employeeId(), by.username(), now, id);
            audit.record(by.actor(), "MEMBER_VERIFIED", ENTITY, id, Map.of("status", "PENDING_VERIFICATION"),
                    Map.of("status", "ACTIVE", "validFrom", now.toString(), "validUntil", until.toString()), null, true);
        });
        // After the commit, never inside it: a mail or identity problem must not undo a verified payment.
        welcome(get(id), by);
        return get(id);
    }

    /** Sends the welcome email again (a new one-time link); creates the customer account first if that failed before. */
    public MemberView resendWelcome(UUID id, Staff by) {
        MemberView m = get(id);
        if (!"ACTIVE".equals(m.status())) {
            throw new ApiException(HttpStatus.CONFLICT, "NOT_ACTIVE", "Only an active membership has a customer account to welcome.");
        }
        welcome(m, by);
        return get(id);
    }

    /**
     * Customer account in gh-guests + welcome email, through guest-service (D-120…D-122). Records the outcome on the
     * member (guest_user_id, account_status) and in the audit log; never throws, so verification always succeeds.
     */
    private void welcome(MemberView m, Staff by) {
        UUID existing = jdbc.queryForObject("SELECT guest_user_id FROM resort_member WHERE id = ?", UUID.class, m.id());
        String validUntil = displayDate(m.validUntil());
        GuestAccounts.Result r;
        try {
            r = existing == null
                    ? guests.provision(new GuestAccounts.Welcome(m.email(), m.firstName(), m.lastName(), m.mobile(),
                            m.membershipId(), validUntil, by.username()))
                    : guests.resend(existing, validUntil, by.username());
        } catch (GuestAccounts.Unavailable e) {
            jdbc.update("UPDATE resort_member SET account_status = 'INVITE_FAILED', updated_at = ? WHERE id = ?", now(), m.id());
            audit.record(by.actor(), "MEMBER_WELCOME_FAILED", ENTITY, m.id(), null, null, "customer account service unavailable", false);
            return;
        }
        String status = r.welcomeSent() ? "INVITE_SENT" : "INVITE_FAILED";
        jdbc.update("UPDATE resort_member SET guest_user_id = ?, account_status = CASE WHEN account_status = 'ACTIVE' THEN 'ACTIVE' ELSE ? END, updated_at = ? WHERE id = ?",
                r.guestUserId(), status, now(), m.id());
        audit.record(by.actor(), r.welcomeSent() ? "MEMBER_WELCOME_SENT" : "MEMBER_WELCOME_FAILED", ENTITY, m.id(), null,
                Map.of("guestUserId", r.guestUserId().toString()), r.welcomeSent() ? null : "email not sent", r.welcomeSent());
    }

    /** "16 Nov 2027": the validity end as the customer reads it (resort time, IST). */
    static String displayDate(OffsetDateTime t) {
        return t == null ? "" : t.atZoneSameInstant(java.time.ZoneId.of("Asia/Kolkata"))
                .format(java.time.format.DateTimeFormatter.ofPattern("d MMM yyyy", Locale.ENGLISH));
    }

    public MemberView reject(UUID id, String reason, Staff by) {
        String r = reason == null ? "" : reason.strip();
        if (r.isEmpty()) throw new FieldErrorsException(Map.of("reason", "Give the reason for rejecting."));
        if (r.length() > 500) throw new FieldErrorsException(Map.of("reason", "At most 500 characters."));
        tx.executeWithoutResult(s -> {
            lockPending(id);
            OffsetDateTime now = now();
            jdbc.update("UPDATE resort_member SET status = 'REJECTED', decided_by_id = ?, decided_at = ?, updated_at = ?, version = version + 1 WHERE id = ?",
                    by.employeeId(), now, now, id);
            jdbc.update("""
                    UPDATE member_payment SET status = 'REJECTED', rejection_reason = ?, decided_by_id = ?, decided_by_username = ?,
                                              decided_at = ?
                    WHERE member_id = ?""", r, by.employeeId(), by.username(), now, id);
            audit.record(by.actor(), "MEMBER_REJECTED", ENTITY, id, Map.of("status", "PENDING_VERIFICATION"),
                    Map.of("status", "REJECTED"), r, true);
        });
        return get(id);
    }

    private Map<String, Object> lockPending(UUID id) {
        List<Map<String, Object>> rows = jdbc.queryForList("SELECT status, enrolled_by_id FROM resort_member WHERE id = ? FOR UPDATE", id);
        if (rows.isEmpty()) throw notFound();
        if (!"PENDING_VERIFICATION".equals(rows.getFirst().get("status"))) {
            throw new ApiException(HttpStatus.CONFLICT, "NOT_PENDING", "This registration was already " +
                    String.valueOf(rows.getFirst().get("status")).toLowerCase(Locale.ROOT) + ".");
        }
        return rows.getFirst();
    }

    // --- Reading -------------------------------------------------------------------------------------------------------

    private static final String SELECT = """
            SELECT m.*, p.payment_type, p.amount, p.currency, p.transaction_id, p.proof_file_key, p.proof_file_name,
                   p.proof_content_type, p.proof_size_bytes, p.proof_sha256, p.status AS payment_status, p.rejection_reason,
                   p.decided_by_username AS payment_decided_by, p.decided_at AS payment_decided_at,
                   d.username AS decided_by_username
            FROM resort_member m
            JOIN member_payment p ON p.member_id = m.id
            LEFT JOIN employee d ON d.id = m.decided_by_id
            """;

    public MemberView get(UUID id) {
        return jdbc.query(SELECT + " WHERE m.id = ?", ROW, id).stream().findFirst().orElseThrow(MembershipService::notFound);
    }

    /** For the enrolling executive only; anyone else gets 404 (no hint that the member exists). */
    public MemberView getOwn(UUID id, Staff by) {
        MemberView v = get(id);
        if (!v.enrolledBy().employeeId().equals(by.employeeId())) throw notFound();
        return v;
    }

    public PageView listOwn(Staff by, int page, int size) {
        return page(" WHERE m.enrolled_by_id = ?", List.of(by.employeeId()), page, size, false);
    }

    public PageView list(String status, String q, int page, int size) {
        StringBuilder where = new StringBuilder(" WHERE true");
        List<Object> args = new ArrayList<>();
        if (status != null && !status.isBlank()) {
            if (!List.of("PENDING_VERIFICATION", "ACTIVE", "REJECTED").contains(status)) {
                throw new FieldErrorsException(Map.of("status", "Unknown status."));
            }
            where.append(" AND m.status = ?");
            args.add(status);
        }
        if (q != null && !q.isBlank()) {
            where.append(" AND (m.membership_id ILIKE ? OR m.email ILIKE ? OR m.mobile_e164 LIKE ? OR (m.first_name || ' ' || m.last_name) ILIKE ?)");
            String like = "%" + q.strip().replace("%", "").replace("_", "") + "%";
            args.addAll(List.of(like, like, like, like));
        }
        return page(where.toString(), args, page, size, true);
    }

    private PageView page(String where, List<Object> args, int page, int size, boolean withPending) {
        int p = Math.max(page, 0), s = Math.min(Math.max(size, 1), 200);
        List<Object> all = new ArrayList<>(args);
        all.add(s);
        all.add((long) p * s);
        List<MemberView> items = jdbc.query(SELECT + where + " ORDER BY m.created_at DESC, m.membership_id DESC LIMIT ? OFFSET ?", ROW, all.toArray());
        Long total = jdbc.queryForObject("SELECT count(*) FROM resort_member m" + where, Long.class, args.toArray());
        Long pending = withPending
                ? jdbc.queryForObject("SELECT count(*) FROM resort_member WHERE status = 'PENDING_VERIFICATION'", Long.class) : null;
        return new PageView(items, p, s, total == null ? 0 : total, pending);
    }

    public record ProofFile(byte[] bytes, String contentType, String fileName) { }

    public ProofFile proof(MemberView m) {
        Map<String, Object> row = jdbc.queryForMap("SELECT proof_file_key, proof_sha256 FROM member_payment WHERE member_id = ?", m.id());
        if (row.get("proof_file_key") == null) {
            throw new ApiException(HttpStatus.NOT_FOUND, "NO_PROOF", "This payment has no screenshot.");
        }
        byte[] bytes = proofs.read((String) row.get("proof_file_key"), ((String) row.get("proof_sha256")).trim());
        return new ProofFile(bytes, m.payment().proof().contentType(), m.payment().proof().fileName());
    }

    private static final RowMapper<MemberView> ROW = (rs, i) -> {
        String proofKey = rs.getString("proof_file_key");
        Proof proof = proofKey == null ? null : new Proof(rs.getString("proof_file_name"), rs.getString("proof_content_type"),
                rs.getLong("proof_size_bytes"), rs.getString("proof_sha256").trim());
        String paymentStatus = rs.getString("payment_status");
        Payment payment = new Payment(rs.getString("payment_type"), rs.getBigDecimal("amount").setScale(2, RoundingMode.UNNECESSARY).toPlainString(),
                rs.getString("currency").trim(), rs.getString("transaction_id"), proof, paymentStatus, rs.getString("rejection_reason"),
                "VERIFIED".equals(paymentStatus) ? rs.getString("payment_decided_by") : null, odt(rs.getTimestamp("payment_decided_at")));
        return new MemberView(rs.getObject("id", UUID.class), rs.getString("membership_id"), rs.getString("first_name"),
                rs.getString("last_name"), rs.getObject("dob", LocalDate.class), rs.getString("mobile_e164"), rs.getString("email"),
                rs.getString("address"), rs.getString("tier"), rs.getString("status"),
                new EnrolledBy(rs.getObject("enrolled_by_id", UUID.class), rs.getString("enrolled_by_name"), rs.getString("enrolled_by_username")),
                rs.getString("decided_by_username"), odt(rs.getTimestamp("decided_at")), odt(rs.getTimestamp("valid_from")),
                odt(rs.getTimestamp("valid_until")), rs.getString("account_status"), odt(rs.getTimestamp("created_at")), payment);
    };

    private static OffsetDateTime odt(Timestamp t) {
        return t == null ? null : t.toInstant().atOffset(ZoneOffset.UTC);
    }

    /** UTC, cut to microseconds so what we return equals what PostgreSQL stores. */
    private static OffsetDateTime now() {
        return OffsetDateTime.now(ZoneOffset.UTC).truncatedTo(ChronoUnit.MICROS);
    }

    static ApiException notFound() {
        return new ApiException(HttpStatus.NOT_FOUND, "NOT_FOUND", "Membership not found.");
    }
}
