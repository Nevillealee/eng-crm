describe("Given admin dashboard page access control", () => {
  it("When no session exists, then the page redirects to /login", async () => {
    jest.resetModules();

    const redirectMock = jest.fn(() => {
      throw new Error("redirect:/login");
    });

    jest.doMock("../../../auth", () => ({
      auth: jest.fn().mockResolvedValue(null),
    }));
    jest.doMock("next/navigation", () => ({
      redirect: redirectMock,
    }));
    jest.doMock("../../../app/components/admin-dashboard", () => ({
      __esModule: true,
      default: function MockAdminDashboard() {
        return null;
      },
    }));

    const { default: AdminPage } = await import("../../../app/admin/page.js");

    await expect(AdminPage()).rejects.toThrow("redirect:/login");
    expect(redirectMock).toHaveBeenCalledWith("/login");
  });

  it("When a non-admin session exists, then the page redirects to /engineer", async () => {
    jest.resetModules();

    const redirectMock = jest.fn((path) => {
      throw new Error(`redirect:${path}`);
    });

    jest.doMock("../../../auth", () => ({
      auth: jest.fn().mockResolvedValue({
        user: { id: "eng-1", role: "engineer", email: "eng1@example.com" },
      }),
    }));
    jest.doMock("next/navigation", () => ({
      redirect: redirectMock,
    }));
    jest.doMock("../../../app/components/admin-dashboard", () => ({
      __esModule: true,
      default: function MockAdminDashboard() {
        return null;
      },
    }));

    const { default: AdminPage } = await import("../../../app/admin/page.js");

    await expect(AdminPage()).rejects.toThrow("redirect:/engineer");
    expect(redirectMock).toHaveBeenCalledWith("/engineer");
  });

  it("When an admin session exists, then the admin dashboard is returned", async () => {
    jest.resetModules();

    const redirectMock = jest.fn();
    const dashboardMock = jest.fn(() => null);
    const session = {
      user: { id: "admin-1", role: "admin", email: "admin@example.com" },
    };

    jest.doMock("../../../auth", () => ({
      auth: jest.fn().mockResolvedValue(session),
    }));
    jest.doMock("next/navigation", () => ({
      redirect: redirectMock,
    }));
    jest.doMock("../../../app/components/admin-dashboard", () => ({
      __esModule: true,
      default: dashboardMock,
    }));

    const { default: AdminPage } = await import("../../../app/admin/page.js");
    const page = await AdminPage();

    expect(redirectMock).not.toHaveBeenCalled();
    expect(page).toEqual(
      expect.objectContaining({
        props: expect.objectContaining({ session }),
      })
    );
  });
});
