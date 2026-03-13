Remove the concept end to end rather than hiding it in the UI. The recommended approach is a hard contract change: delete the Prisma enum/column, remove approval-specific API behavior and audit generation, remove all task approval UI from panes/forms/lists, update tests and docs, keep old approval audit rows as history, and reject any legacy task payloads that still send `approvalStatus`.

## Steps

1. Remove the data model in [prisma/schema.prisma](prisma/schema.prisma#L59) by deleting `TaskApprovalStatus`, `Task.approvalStatus`, and the approval-status index on `Task`. Add a new migration that drops the `approval_status` column, its index, and then the enum type. Regenerate Prisma after that.
2. Simplify shared task API contract code in [app/api/tasks/shared.js](app/api/tasks/shared.js#L1) by removing approval parsing, query-filter extraction, Prisma where-clause support, and the `approvalStatus` field from `toTaskDto()`.
3. Remove create-time approval behavior from [app/api/tasks/route.js](app/api/tasks/route.js#L1): no approval parsing, no admin/non-admin approval rules, no create defaults, and no approval metadata in task-created audit entries. Replace it with explicit removed-field validation so `approvalStatus` and `approval_status` now return `400`.
4. Remove update-time approval behavior from [app/api/tasks/[taskId]/route.js](app/api/tasks/%5BtaskId%5D/route.js#L1): delete approval change tracking in `buildTaskChanges()`, remove admin-only approval guards, remove approval update handling, and stop generating `task.approved` / `task.rejected` audit entries. Keep existing historical audit rows untouched.
5. Remove admin UI affordances in [app/components/tasks/shared.js](app/components/tasks/shared.js#L1), [app/components/admin/task-form.js](app/components/admin/task-form.js), [app/components/admin/task-list.js](app/components/admin/task-list.js), [app/components/admin-dashboard/panels/tasks-panel.js](app/components/admin-dashboard/panels/tasks-panel.js), and [app/components/admin-dashboard/index.js](app/components/admin-dashboard/index.js#L62). That includes the approval options, filter, chip color helper, task-form field, list chip, filter state, reset logic, edit hydration, and submit payload field.
6. Remove engineer UI affordances in [app/components/engineer-account/tasks-panel.js](app/components/engineer-account/tasks-panel.js) and [app/components/engineer-account/index.js](app/components/engineer-account/index.js#L1), including the approval filter control, status chip, filter state, reset logic, and approval input passed into `filterTasks()`.
7. Update tests and fixtures in [tests/integration/tasks.form-persistence.behavior.test.js](tests/integration/tasks.form-persistence.behavior.test.js), [tests/integration/access-control/tasks-api.access-control.test.js](tests/integration/access-control/tasks-api.access-control.test.js), [tests/ui/admin-dashboard/tasks-panel.behavior.test.js](tests/ui/admin-dashboard/tasks-panel.behavior.test.js), [tests/ui/engineer-account/tasks-panel.behavior.test.js](tests/ui/engineer-account/tasks-panel.behavior.test.js), and [tests/integration/error-handling/api-routes.graceful-errors.test.js](tests/integration/error-handling/api-routes.graceful-errors.test.js). Replace the old approval-permission assertion with coverage that legacy approval fields are rejected.
8. Remove product/docs references in [docs/PRD.md](docs/PRD.md) and [docs/MVP_BACKLOG.md](docs/MVP_BACKLOG.md), then do a final repo-wide search for `approvalStatus`, `approval_status`, `TaskApprovalStatus`, and `taskApproval`.

## Verification

1. Regenerate Prisma and confirm the generated client no longer exposes `TaskApprovalStatus` or `Task.approvalStatus`.
2. Run a final text search for approval-status identifiers and confirm only intentionally preserved historical migration content remains.
3. Run the affected task UI/API test suites listed above.
4. Run lint and the app locally, then verify admin and engineer task panes still support create, edit, delete, and complete flows without any approval UI.
5. Manually hit task create/update endpoints with `approvalStatus` or `approval_status` and confirm they now return `400`.
6. Verify the audit log still shows generic task actions correctly and that no new approval actions are created.

## Decisions

- Legacy task API inputs should be rejected, not ignored.
- Existing `task.approved` and `task.rejected` audit rows stay as historical data.
- Scope includes panes, forms, models, API contracts, audits, tests, and docs.
- Scope excludes rewriting old audit-log records already stored in the database.
