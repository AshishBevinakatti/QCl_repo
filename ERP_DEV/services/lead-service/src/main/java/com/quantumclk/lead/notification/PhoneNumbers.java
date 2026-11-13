package com.quantumclk.lead.notification;

import java.util.regex.Pattern;

public final class PhoneNumbers {

    // shortcut: E.164 shape check only (no per-country rules); switch to libphonenumber if staff numbers span many countries.
    private static final Pattern E164_DIGITS = Pattern.compile("^[1-9]\\d{7,14}$");

    private PhoneNumbers() {
    }

    /** Returns the number as E.164 digits without '+', or null if it is not a valid number. */
    public static String normalize(String raw) {
        if (raw == null) {
            return null;
        }
        String digits = raw.replaceAll("[\\s().+-]", "");
        return E164_DIGITS.matcher(digits).matches() ? digits : null;
    }

    /** "919876543210" -> "+91******3210". */
    public static String mask(String digits) {
        if (digits == null || digits.length() < 6) {
            return "****";
        }
        return "+" + digits.substring(0, 2) + "*".repeat(digits.length() - 6) + digits.substring(digits.length() - 4);
    }
}
