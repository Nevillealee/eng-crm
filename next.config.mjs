/** @type {import('next').NextConfig} */
const isDevelopment = process.env.NODE_ENV !== "production";
const contentSecurityPolicy = `
  default-src 'self';
  script-src 'self' 'unsafe-inline'${isDevelopment ? " 'unsafe-eval'" : ""} https://widget.cloudinary.com https://upload-widget.cloudinary.com;
  style-src 'self' 'unsafe-inline';
  img-src 'self' data: blob: https://res.cloudinary.com;
  font-src 'self' data:;
  connect-src 'self' https://api.cloudinary.com https://res.cloudinary.com https://widget.cloudinary.com https://upload-widget.cloudinary.com;
  frame-src 'self' https://widget.cloudinary.com https://upload-widget.cloudinary.com;
  object-src 'none';
  base-uri 'self';
  form-action 'self';
  frame-ancestors 'none';
`;

const nextConfig = {
  serverExternalPackages: ["geoip-lite"],
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "Content-Security-Policy",
            value: contentSecurityPolicy.replace(/\s{2,}/g, " ").trim(),
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "Referrer-Policy",
            value: "no-referrer",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
          {
            key: "Cross-Origin-Opener-Policy",
            value: "same-origin",
          },
          {
            key: "Cross-Origin-Resource-Policy",
            value: "same-origin",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
