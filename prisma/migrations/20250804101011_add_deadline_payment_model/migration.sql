/*
  Warnings:

  - You are about to drop the column `due_date` on the `projects` table. All the data in the column will be lost.
  - You are about to drop the column `hourly_rate` on the `projects` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "projects" DROP COLUMN "due_date",
DROP COLUMN "hourly_rate",
ADD COLUMN     "completed" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "end_date" TIMESTAMP(3),
ADD COLUMN     "repository" TEXT,
ALTER COLUMN "status" SET DEFAULT 'planning';

-- CreateTable
CREATE TABLE "deadline_payments" (
    "id" TEXT NOT NULL,
    "insert_date" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "due_date" TIMESTAMP(3) NOT NULL,
    "payment_type" TEXT,
    "description" TEXT,
    "due_notes" TEXT,
    "amount" DOUBLE PRECISION NOT NULL,
    "is_paid" BOOLEAN NOT NULL DEFAULT false,
    "payment_date" TIMESTAMP(3),
    "payment_notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "client_id" TEXT,
    "project_id" TEXT,
    "document_id" TEXT,

    CONSTRAINT "deadline_payments_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "deadline_payments" ADD CONSTRAINT "deadline_payments_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deadline_payments" ADD CONSTRAINT "deadline_payments_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE SET NULL ON UPDATE CASCADE;
