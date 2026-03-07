-- AlterTable
ALTER TABLE "users" ADD COLUMN     "email_verified" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "users" ADD COLUMN     "phone_verified" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "users" ADD COLUMN     "email_verification_token" TEXT;
ALTER TABLE "users" ADD COLUMN     "email_verification_expires_at" TIMESTAMPTZ;
ALTER TABLE "users" ADD COLUMN     "phone_verification_code" TEXT;
ALTER TABLE "users" ADD COLUMN     "phone_verification_expires_at" TIMESTAMPTZ;

-- Existing users are treated as already verified so they are not locked out
UPDATE "users" SET "email_verified" = true, "phone_verified" = true;
