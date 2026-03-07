-- AlterTable
ALTER TABLE "users" ADD COLUMN     "sms_consent" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "sms_consent_at" TIMESTAMP(3);
