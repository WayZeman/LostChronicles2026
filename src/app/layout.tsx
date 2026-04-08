import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { DeferVercelMetrics } from "@/components/DeferVercelMetrics";
import { DiscordAuthBar } from "@/components/DiscordAuthBar";
import { Navbar } from "@/components/Navbar";
import { AtmosphereParticles } from "@/components/site/AtmosphereParticles";
import { SiteBackdropYouTube } from "@/components/site/SiteBackdropYouTube";
import "./globals.css";

const inter = Inter({
  subsets: ["latin", "latin-ext", "cyrillic", "cyrillic-ext"],
  variable: "--font-inter",
  display: "swap",
  adjustFontFallback: true,
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
    apple: [{ url: "/logo.png", sizes: "180x180", type: "image/png" }],
    shortcut: "/logo.png",
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
      className="scroll-pt-[max(0.75rem,env(safe-area-inset-top,0px))]"
      suppressHydrationWarning
    >
      <body className={`${inter.variable} am-bg relative flex min-h-screen flex-col antialiased`}>
        <div className="mc-net-backdrop" aria-hidden>
          <SiteBackdropYouTube />
          <div className="mc-backdrop-scrim" />
          <div className="mc-bg-blob-layer">
            <span className="mc-bg-blob mc-bg-blob-1" />
            <span className="mc-bg-blob mc-bg-blob-2" />
            <span className="mc-bg-blob mc-bg-blob-3" />
            <span className="mc-bg-blob mc-bg-blob-4" />
            <span className="mc-bg-blob mc-bg-blob-5" />
          </div>
        </div>
        <AtmosphereParticles />
        <DiscordAuthBar />
        <Navbar />
        <div className="relative z-10 flex min-h-0 flex-1 flex-col bg-transparent pb-[calc(5.75rem+env(safe-area-inset-bottom,0px))] [&>*:only-child]:flex [&>*:only-child]:min-h-0 [&>*:only-child]:w-full [&>*:only-child]:flex-1 [&>*:only-child]:flex-col [&>*:only-child]:pt-[max(3.25rem,env(safe-area-inset-top,0px)+0.5rem)]">
          {children}
        </div>
        <DeferVercelMetrics />
      </body>
    </html>
  );
}
