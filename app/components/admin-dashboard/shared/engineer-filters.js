export function filterEngineers({
  engineers,
  query,
  cityFilter,
  availabilityFilter,
}) {
  const normalizedQuery = (query || "").trim().toLowerCase();

  return engineers.filter((engineer) => {
    if (cityFilter !== "all" && (engineer.city || "") !== cityFilter) {
      return false;
    }

    if (
      availabilityFilter !== "all" &&
      (engineer.availabilityStatus || "") !== availabilityFilter
    ) {
      return false;
    }

    if (!normalizedQuery) {
      return true;
    }

    const haystack = [
      engineer.email,
      engineer.firstName,
      engineer.lastName,
      engineer.name,
      engineer.city,
      ...(Array.isArray(engineer.skills) ? engineer.skills : []),
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    return haystack.includes(normalizedQuery);
  });
}
