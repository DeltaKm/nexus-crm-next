/*
  Warnings:

  - You are about to drop the column `created_at` on the `clients` table. All the data in the column will be lost.
  - You are about to drop the column `tax_id` on the `clients` table. All the data in the column will be lost.
  - You are about to drop the column `updated_at` on the `clients` table. All the data in the column will be lost.
  - Added the required column `updatedAt` to the `clients` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "clients" DROP COLUMN "created_at",
DROP COLUMN "tax_id",
DROP COLUMN "updated_at",
ADD COLUMN     "category" TEXT NOT NULL DEFAULT 'standard',
ADD COLUMN     "company" TEXT,
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "lastContact" TIMESTAMP(3),
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ALTER COLUMN "status" SET DEFAULT 'active';
