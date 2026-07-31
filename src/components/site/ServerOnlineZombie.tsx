import Image from "next/image";
import { cn } from "@/lib/utils";

/**
 * Зомбі на правому верхньому краю панелі онлайну (без анімації).
 */
export function ServerOnlineZombie({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "pointer-events-none absolute right-0 top-0 z-0",
        /* трохи нижче за -translate-y-full — ноги на краю панелі */
        "-translate-y-[96%]",
        "w-[4.5rem] sm:right-1 sm:w-[5.25rem] md:w-[6rem]",
        className,
      )}
      aria-hidden
    >
      <Image
        src="/server-online-zombie.png?v=3"
        alt=""
        width={585}
        height={879}
        className="lc-stream-in h-auto w-full drop-shadow-[0_8px_16px_rgba(0,0,0,0.55)]"
        priority
        unoptimized
      />
    </div>
  );
}
