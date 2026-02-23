const { filterEngineers } = require("../../../app/components/admin-dashboard/shared/engineer-filters");

describe("Given engineer filtering in the admin dashboard", () => {
  const engineers = [
    {
      id: "eng-1",
      email: "cebu@example.com",
      city: "Cebu",
      availabilityStatus: "available",
      skills: ["JavaScript"],
    },
    {
      id: "eng-2",
      email: "manila@example.com",
      city: "Manila",
      availabilityStatus: "available",
      skills: ["Python"],
    },
    {
      id: "eng-3",
      email: "davao@example.com",
      city: "Davao",
      availabilityStatus: "unavailable",
      skills: ["Go"],
    },
  ];

  it("When a city filter is selected, then only engineers from that city are returned", () => {
    const filtered = filterEngineers({
      engineers,
      query: "",
      cityFilter: "Manila",
      availabilityFilter: "all",
    });

    expect(filtered).toHaveLength(1);
    expect(filtered[0].email).toBe("manila@example.com");
  });

  it("When city and availability filters are both set, then both filters are applied", () => {
    const filtered = filterEngineers({
      engineers,
      query: "",
      cityFilter: "Davao",
      availabilityFilter: "available",
    });

    expect(filtered).toEqual([]);
  });

  it("When city filter is all, then city does not restrict results", () => {
    const filtered = filterEngineers({
      engineers,
      query: "",
      cityFilter: "all",
      availabilityFilter: "available",
    });

    expect(filtered).toHaveLength(2);
    expect(filtered.map((item) => item.email).sort()).toEqual([
      "cebu@example.com",
      "manila@example.com",
    ]);
  });
});
