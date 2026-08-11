export function DiamondIcon({
  className,
  size = 24,
}: {
  className?: string;
  size?: number;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden
    >
      <path
        d="M12 2.5L20.5 9.2L12 21.5L3.5 9.2L12 2.5Z"
        fill="#38bdf8"
        stroke="#7dd3fc"
        strokeWidth="0.8"
        strokeLinejoin="round"
      />
      <path
        d="M12 2.5L15.8 9.2L12 12.2L8.2 9.2L12 2.5Z"
        fill="#e0f2fe"
        opacity="0.85"
      />
      <path
        d="M3.5 9.2H20.5M12 2.5L8.2 9.2L12 21.5M12 2.5L15.8 9.2L12 21.5"
        stroke="rgba(255,255,255,0.4)"
        strokeWidth="0.7"
        strokeLinejoin="round"
      />
    </svg>
  );
}
