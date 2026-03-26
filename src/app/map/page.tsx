import type { Metadata } from "next";

import { MapFrame } from "./MapFrame";

/** BlueMap. Перевизначення: NEXT_PUBLIC_MAP_URL у .env / Vercel (у лапках, якщо є # у hash). */
const DEFAULT_MAP_URL =
  "http://142.132.211.240:25553/#world:0:0:0:1500:0:0:0:1:flat";

export const metadata: Metadata = {
  title: "Мапа — Lost Chronicles",
  description: "Інтерактивна мапа світу сервера (BlueMap).",
};

/** Мапа вбудована в сайт: URL вкладки лишається /map, знизу — панель навігації сайту. */
export default function MapPage() {
  const mapUrl = process.env.NEXT_PUBLIC_MAP_URL?.trim() || DEFAULT_MAP_URL;
  return <MapFrame src={mapUrl} />;
}
