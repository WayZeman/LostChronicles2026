import type { Metadata, Viewport } from "next";
import { Noto_Sans } from "next/font/google";
import { DeferVercelMetrics } from "@/components/DeferVercelMetrics";
import { GoogleAnalytics } from "@/components/GoogleAnalytics";
import { Navbar } from "@/components/Navbar";
import { AtmosphereParticles } from "@/components/site/AtmosphereParticles";
import { AnniversaryAtmosphere } from "@/components/site/AnniversaryAtmosphere";
import { RouteEnter } from "@/components/site/RouteEnter";
import { SiteCursor } from "@/components/site/SiteCursor";
import { SiteIntroCurtain } from "@/components/site/SiteIntroCurtain";
import { SiteJsonLd } from "@/components/site/SiteJsonLd";
import {
  LC_SEO_DESCRIPTION_SHORT,
  LC_SEO_META_KEYWORDS,
  LC_SEO_SITE_TITLE_DEFAULT,
} from "@/data/lc-seo-terms";
import { getLcMarketingSiteUrl } from "@/lib/site-base-url";
import "./globals.css";

const notoSans = Noto_Sans({
  subsets: ["latin", "latin-ext", "cyrillic", "cyrillic-ext"],
  variable: "--font-noto",
  display: "swap",
  adjustFontFallback: true,
  weight: ["400", "500", "600", "700", "800"],
});

/** Канонічний URL (SEO, OG). Перевизначення: NEXT_PUBLIC_SITE_URL у продакшені. */
const siteUrl = getLcMarketingSiteUrl();

const siteTitleDefault = LC_SEO_SITE_TITLE_DEFAULT;
const siteDescription = LC_SEO_DESCRIPTION_SHORT;

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export const metadata: Metadata = {
  metadataBase: new URL(`${siteUrl}/`),
  title: {
    default: siteTitleDefault,
    template: "%s · Lost Chronicles",
  },
  description: siteDescription,
  keywords: LC_SEO_META_KEYWORDS,
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
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
    title: siteTitleDefault,
    description: siteDescription,
    url: siteUrl,
    type: "website",
    locale: "uk_UA",
    siteName: "Lost Chronicles",
    images: [
      {
        url: "/logo.png",
        width: 597,
        height: 595,
        alt: "Lost Chronicles — логотип українського Minecraft-сервера",
      },
    ],
  },
  /** Квадратний логотип: summary краще рендериться у стрічці, ніж summary_large_image з обрізанням. */
  twitter: {
    card: "summary",
    title: siteTitleDefault,
    description: siteDescription,
    images: ["/logo.png"],
  },
  ...(process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION?.trim()
    ? {
        verification: {
          google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION.trim(),
        },
      }
    : {}),
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
      <head>
        <link rel="preconnect" href="https://mc-heads.net" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://ely.by" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="http://skinsystem.ely.by" />
        <link rel="preload" as="image" href="/lc-logo-hero-v2.png" />
        <link rel="preload" as="image" href="/bg-ivy-stone.jpg" />
        <link
          rel="preload"
          as="image"
          href="/server-status-online.png?v=8"
        />
        <link
          rel="preload"
          as="image"
          href="/server-status-offline.png?v=8"
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `document.documentElement.classList.add('lc-intro-pending');`,
          }}
        />
      </head>
      <body
        className={`${notoSans.variable} am-bg relative flex min-h-screen flex-col antialiased`}
      >
        <GoogleAnalytics />
        <SiteJsonLd siteUrl={siteUrl} />
        <SiteIntroCurtain />
        <AnniversaryAtmosphere />
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
        <SiteCursor />
        <Navbar />
        <div className="lc-page-enter relative z-10 flex min-h-0 flex-1 flex-col bg-transparent pb-[calc(6.25rem+env(safe-area-inset-bottom,0px))] [&>*:only-child]:flex [&>*:only-child]:min-h-0 [&>*:only-child]:w-full [&>*:only-child]:flex-1 [&>*:only-child]:flex-col [&>*:only-child]:pt-[max(0.75rem,env(safe-area-inset-top,0px))]">
          <RouteEnter>{children}</RouteEnter>
        </div>
        <DeferVercelMetrics />
      </body>
    </html>
  );
}
