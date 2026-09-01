ALTER TABLE "products" ADD COLUMN "price" DECIMAL(12,2);
ALTER TABLE "products" ADD COLUMN "compare_at_price" DECIMAL(12,2);
ALTER TABLE "products" ADD COLUMN "currency" TEXT NOT NULL DEFAULT 'UGX';
ALTER TABLE "order_items" ADD COLUMN "unit_price" DECIMAL(12,2);
ALTER TABLE "order_items" ADD COLUMN "line_total" DECIMAL(12,2);
