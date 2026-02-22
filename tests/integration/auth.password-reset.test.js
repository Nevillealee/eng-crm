const crypto = require("crypto");
const { jsonRequest, readJson } = require("../helpers/http");

describe("reset password API integration flow", () => {
  let prismaMock;
  let bcryptHashMock;
  let POST;

  async function loadRoute() {
    jest.resetModules();
    prismaMock = {
      user: {
        findFirst: jest.fn(),
        update: jest.fn(),
      },
    };
    bcryptHashMock = jest.fn().mockResolvedValue("new-hash");

    jest.doMock("../../lib/prisma", () => ({
      __esModule: true,
      default: prismaMock,
    }));
    jest.doMock("bcryptjs", () => ({
      hash: bcryptHashMock,
    }));

    ({ POST } = await import("../../app/api/reset-password/route.js"));
  }

  beforeEach(async () => {
    await loadRoute();
  });

  it("rejects missing required fields", async () => {
    const response = await POST(
      jsonRequest("http://localhost/api/reset-password", "POST", {
        token: "",
        password: "",
      })
    );
    const payload = await readJson(response);

    expect(response.status).toBe(400);
    expect(payload).toEqual({
      ok: false,
      error: "Missing required fields.",
    });
  });

  it("rejects invalid reset tokens", async () => {
    prismaMock.user.findFirst.mockResolvedValue(null);

    const response = await POST(
      jsonRequest("http://localhost/api/reset-password", "POST", {
        token: "invalid-token",
        password: "password123",
      })
    );
    const payload = await readJson(response);

    expect(response.status).toBe(400);
    expect(payload).toEqual({
      ok: false,
      error: "Invalid or expired reset token.",
    });
    expect(prismaMock.user.update).not.toHaveBeenCalled();
  });

  it("rejects expired reset tokens", async () => {
    const token = "expired-token";
    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
    prismaMock.user.findFirst.mockResolvedValue({
      id: "user-7",
      resetPasswordToken: tokenHash,
      resetPasswordExpires: new Date(Date.now() - 60_000),
    });

    const response = await POST(
      jsonRequest("http://localhost/api/reset-password", "POST", {
        token,
        password: "password123",
      })
    );
    const payload = await readJson(response);

    expect(response.status).toBe(400);
    expect(payload).toEqual({
      ok: false,
      error: "Invalid or expired reset token.",
    });
    expect(prismaMock.user.update).not.toHaveBeenCalled();
  });

  it("updates password and clears token for valid reset requests", async () => {
    const token = "valid-token";
    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
    prismaMock.user.findFirst.mockResolvedValue({
      id: "user-8",
      resetPasswordToken: tokenHash,
      resetPasswordExpires: new Date(Date.now() + 3600_000),
    });
    prismaMock.user.update.mockResolvedValue({ id: "user-8" });

    const response = await POST(
      jsonRequest("http://localhost/api/reset-password", "POST", {
        token,
        password: "password123",
      })
    );
    const payload = await readJson(response);

    expect(response.status).toBe(200);
    expect(payload).toEqual({ ok: true });
    expect(bcryptHashMock).toHaveBeenCalledWith("password123", 12);
    expect(prismaMock.user.update).toHaveBeenCalledWith({
      where: { id: "user-8" },
      data: {
        password: "new-hash",
        resetPasswordToken: null,
        resetPasswordExpires: null,
      },
    });
  });
});
