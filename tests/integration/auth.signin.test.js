describe("auth credentials sign-in flow", () => {
  let prismaMock;
  let bcryptCompareMock;
  let extractRequestIpMock;
  let capturedConfig;

  async function loadAuthModule() {
    jest.resetModules();
    capturedConfig = null;

    prismaMock = {
      user: {
        findUnique: jest.fn(),
        update: jest.fn(),
      },
    };
    bcryptCompareMock = jest.fn();
    extractRequestIpMock = jest.fn(() => "203.0.113.5");

    jest.doMock("next-auth", () =>
      jest.fn((config) => {
        capturedConfig = config;
        return {
          handlers: { GET: jest.fn(), POST: jest.fn() },
          auth: jest.fn(),
          signIn: jest.fn(),
          signOut: jest.fn(),
        };
      })
    );
    jest.doMock("next-auth/providers/credentials", () => (options) => options);
    jest.doMock("@auth/prisma-adapter", () => ({
      PrismaAdapter: jest.fn(() => ({})),
    }));
    jest.doMock("bcryptjs", () => ({
      compare: bcryptCompareMock,
    }));
    jest.doMock("../../lib/prisma", () => ({
      __esModule: true,
      default: prismaMock,
    }));
    jest.doMock("../../lib/request-ip", () => ({
      extractRequestIp: extractRequestIpMock,
    }));

    await import("../../auth.js");
  }

  beforeEach(async () => {
    await loadAuthModule();
  });

  it("rejects sign-in when email or password is missing", async () => {
    const authorize = capturedConfig.providers[0].authorize;

    const result = await authorize({ email: "", password: "" }, { headers: new Headers() });

    expect(result).toBeNull();
    expect(prismaMock.user.findUnique).not.toHaveBeenCalled();
  });

  it("rejects sign-in when user does not exist", async () => {
    prismaMock.user.findUnique.mockResolvedValue(null);
    const authorize = capturedConfig.providers[0].authorize;

    const result = await authorize(
      { email: "missing@example.com", password: "secret123" },
      { headers: new Headers() }
    );

    expect(result).toBeNull();
    expect(prismaMock.user.findUnique).toHaveBeenCalledWith({
      where: { email: "missing@example.com" },
    });
  });

  it("rejects sign-in when password does not match", async () => {
    prismaMock.user.findUnique.mockResolvedValue({
      id: "u-1",
      email: "engineer@example.com",
      password: "hashed-password",
      emailVerified: new Date(),
      isAdmin: false,
    });
    bcryptCompareMock.mockResolvedValue(false);
    const authorize = capturedConfig.providers[0].authorize;

    const result = await authorize(
      { email: "engineer@example.com", password: "wrong-password" },
      { headers: new Headers() }
    );

    expect(result).toBeNull();
    expect(bcryptCompareMock).toHaveBeenCalledWith("wrong-password", "hashed-password");
    expect(prismaMock.user.update).not.toHaveBeenCalled();
  });

  it("rejects sign-in when email is not verified", async () => {
    prismaMock.user.findUnique.mockResolvedValue({
      id: "u-2",
      email: "pending@example.com",
      password: "hashed-password",
      emailVerified: null,
      isAdmin: false,
    });
    bcryptCompareMock.mockResolvedValue(true);
    const authorize = capturedConfig.providers[0].authorize;

    const result = await authorize(
      { email: "pending@example.com", password: "secret123" },
      { headers: new Headers() }
    );

    expect(result).toBeNull();
    expect(prismaMock.user.update).not.toHaveBeenCalled();
  });

  it("returns role claims and updates last login for verified users", async () => {
    prismaMock.user.findUnique.mockResolvedValue({
      id: "u-3",
      email: "admin@example.com",
      password: "hashed-password",
      emailVerified: new Date(),
      isAdmin: true,
      firstName: "Ada",
      lastName: "Lovelace",
      name: "",
    });
    prismaMock.user.update.mockResolvedValue({ id: "u-3" });
    bcryptCompareMock.mockResolvedValue(true);
    const authorize = capturedConfig.providers[0].authorize;

    const result = await authorize(
      { email: "Admin@Example.com", password: "secret123", rememberMe: "true" },
      { headers: new Headers([["x-real-ip", "203.0.113.5"]]) }
    );

    expect(result).toEqual({
      id: "u-3",
      email: "admin@example.com",
      isAdmin: true,
      role: "admin",
      rememberMe: true,
      name: "Ada Lovelace",
    });
    expect(extractRequestIpMock).toHaveBeenCalled();
    expect(prismaMock.user.update).toHaveBeenCalledWith({
      where: { id: "u-3" },
      data: {
        lastLogin: expect.any(Date),
        lastLoginIp: "203.0.113.5",
      },
    });
  });

  it("refreshes role in jwt callback and applies remember-me expiration", async () => {
    prismaMock.user.findUnique.mockResolvedValue({ isAdmin: false });
    const jwtCallback = capturedConfig.callbacks.jwt;
    const now = Math.floor(Date.now() / 1000);

    const token = await jwtCallback({
      token: {},
      user: { id: "u-4", rememberMe: true },
    });

    expect(token.id).toBe("u-4");
    expect(token.rememberMe).toBe(true);
    expect(token.isAdmin).toBe(false);
    expect(token.role).toBe("engineer");
    expect(token.exp).toBeGreaterThan(now);
  });

  it("downgrades token when user snapshot is missing", async () => {
    prismaMock.user.findUnique.mockResolvedValue(null);
    const jwtCallback = capturedConfig.callbacks.jwt;

    const token = await jwtCallback({
      token: { id: "missing-user" },
      user: null,
    });

    expect(token.id).toBeUndefined();
    expect(token.isAdmin).toBe(false);
    expect(token.role).toBe("engineer");
  });

  it("maps jwt claims onto session payload", async () => {
    const sessionCallback = capturedConfig.callbacks.session;
    const session = { user: {} };

    const result = await sessionCallback({
      session,
      token: { id: "u-5", isAdmin: true, role: "admin", rememberMe: true },
    });

    expect(result.user).toEqual({
      id: "u-5",
      isAdmin: true,
      role: "admin",
      rememberMe: true,
    });
  });
});
