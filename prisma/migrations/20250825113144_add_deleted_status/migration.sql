/*
  Warnings:

  - You are about to alter the column `campaign_name` on the `campaigns` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(255)`.
  - You are about to alter the column `organization_name` on the `campaigns` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(255)`.
  - You are about to alter the column `uniqueLink` on the `campaigns` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(100)`.
  - You are about to alter the column `fullName` on the `leads` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(255)`.
  - You are about to alter the column `phoneNumber` on the `leads` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(20)`.
  - You are about to alter the column `name` on the `permissions` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(100)`.
  - You are about to alter the column `name` on the `product_categories` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(255)`.
  - You are about to alter the column `name` on the `products` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(255)`.
  - You are about to alter the column `name` on the `sectors` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(255)`.
  - You are about to alter the column `key` on the `settings` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(100)`.
  - You are about to alter the column `email` on the `users` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(255)`.
  - You are about to alter the column `username` on the `users` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(100)`.
  - You are about to alter the column `password` on the `users` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(255)`.
  - You are about to alter the column `name` on the `users` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(255)`.
  - You are about to alter the column `sbu` on the `users` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(100)`.

*/
-- AlterEnum
ALTER TYPE "public"."Status" ADD VALUE 'DELETED';

-- AlterTable
ALTER TABLE "public"."campaigns" ALTER COLUMN "campaign_name" SET DATA TYPE VARCHAR(255),
ALTER COLUMN "organization_name" SET DATA TYPE VARCHAR(255),
ALTER COLUMN "uniqueLink" SET DATA TYPE VARCHAR(100);

-- AlterTable
ALTER TABLE "public"."leads" ALTER COLUMN "fullName" SET DATA TYPE VARCHAR(255),
ALTER COLUMN "phoneNumber" SET DATA TYPE VARCHAR(20);

-- AlterTable
ALTER TABLE "public"."permissions" ALTER COLUMN "name" SET DATA TYPE VARCHAR(100);

-- AlterTable
ALTER TABLE "public"."product_categories" ALTER COLUMN "name" SET DATA TYPE VARCHAR(255);

-- AlterTable
ALTER TABLE "public"."products" ALTER COLUMN "name" SET DATA TYPE VARCHAR(255);

-- AlterTable
ALTER TABLE "public"."sectors" ALTER COLUMN "name" SET DATA TYPE VARCHAR(255);

-- AlterTable
ALTER TABLE "public"."settings" ALTER COLUMN "key" SET DATA TYPE VARCHAR(100);

-- AlterTable
ALTER TABLE "public"."users" ALTER COLUMN "email" SET DATA TYPE VARCHAR(255),
ALTER COLUMN "username" SET DATA TYPE VARCHAR(100),
ALTER COLUMN "password" SET DATA TYPE VARCHAR(255),
ALTER COLUMN "name" SET DATA TYPE VARCHAR(255),
ALTER COLUMN "sbu" SET DATA TYPE VARCHAR(100);

-- CreateIndex
CREATE INDEX "campaigns_createdById_idx" ON "public"."campaigns"("createdById");

-- CreateIndex
CREATE INDEX "campaigns_is_active_idx" ON "public"."campaigns"("is_active");

-- CreateIndex
CREATE INDEX "campaigns_createdAt_idx" ON "public"."campaigns"("createdAt");

-- CreateIndex
CREATE INDEX "leads_sectorId_idx" ON "public"."leads"("sectorId");

-- CreateIndex
CREATE INDEX "leads_campaignId_idx" ON "public"."leads"("campaignId");

-- CreateIndex
CREATE INDEX "leads_createdAt_idx" ON "public"."leads"("createdAt");

-- CreateIndex
CREATE INDEX "permissions_name_idx" ON "public"."permissions"("name");

-- CreateIndex
CREATE INDEX "product_categories_name_idx" ON "public"."product_categories"("name");

-- CreateIndex
CREATE INDEX "products_name_idx" ON "public"."products"("name");

-- CreateIndex
CREATE INDEX "products_categoryId_idx" ON "public"."products"("categoryId");

-- CreateIndex
CREATE INDEX "role_permissions_role_idx" ON "public"."role_permissions"("role");

-- CreateIndex
CREATE INDEX "role_permissions_permissionId_idx" ON "public"."role_permissions"("permissionId");

-- CreateIndex
CREATE INDEX "sectors_name_idx" ON "public"."sectors"("name");

-- CreateIndex
CREATE INDEX "settings_key_idx" ON "public"."settings"("key");

-- CreateIndex
CREATE INDEX "users_email_idx" ON "public"."users"("email");

-- CreateIndex
CREATE INDEX "users_status_idx" ON "public"."users"("status");

-- CreateIndex
CREATE INDEX "users_role_idx" ON "public"."users"("role");
