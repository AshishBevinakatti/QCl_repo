-- V1__init_lead_schema.sql: Initial schema for Lead Management & Guest Portal Microservice

CREATE TABLE IF NOT EXISTS portal_guest (
    id UUID PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    phone VARCHAR(30) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL
);

CREATE TABLE IF NOT EXISTS lead (
    id UUID PRIMARY KEY,
    public_reference VARCHAR(50) NOT NULL UNIQUE,
    portal_guest_id UUID REFERENCES portal_guest(id),
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL,
    phone VARCHAR(30) NOT NULL,
    checkin_date DATE NOT NULL,
    checkout_date DATE NOT NULL,
    room_category VARCHAR(100) NOT NULL,
    guest_count INT NOT NULL DEFAULT 1,
    notes TEXT,
    status VARCHAR(30) NOT NULL,
    priority VARCHAR(20) NOT NULL DEFAULT 'MEDIUM',
    assigned_to VARCHAR(100),
    claimed_by VARCHAR(100),
    claimed_at TIMESTAMP WITH TIME ZONE,
    sla_deadline TIMESTAMP WITH TIME ZONE NOT NULL,
    sla_breached BOOLEAN NOT NULL DEFAULT FALSE,
    voice_escalation_triggered BOOLEAN NOT NULL DEFAULT FALSE,
    erp_guest_id UUID,
    erp_reservation_id UUID,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL
);

CREATE TABLE IF NOT EXISTS lead_activity (
    id UUID PRIMARY KEY,
    lead_id UUID NOT NULL REFERENCES lead(id) ON DELETE CASCADE,
    actor VARCHAR(100) NOT NULL,
    activity_type VARCHAR(50) NOT NULL,
    description TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_lead_status ON lead(status);
CREATE INDEX IF NOT EXISTS idx_lead_sla ON lead(status, sla_deadline, sla_breached);
CREATE INDEX IF NOT EXISTS idx_lead_created_at ON lead(created_at);
CREATE INDEX IF NOT EXISTS idx_portal_guest_email ON portal_guest(email);
