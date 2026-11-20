CREATE TABLE "user_access_policies" (
  "id" TEXT NOT NULL,
  "user_id" TEXT NOT NOT NULL,
  "can_login" BOOLEAN NOT NULL DEFAULT true,
  "allowed_from" TIMESTAMP(3),
  "allowed_until" TIMESTAMP(3),
  "allowed_weekdays" JSONB,
  "allowed_modules" JSONB,
  "ip_allowlist" JSONB,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "user_access_policies_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "user_access_policies_user_id_key" ON "user_access_policies"("user_id");
ALTER TABLE "user_access_policies"
  ADD CONSTRAINT "user_access_policies_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "users"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
