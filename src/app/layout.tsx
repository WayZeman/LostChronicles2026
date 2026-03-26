import type { Metadata, Viewport } from "next";
import { Noto_Sans } from "next/font/google";
import { Navbar } from "@/components/Navbar";
import { SiteFooter } from "@/components/site/SiteFooter";
import { SiteFooterGate } from "@/components/site/SiteFooterGate";
import "./globals.css";

const noto = Noto_Sans({
  subsets: ["latin", "cyrillic"],
  variable: "--font-noto",
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

const siteDescription =
  "Місце, де українські гравці об'єднуються, щоб створювати пригоди, знаходити друзів і будувати власні цивілізації у живому світі історій.";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export const metadata: Metadata = {
  title: "Lost Chronicles — сервер Minecraft",
  description: siteDescription,
  openGraph: {
    title: "Lost Chronicles — сервер Minecraft",
    description: siteDescription,
    type: "website",
    locale: "uk_UA",
    siteName: "Lost Chronicles",
  },
  twitter: {
    card: "summary_large_image",
    title: "Lost Chronicles — сервер Minecraft",
    description: siteDescription,
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
      <body className={`${noto.variable} am-bg relative flex min-h-screen flex-col antialiased`}>
        <div className="mc-net-backdrop" aria-hidden>
          <div className="mc-bg-blob-layer">
            <span className="mc-bg-blob mc-bg-blob-1" />
            <span className="mc-bg-blob mc-bg-blob-2" />
            <span className="mc-bg-blob mc-bg-blob-3" />
            <span className="mc-bg-blob mc-bg-blob-4" />
            <span className="mc-bg-blob mc-bg-blob-5" />
          </div>
        </div>
        <Navbar />
        <div className="relative z-10 flex min-h-0 flex-1 flex-col pb-[calc(5.75rem+env(safe-area-inset-bottom,0px))] pt-[max(0.75rem,env(safe-area-inset-top,0px))]">
          {children}
        </div>
        <SiteFooterGate>
          <SiteFooter />
        </SiteFooterGate>
      </body>
    </html>
  );
}
