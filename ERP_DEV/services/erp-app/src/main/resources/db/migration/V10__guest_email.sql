-- V10: optional guest email for the Guest 360 profile.
-- Forward-only. Nullable so every existing guest row is preserved unchanged.
-- Email is contact data, not an identity key; duplicate emails are allowed.
ALTER TABLE guest ADD COLUMN email VARCHAR(320);
CREATE INDEX idx_guest_property_email ON guest (property_id, email);
