import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { Navbar } from "@/components/Navbar";
import { AtmosphereParticles } from "@/components/site/AtmosphereParticles";
import "./globals.css";

const inter = Inter({
  subsets: ["latin", "latin-ext", "cyrillic", "cyrillic-ext"],
  variable: "--font-inter",
  display: "swap",
});

/** Канонічний URL сайту (для OG / прев’ю в месенджерах). Можна перевизначити через NEXT_PUBLIC_SITE_URL. */
const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
  "https://lost-chronicles2026.vercel.app";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export const metadata: Metadata = {
  metadataBase: new URL(`${siteUrl}/`),
  title: "Lost Chronicles",
  description: "Український Minecraft сервер",
  icons: {
    icon: [{ url: "/logo.png", sizes: "597x595", type: "image/png" }],
    apple: [{ url: "/logo.png", sizes: "180x180" }],
  },
  appleWebApp: {
    capable: true,
    title: "Lost Chronicles",
    statusBarStyle: "black-translucent",
  },
  openGraph: {
    title: "Lost Chronicles",
    description: "Приєднуйся до пригод у світі Lost Chronicles",
    url: siteUrl,
    type: "website",
    locale: "uk_UA",
    siteName: "Lost Chronicles",
    images: [
      {
        url: "/logo.png",
        width: 597,
        height: 595,
        alt: "Lost Chronicles",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Lost Chronicles",
    description: "Приєднуйся до пригод у світі Lost Chronicles",
    images: ["/logo.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="uk"
      className="dark scroll-pt-[max(0.75rem,env(safe-area-inset-top,0px))]"
      suppressHydrationWarning
    >
      <body className={`${inter.variable} am-bg relative flex min-h-screen flex-col antialiased`}>
        <div className="mc-net-backdrop" aria-hidden>
          <div className="mc-bg-blob-layer">
            <span className="mc-bg-blob mc-bg-blob-1" />
            <span className="mc-bg-blob mc-bg-blob-2" />
            <span className="mc-bg-blob mc-bg-blob-3" />
            <span className="mc-bg-blob mc-bg-blob-4" />
            <span className="mc-bg-blob mc-bg-blob-5" />
          </div>
        </div>
        <AtmosphereParticles />
        <Navbar />
        <div className="relative z-10 flex min-h-0 flex-1 flex-col bg-transparent pb-[calc(5.75rem+env(safe-area-inset-bottom,0px))] pt-[max(0.75rem,env(safe-area-inset-top,0px))]">
          {children}
        </div>
      </body>
    </html>
  );
}
