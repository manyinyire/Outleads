-- AlterTable
ALTER TABLE "users" ALTER COLUMN "role" DROP DEFAULT;

-- CreateEnum
CREATE TYPE "Role_new" AS ENUM ('ADMIN', 'BSS', 'INFOSEC', 'AGENT', 'SUPERVISOR');

-- AlterTable
ALTER TABLE "users" ALTER COLUMN "role" TYPE "Role_new" USING ("role"::text::"Role_new");

-- DropEnum
ALTER TYPE "Role" RENAME TO "Role_old";
ALTER TYPE "Role_new" RENAME TO "Role";
DROP TYPE "Role_old";

-- AlterTable
ALTER TABLE "users" ALTER COLUMN "role" SET DEFAULT 'AGENT';
ALTER TABLE "users" ALTER COLUMN "password" DROP NOT NULL;
