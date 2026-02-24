function sortedIds(values) {
  return [...values].sort((left, right) => left.localeCompare(right));
}

export function isEndDateBeforeStartDate(startDate, endDate) {
  if (!startDate || !endDate) {
    return false;
  }

  return new Date(endDate).getTime() < new Date(startDate).getTime();
}

export function buildProjectChanges({
  previousProject,
  updatedProject,
  hasName,
  hasClientName,
  hasStatus,
  hasCostPhp,
  hasCurrencyCode,
  hasStartDate,
  hasEndDate,
  hasAdminNotes,
  hasTeamMemberIds,
}) {
  const previousTeamMemberIds = sortedIds(
    (previousProject.memberships || []).map((membership) => membership.userId)
  );
  const updatedTeamMemberIds = sortedIds(
    (updatedProject.memberships || []).map((membership) => membership.userId)
  );
  const changes = {};

  if (hasName && previousProject.name !== updatedProject.name) {
    changes.name = { before: previousProject.name, after: updatedProject.name };
  }

  if (hasClientName && previousProject.clientName !== updatedProject.clientName) {
    changes.clientName = { before: previousProject.clientName, after: updatedProject.clientName };
  }

  if (hasStatus && previousProject.status !== updatedProject.status) {
    changes.status = { before: previousProject.status, after: updatedProject.status };
  }

  if (hasCostPhp && previousProject.costPhp !== updatedProject.costPhp) {
    changes.costPhp = { before: previousProject.costPhp, after: updatedProject.costPhp };
  }

  if (hasCurrencyCode && previousProject.currencyCode !== updatedProject.currencyCode) {
    changes.currencyCode = {
      before: previousProject.currencyCode,
      after: updatedProject.currencyCode,
    };
  }

  if (hasStartDate && previousProject.startDate?.getTime() !== updatedProject.startDate?.getTime()) {
    changes.startDate = { before: previousProject.startDate, after: updatedProject.startDate };
  }

  if (hasEndDate && (previousProject.endDate?.getTime() || null) !== (updatedProject.endDate?.getTime() || null)) {
    changes.endDate = { before: previousProject.endDate, after: updatedProject.endDate };
  }

  if (hasAdminNotes && (previousProject.adminNotes || null) !== (updatedProject.adminNotes || null)) {
    changes.adminNotes = {
      before: previousProject.adminNotes || null,
      after: updatedProject.adminNotes || null,
    };
  }

  if (hasTeamMemberIds && JSON.stringify(previousTeamMemberIds) !== JSON.stringify(updatedTeamMemberIds)) {
    changes.teamMemberIds = {
      before: previousTeamMemberIds,
      after: updatedTeamMemberIds,
    };
  }

  return changes;
}
