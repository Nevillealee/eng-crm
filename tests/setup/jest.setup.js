process.env.NEXTAUTH_SECRET = process.env.NEXTAUTH_SECRET || "test-secret";
process.env.NEXT_PUBLIC_APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

afterEach(() => {
  jest.clearAllMocks();
});
