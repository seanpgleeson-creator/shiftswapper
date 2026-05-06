-- Add attempt counters for 6-digit code brute-force protection
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "phone_verification_attempts" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "password_reset_attempts" INTEGER NOT NULL DEFAULT 0;
