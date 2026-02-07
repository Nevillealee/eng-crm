import "@fontsource/space-grotesk/400.css";
import "@fontsource/space-grotesk/500.css";
import "@fontsource/space-grotesk/600.css";
import "./globals.css";
import ThemeRegistry from "./theme-registry";
import Footer from "./components/footer";

export const metadata = {
  title: "ENG CRM",
  description: "Secure login for ENG CRM",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <ThemeRegistry>
          {children}
          <Footer />
        </ThemeRegistry>
      </body>
    </html>
  );
}
