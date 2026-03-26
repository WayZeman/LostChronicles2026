import type { NextConfig } from "next";

/** Проксі BlueMap (HTTP), щоб iframe був same-origin на HTTPS і не блокувався mixed content. */
const MAP_PROXY_TARGET =
  process.env.MAP_PROXY_TARGET?.replace(/\/$/, "") ||
  "http://142.132.211.240:25553";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      { source: "/map-embed", destination: `${MAP_PROXY_TARGET}/` },
      { source: "/map-embed/", destination: `${MAP_PROXY_TARGET}/` },
      { source: "/map-embed/:path*", destination: `${MAP_PROXY_TARGET}/:path*` },
    ];
  },
};

export default nextConfig;
