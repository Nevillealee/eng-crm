process.env.NEXTAUTH_SECRET = process.env.NEXTAUTH_SECRET || "test-secret";
process.env.NEXT_PUBLIC_APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET =
  process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || "test-upload-preset";

jest.mock("next-cloudinary", () => ({
  CldUploadWidget: ({ children }) => {
    if (typeof children !== "function") {
      return null;
    }

    return children({ open: jest.fn() });
  },
}));

afterEach(() => {
  jest.clearAllMocks();
});
