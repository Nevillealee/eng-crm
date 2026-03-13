-- DropIndex
DROP INDEX IF EXISTS "tasks_approval_status_idx";

-- AlterTable
ALTER TABLE "tasks" DROP COLUMN "approval_status";

-- DropEnum
DROP TYPE "TaskApprovalStatus";
