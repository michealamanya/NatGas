-- Allow one staff account to hold multiple independent access roles.
CREATE TABLE "user_role_assignments" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "role" "UserRole" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_role_assignments_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "user_role_assignments_user_id_role_key" ON "user_role_assignments"("user_id", "role");
CREATE INDEX "user_role_assignments_user_id_idx" ON "user_role_assignments"("user_id");

ALTER TABLE "user_role_assignments" ADD CONSTRAINT "user_role_assignments_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Preserve the existing primary role as the first assignment for every account.
INSERT INTO "user_role_assignments" ("id", "user_id", "role")
SELECT md5("id" || clock_timestamp()::text || random()::text), "id", "role" FROM "users"
ON CONFLICT ("user_id", "role") DO NOTHING;
