import { redirect } from "next/navigation";

/** BlueMap. Перевизначення: NEXT_PUBLIC_MAP_URL у .env / Vercel (у лапках, якщо є # у hash). */
const DEFAULT_MAP_URL =
  "http://142.132.211.240:25553/#world:0:0:0:1500:0:0:0:1:flat";

/** Відкриває мапу в поточній вкладці (без проміжної сторінки з кнопками). */
export default function MapPage() {
  const mapUrl = process.env.NEXT_PUBLIC_MAP_URL?.trim() || DEFAULT_MAP_URL;
  redirect(mapUrl);
}
