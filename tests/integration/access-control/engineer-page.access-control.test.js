describe("Given engineer page access control", () => {
  it("When session user id is missing, then /engineer redirects to /login before querying Prisma", async () => {
    jest.resetModules();

    const redirectMock = jest.fn((path) => {
      throw new Error(`redirect:${path}`);
    });
    const prismaMock = {
      user: {
        findUnique: jest.fn(),
      },
    };

    jest.doMock("../../../auth", () => ({
      auth: jest.fn().mockResolvedValue({
        user: { role: "engineer", email: "eng@example.com" },
      }),
    }));
    jest.doMock("next/navigation", () => ({
      redirect: redirectMock,
    }));
    jest.doMock("../../../lib/prisma", () => ({
      __esModule: true,
      default: prismaMock,
    }));
    jest.doMock("../../../app/components/engineer-account", () => ({
      __esModule: true,
      default: function MockEngineerAccount() {
        return null;
      },
    }));
    jest.doMock("../../../app/components/engineer-onboarding-wizard", () => ({
      __esModule: true,
      default: function MockEngineerOnboardingWizard() {
        return null;
      },
    }));

    const { default: EngineerPage } = await import("../../../app/engineer/page.js");

    await expect(EngineerPage()).rejects.toThrow("redirect:/login");
    expect(redirectMock).toHaveBeenCalledWith("/login");
    expect(prismaMock.user.findUnique).not.toHaveBeenCalled();
  });

  it("When session user id is missing, then /engineer/account redirects to /login before querying Prisma", async () => {
    jest.resetModules();

    const redirectMock = jest.fn((path) => {
      throw new Error(`redirect:${path}`);
    });
    const prismaMock = {
      user: {
        findUnique: jest.fn(),
      },
    };

    jest.doMock("../../../auth", () => ({
      auth: jest.fn().mockResolvedValue({
        user: { role: "engineer", email: "eng@example.com" },
      }),
    }));
    jest.doMock("next/navigation", () => ({
      redirect: redirectMock,
    }));
    jest.doMock("../../../lib/prisma", () => ({
      __esModule: true,
      default: prismaMock,
    }));
    jest.doMock("../../../app/components/engineer-account", () => ({
      __esModule: true,
      default: function MockEngineerAccount() {
        return null;
      },
    }));

    const { default: EngineerAccountPage } = await import("../../../app/engineer/account/page.js");

    await expect(EngineerAccountPage()).rejects.toThrow("redirect:/login");
    expect(redirectMock).toHaveBeenCalledWith("/login");
    expect(prismaMock.user.findUnique).not.toHaveBeenCalled();
  });
});
