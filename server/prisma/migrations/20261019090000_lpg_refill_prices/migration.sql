-- Set the supplied end-user refill prices only where a product has no price.
-- Existing admin-maintained prices are preserved.
UPDATE "products" SET "price" = 31000
WHERE "slug" = '3kg-lpg-cylinder' AND "price" IS NULL;

UPDATE "products" SET "price" = 59000
WHERE "slug" = '6kg-lpg-cylinder' AND "price" IS NULL;

UPDATE "products" SET "price" = 115000
WHERE "slug" = '125kg-lpg-cylinder' AND "price" IS NULL;

UPDATE "products" SET "price" = 268000
WHERE "slug" = '38kg-gas-cylinder' AND "price" IS NULL;
