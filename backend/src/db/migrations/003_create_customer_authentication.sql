
-- Migration 003: Customer authentication foundation
-- Database: hk_gem_house_dev

-- 1. User accounts
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    email VARCHAR(320) NOT NULL,
    full_name VARCHAR(180) NOT NULL,
    company_name VARCHAR(180),
    phone VARCHAR(40),

    password_hash TEXT NOT NULL,

    -- Customer registration is public.
    -- Admin accounts must be provisioned separately.
    account_type VARCHAR(20) NOT NULL DEFAULT 'customer'
        CHECK (account_type IN ('customer', 'admin')),

    status VARCHAR(30) NOT NULL DEFAULT 'pending_verification'
        CHECK (status IN ('pending_verification', 'active', 'suspended')),

    email_verified_at TIMESTAMPTZ,
    last_login_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Email comparisons will be case-insensitive.
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email_lower
    ON users (LOWER(email));

CREATE INDEX IF NOT EXISTS idx_users_account_type_status
    ON users (account_type, status);


-- 2. Server-side PostgreSQL sessions
-- Compatible with the connect-pg-simple session store.
CREATE TABLE IF NOT EXISTS user_sessions (
    sid VARCHAR NOT NULL COLLATE "default" PRIMARY KEY,
    sess JSON NOT NULL,
    expire TIMESTAMP(6) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_user_sessions_expire
    ON user_sessions (expire);


-- 3. Email verification tokens
-- Only SHA-256 token hashes are stored, never raw tokens.
CREATE TABLE IF NOT EXISTS email_verification_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    user_id UUID NOT NULL
        REFERENCES users(id) ON DELETE CASCADE,

    token_hash CHAR(64) NOT NULL UNIQUE,

    expires_at TIMESTAMPTZ NOT NULL,
    used_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_email_verification_user
    ON email_verification_tokens (user_id);

CREATE INDEX IF NOT EXISTS idx_email_verification_expiry
    ON email_verification_tokens (expires_at);


-- 4. Password reset tokens
CREATE TABLE IF NOT EXISTS password_reset_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    user_id UUID NOT NULL
        REFERENCES users(id) ON DELETE CASCADE,

    token_hash CHAR(64) NOT NULL UNIQUE,

    expires_at TIMESTAMPTZ NOT NULL,
    used_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_password_reset_user
    ON password_reset_tokens (user_id);

CREATE INDEX IF NOT EXISTS idx_password_reset_expiry
    ON password_reset_tokens (expires_at);
