import type { Metadata, Viewport } from "next";
import { Analytics } from "@/components/Analytics";
import { BackToTopButton } from "@/components/BackToTopButton";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import {
  SITE_URL,
  siteDescription,
  siteName,
} from "@/lib/site";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${siteName} — матеріали для початкової школи`,
    template: `%s | ${siteName}`,
  },
  description: siteDescription,
  keywords: [
    "матеріали для початкової школи",
    "матеріали для НУШ",
    "презентації для початкової школи",
    "картки для уроків",
    "оформлення класу",
    "дидактичні матеріали",
    "готові матеріали для вчителя",
  ],
  applicationName: siteName,
  authors: [{ name: "Готово до уроку" }],
  creator: "Готово до уроку",
  publisher: "Готово до уроку",
  alternates: { canonical: "/" },
  icons: {
    icon: [{ url: "/brand/logo.png", sizes: "1024x1024", type: "image/png" }],
    apple: [{ url: "/brand/logo.png", sizes: "1024x1024" }],
  },
  manifest: "/manifest.webmanifest",
  openGraph: {
    type: "website",
    locale: "uk_UA",
    url: SITE_URL,
    siteName,
    title: `${siteName} — авторські матеріали для початкової школи`,
    description: siteDescription,
    images: [
      {
        url: "/brand/hero-banner.png",
        width: 2048,
        height: 848,
        alt: "Готово до уроку — авторські матеріали для початкової школи",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: `${siteName} — матеріали для початкової школи`,
    description: siteDescription,
    images: ["/brand/hero-banner.png"],
  },
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION || undefined,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#f72e88",
  colorScheme: "light",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="uk">
      <body>
        <a className="skip-link" href="#main-content">
          Перейти до основного вмісту
        </a>
        <Header />
        <main id="main-content">{children}</main>
        <Footer />
        <BackToTopButton />
        <Analytics />
      </body>
    </html>
  );
}
