const { jsonRequest, readJson } = require("../helpers/http");

describe("signup API integration flow", () => {
  let prismaMock;
  let bcryptHashMock;
  let sendVerificationEmailMock;
  let POST;

  async function loadRoute() {
    jest.resetModules();
    prismaMock = {
      user: {
        findUnique: jest.fn(),
        create: jest.fn(),
      },
      verificationToken: {
        deleteMany: jest.fn(),
        create: jest.fn(),
      },
    };
    bcryptHashMock = jest.fn().mockResolvedValue("hashed-password");
    sendVerificationEmailMock = jest.fn().mockResolvedValue({ success: true });

    jest.doMock("bcryptjs", () => ({
      hash: bcryptHashMock,
    }));
    jest.doMock("../../lib/prisma", () => ({
      __esModule: true,
      default: prismaMock,
    }));
    jest.doMock("../../lib/email-verification", () => ({
      buildVerificationUrl: jest.fn(() => "http://localhost:3000/verify-email#token=test-token"),
      createVerificationTokenRecord: jest.fn(() => ({
        rawToken: "raw-token",
        tokenHash: "hashed-token",
        expiresAt: new Date("2030-01-01T00:00:00.000Z"),
      })),
    }));
    jest.doMock("../../app/actions/sendEmail", () => ({
      sendVerificationEmail: sendVerificationEmailMock,
    }));

    ({ POST } = await import("../../app/api/signup/route.js"));
  }

  beforeEach(async () => {
    await loadRoute();
  });

  it("creates user, verification token, and sends verification email", async () => {
    prismaMock.user.findUnique.mockResolvedValue(null);
    prismaMock.user.create.mockResolvedValue({
      id: "user-1",
      firstName: "Jane",
      name: "Jane Doe",
      email: "jane@example.com",
    });

    const response = await POST(
      jsonRequest("http://localhost/api/signup", "POST", {
        firstName: "Jane",
        lastName: "Doe",
        email: "JANE@EXAMPLE.COM",
        password: "password123",
        confirmPassword: "password123",
      })
    );
    const payload = await readJson(response);

    expect(response.status).toBe(200);
    expect(payload).toEqual({ ok: true });
    expect(prismaMock.user.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        email: "jane@example.com",
        firstName: "Jane",
        lastName: "Doe",
        password: "hashed-password",
      }),
    });
    expect(prismaMock.verificationToken.deleteMany).toHaveBeenCalled();
    expect(prismaMock.verificationToken.create).toHaveBeenCalledWith({
      data: {
        identifier: "jane@example.com",
        token: "hashed-token",
        expires: new Date("2030-01-01T00:00:00.000Z"),
      },
    });
    expect(sendVerificationEmailMock).toHaveBeenCalledWith({
      to: "jane@example.com",
      name: "Jane",
      verificationUrl: "http://localhost:3000/verify-email#token=test-token",
    });
  });

  it("re-issues verification for existing unverified user without creating another user", async () => {
    prismaMock.user.findUnique.mockResolvedValue({
      id: "user-2",
      emailVerified: null,
      firstName: "Existing",
      name: "Existing User",
    });

    const response = await POST(
      jsonRequest("http://localhost/api/signup", "POST", {
        firstName: "Existing",
        lastName: "User",
        email: "existing@example.com",
        password: "password123",
        confirmPassword: "password123",
      })
    );
    const payload = await readJson(response);

    expect(response.status).toBe(200);
    expect(payload).toEqual({ ok: true });
    expect(prismaMock.user.create).not.toHaveBeenCalled();
    expect(sendVerificationEmailMock).toHaveBeenCalledTimes(1);
  });

  it("rejects invalid signup payload", async () => {
    const response = await POST(
      jsonRequest("http://localhost/api/signup", "POST", {
        firstName: "",
        lastName: "Doe",
        email: "jane@example.com",
        password: "short",
        confirmPassword: "short",
      })
    );
    const payload = await readJson(response);

    expect(response.status).toBe(400);
    expect(payload.error).toBeDefined();
    expect(prismaMock.user.create).not.toHaveBeenCalled();
  });

  it("returns server error when verification email delivery fails", async () => {
    prismaMock.user.findUnique.mockResolvedValue(null);
    prismaMock.user.create.mockResolvedValue({
      id: "user-5",
      firstName: "Failure",
      name: "Failure Case",
      email: "failure@example.com",
    });
    sendVerificationEmailMock.mockRejectedValue(new Error("smtp failed"));

    const response = await POST(
      jsonRequest("http://localhost/api/signup", "POST", {
        firstName: "Failure",
        lastName: "Case",
        email: "failure@example.com",
        password: "password123",
        confirmPassword: "password123",
      })
    );
    const payload = await readJson(response);

    expect(response.status).toBe(500);
    expect(payload).toEqual({
      error: "Sign-up is temporarily unavailable. Please try again in a few minutes.",
    });
  });
});

