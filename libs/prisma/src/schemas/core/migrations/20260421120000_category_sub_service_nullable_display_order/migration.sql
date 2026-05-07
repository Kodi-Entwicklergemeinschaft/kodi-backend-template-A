-- AlterTable: allow null displayOrder so new links default to inheriting tile order in API
-- Column name is camelCase (quoted) — matches 20260408000000_add_category_sub_services
ALTER TABLE "category_sub_services" ALTER COLUMN "displayOrder" DROP DEFAULT;
ALTER TABLE "category_sub_services" ALTER COLUMN "displayOrder" DROP NOT NULL;
