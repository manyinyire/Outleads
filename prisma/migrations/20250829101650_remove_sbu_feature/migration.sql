/*
  Warnings:

  - You are about to drop the column `sbu` on the `users` table. All the data in the column will be lost.
  - You are about to drop the `sbu_products` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `sbus` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."sbu_products" DROP CONSTRAINT "sbu_products_productId_fkey";

-- DropForeignKey
ALTER TABLE "public"."sbu_products" DROP CONSTRAINT "sbu_products_sbuId_fkey";

-- AlterTable
ALTER TABLE "public"."users" DROP COLUMN "sbu";

-- DropTable
DROP TABLE "public"."sbu_products";

-- DropTable
DROP TABLE "public"."sbus";