describe("resend verification API integration flow", () => {
  let prismaMock;
  let sendVerificationEmailMock;
  let POST;

  async function loadRoute() {
    jest.resetModules();
    prismaMock = {
      user: {
        findUnique: jest.fn(),
      },
      verificationToken: {
        deleteMany: jest.fn(),
        create: jest.fn(),
      },
    };
    sendVerificationEmailMock = jest.fn().mockResolvedValue({ success: true });

    jest.doMock("../../lib/prisma", () => ({
      __esModule: true,
      default: prismaMock,
    }));
    jest.doMock("../../lib/email-verification", () => ({
      buildVerificationUrl: jest.fn(() => "http://localhost:3000/verify-email#token=resend"),
      createVerificationTokenRecord: jest.fn(() => ({
        rawToken: "raw-token",
        tokenHash: "token-hash",
        expiresAt: new Date("2030-01-01T00:00:00.000Z"),
      })),
    }));
    jest.doMock("../../app/actions/sendEmail", () => ({
      sendVerificationEmail: sendVerificationEmailMock,
    }));

    ({ POST } = await import("../../app/api/resend-verification/route.js"));
  }

  beforeEach(async () => {
    await loadRoute();
  });

  it("returns generic success for unknown users to prevent enumeration", async () => {
    prismaMock.user.findUnique.mockResolvedValue(null);

    const response = await POST(
      jsonRequest("http://localhost/api/resend-verification", "POST", {
        email: "unknown@example.com",
      })
    );
    const payload = await readJson(response);

    expect(response.status).toBe(200);
    expect(payload).toEqual({ ok: true });
    expect(sendVerificationEmailMock).not.toHaveBeenCalled();
  });

  it("issues token and sends email for unverified users", async () => {
    prismaMock.user.findUnique.mockResolvedValue({
      id: "user-3",
      emailVerified: null,
      firstName: "Maria",
      name: "Maria User",
    });

    const response = await POST(
      jsonRequest("http://localhost/api/resend-verification", "POST", {
        email: "maria@example.com",
      })
    );
    const payload = await readJson(response);

    expect(response.status).toBe(200);
    expect(payload).toEqual({ ok: true });
    expect(prismaMock.verificationToken.create).toHaveBeenCalled();
    expect(sendVerificationEmailMock).toHaveBeenCalledWith({
      to: "maria@example.com",
      name: "Maria",
      verificationUrl: "http://localhost:3000/verify-email#token=resend",
    });
  });

  it("returns server error when resend verification email delivery fails", async () => {
    prismaMock.user.findUnique.mockResolvedValue({
      id: "user-9",
      emailVerified: null,
      firstName: "Retry",
      name: "Retry User",
    });
    sendVerificationEmailMock.mockRejectedValue(new Error("smtp failed"));

    const response = await POST(
      jsonRequest("http://localhost/api/resend-verification", "POST", {
        email: "retry@example.com",
      })
    );
    const payload = await readJson(response);

    expect(response.status).toBe(500);
    expect(payload).toEqual({
      ok: false,
      error: "Unable to resend verification email right now. Please try again later.",
    });
  });
});

describe("forgot password API integration flow", () => {
  let prismaMock;
  let sendForgotPasswordEmailMock;
  let POST;

  async function loadRoute() {
    jest.resetModules();
    prismaMock = {
      user: {
        findUnique: jest.fn(),
        update: jest.fn(),
      },
    };
    sendForgotPasswordEmailMock = jest.fn().mockResolvedValue({ success: true });

    jest.doMock("../../lib/prisma", () => ({
      __esModule: true,
      default: prismaMock,
    }));
    jest.doMock("../../app/actions/sendEmail", () => ({
      sendForgotPasswordEmail: sendForgotPasswordEmailMock,
    }));

    ({ POST } = await import("../../app/api/forgot-password/route.js"));
  }

  beforeEach(async () => {
    await loadRoute();
  });

  it("returns generic success for missing users", async () => {
    prismaMock.user.findUnique.mockResolvedValue(null);

    const response = await POST(
      jsonRequest("http://localhost/api/forgot-password", "POST", {
        email: "ghost@example.com",
      })
    );
    const payload = await readJson(response);

    expect(response.status).toBe(200);
    expect(payload).toEqual({ ok: true });
    expect(sendForgotPasswordEmailMock).not.toHaveBeenCalled();
  });

  it("creates reset token state and sends reset email for existing users", async () => {
    prismaMock.user.findUnique.mockResolvedValue({
      id: "user-4",
      email: "sam@example.com",
      firstName: "Sam",
      name: "Sam User",
    });
    prismaMock.user.update.mockResolvedValue({ id: "user-4" });

    const response = await POST(
      jsonRequest("http://localhost/api/forgot-password", "POST", {
        email: "sam@example.com",
      })
    );
    const payload = await readJson(response);

    expect(response.status).toBe(200);
    expect(payload).toEqual({ ok: true });
    expect(prismaMock.user.update).toHaveBeenCalledTimes(2);
    expect(sendForgotPasswordEmailMock).toHaveBeenCalledWith({
      to: "sam@example.com",
      name: "Sam",
      resetUrl: expect.stringContaining("/reset-password?token="),
    });
  });

  it("returns server error when forgot-password email delivery fails", async () => {
    prismaMock.user.findUnique.mockResolvedValue({
      id: "user-10",
      email: "mailfail@example.com",
      firstName: "Mail",
      name: "Mail Failure",
    });
    prismaMock.user.update.mockResolvedValue({ id: "user-10" });
    sendForgotPasswordEmailMock.mockRejectedValue(new Error("smtp failed"));

    const response = await POST(
      jsonRequest("http://localhost/api/forgot-password", "POST", {
        email: "mailfail@example.com",
      })
    );
    const payload = await readJson(response);

    expect(response.status).toBe(500);
    expect(payload).toEqual({
      ok: false,
      error: "Unable to process forgot password request right now. Please try again later.",
    });
  });
});
