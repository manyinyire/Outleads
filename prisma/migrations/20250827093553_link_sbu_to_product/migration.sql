-- CreateTable
CREATE TABLE "public"."sbus" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sbus_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."sbu_products" (
    "id" TEXT NOT NULL,
    "sbuId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sbu_products_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "sbus_name_key" ON "public"."sbus"("name");

-- CreateIndex
CREATE INDEX "sbus_name_idx" ON "public"."sbus"("name");

-- CreateIndex
CREATE INDEX "sbu_products_sbuId_idx" ON "public"."sbu_products"("sbuId");

-- CreateIndex
CREATE INDEX "sbu_products_productId_idx" ON "public"."sbu_products"("productId");

-- CreateIndex
CREATE UNIQUE INDEX "sbu_products_sbuId_productId_key" ON "public"."sbu_products"("sbuId", "productId");

-- AddForeignKey
ALTER TABLE "public"."sbu_products" ADD CONSTRAINT "sbu_products_sbuId_fkey" FOREIGN KEY ("sbuId") REFERENCES "public"."sbus"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."sbu_products" ADD CONSTRAINT "sbu_products_productId_fkey" FOREIGN KEY ("productId") REFERENCES "public"."products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
