"use client";

type Props = {
  src: string;
};

/**
 * BlueMap у iframe. На HTTPS-хості (Vercel) http:// у src може блокуватись (mixed content) —
 * тоді потрібен NEXT_PUBLIC_MAP_URL з https:// або проксі на тому ж домені.
 */
export function MapFrame({ src }: Props) {
  return (
    <main className="flex min-h-0 w-full flex-1 flex-col bg-[#0f0f0f]">
      <iframe
        title="Мапа сервера Lost Chronicles (BlueMap)"
        src={src}
        className="min-h-0 w-full flex-1 border-0"
        allowFullScreen
        referrerPolicy="no-referrer-when-downgrade"
      />
    </main>
  );
}
