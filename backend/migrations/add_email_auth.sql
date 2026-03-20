-- Run these on your PostgreSQL database (Railway / local)
-- They are safe to run multiple times (IF NOT EXISTS / ADD COLUMN IF NOT EXISTS)

-- 1. Add email_verified to user table
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS email_verified BOOLEAN NOT NULL DEFAULT FALSE;

-- 2. Mark existing Google users as verified (they can't have unverified emails)
UPDATE "user" SET email_verified = TRUE WHERE google_id IS NOT NULL;

-- 3. Create email verification token table
CREATE TABLE IF NOT EXISTS emailverificationtoken (
    id              SERIAL PRIMARY KEY,
    user_id         INTEGER NOT NULL,
    token           TEXT    NOT NULL UNIQUE,
    expires_at      TIMESTAMP WITHOUT TIME ZONE NOT NULL,
    used            BOOLEAN NOT NULL DEFAULT FALSE,
    created_at      TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_evt_user_id ON emailverificationtoken (user_id);
CREATE INDEX IF NOT EXISTS idx_evt_token   ON emailverificationtoken (token);

-- 4. Create password reset token table
CREATE TABLE IF NOT EXISTS passwordresettoken (
    id              SERIAL PRIMARY KEY,
    user_id         INTEGER NOT NULL,
    token           TEXT    NOT NULL UNIQUE,
    expires_at      TIMESTAMP WITHOUT TIME ZONE NOT NULL,
    used            BOOLEAN NOT NULL DEFAULT FALSE,
    created_at      TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_prt_user_id ON passwordresettoken (user_id);
CREATE INDEX IF NOT EXISTS idx_prt_token   ON passwordresettoken (token);
