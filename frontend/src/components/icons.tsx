type IconProps = {
  className?: string;
};

const base = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.5,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
};

export function SeedIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M12 21.4c-2.4 0-4.3-1.7-4.3-3.8S9.6 13.8 12 13.8s4.3 1.7 4.3 3.8-1.9 3.8-4.3 3.8Z" />
      <path d="M12 13.8V9.2" />
      <path d="M12 9.6c0-2.3 1.8-4 4.1-4.2.2 2.3-1.8 4.2-4.1 4.2Z" />
    </svg>
  );
}

export function SaplingIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M12 21.2V8.4" />
      <path d="M12 12.2c0-3 2.1-5.3 5.1-5.5.2 3-2.1 5.5-5.1 5.5Z" />
      <path d="M12 16c-2.6 0-4.5-2.1-4.3-4.7 2.4.3 4.1 2.2 4.3 4.7Z" />
      <path d="M8.6 21.2h6.8" />
    </svg>
  );
}

export function TreeIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M12 2.6 7.4 8.8h9.2L12 2.6Z" />
      <path d="M12 7.2 5.6 15.4h12.8L12 7.2Z" />
      <path d="M12 15.4v3" />
      <path d="M12 18.4c-1.8.4-3 1.5-3.6 3.2" />
      <path d="M12 18.4c1.8.4 3 1.5 3.6 3.2" />
      <path d="M12 18.4v3.2" />
    </svg>
  );
}

export function ShieldIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M12 2.8 19 5.4v5.9c0 4.3-2.8 8-7 9.9-4.2-1.9-7-5.6-7-9.9V5.4l7-2.6Z" />
      <path d="M12 8.2v6.4" />
      <path d="M9.6 10.6h4.8" />
    </svg>
  );
}

export function SunIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6l1.4 1.4M17 17l1.4 1.4M18.4 5.6 17 7M7 17l-1.4 1.4" />
    </svg>
  );
}

export function MoonIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M20 14.2A8.2 8.2 0 0 1 9.8 4 8.4 8.4 0 1 0 20 14.2Z" />
    </svg>
  );
}

export function CloseIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M6.4 6.4l11.2 11.2M17.6 6.4 6.4 17.6" />
    </svg>
  );
}

export function BackIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M15 5l-7 7 7 7" />
    </svg>
  );
}

export function ArrowRightIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M5 12h13" />
      <path d="M12.5 6.5 18 12l-5.5 5.5" />
    </svg>
  );
}

export function LaurelIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M8.4 20c-2.9-1.6-4.3-4.6-4-8.7 2.8.7 4.5 2.6 5 5.7" />
      <path d="M15.6 20c2.9-1.6 4.3-4.6 4-8.7-2.8.7-4.5 2.6-5 5.7" />
      <path d="M12 20v-5" />
      <path d="M12 12.6a3.3 3.3 0 1 0 0-6.6 3.3 3.3 0 0 0 0 6.6Z" />
    </svg>
  );
}

export function MonitorIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <rect x="3" y="4.5" width="18" height="12" rx="1.6" />
      <path d="M9 20.5h6" />
      <path d="M12 16.5v4" />
    </svg>
  );
}

export function OrnamentIcon({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 64 16"
      fill="none"
      stroke="currentColor"
      strokeWidth={1}
      strokeLinecap="round"
      aria-hidden
      className={className}
    >
      <path d="M0 8h18" />
      <path d="M46 8h18" />
      <path d="M32 3.4c2.4 0 4 1.9 4 4.6s-1.6 4.6-4 4.6-4-1.9-4-4.6 1.6-4.6 4-4.6Z" />
      <path d="M28 8c-1.7-2.1-3.7-2.9-6-2.4.6 2.3 2.4 3.6 6 2.4Z" />
      <path d="M36 8c1.7 2.1 3.7 2.9 6 2.4-.6-2.3-2.4-3.6-6-2.4Z" />
      <path d="M32 8h.01" />
    </svg>
  );
}

export function IlluminatedInitial({ className }: IconProps) {
  return (
    <svg viewBox="0 0 72 72" fill="none" aria-hidden className={className}>
      <rect
        x="1.6"
        y="1.6"
        width="68.8"
        height="68.8"
        rx="2"
        stroke="currentColor"
        strokeWidth="1.2"
      />
      <rect
        x="6.4"
        y="6.4"
        width="59.2"
        height="59.2"
        rx="1"
        stroke="currentColor"
        strokeWidth="0.6"
        opacity="0.55"
      />
      <path
        d="M20 22h9.4l7.1 21.4L43.6 22H53l-12.8 33h-7.4L20 22Z"
        fill="currentColor"
        opacity="0.92"
      />
      <path
        d="M11.5 14.5c3.4.5 5.3 2.5 5.7 6M60.5 14.5c-3.4.5-5.3 2.5-5.7 6M11.5 57.5c3.4-.5 5.3-2.5 5.7-6M60.5 57.5c-3.4-.5-5.3-2.5-5.7-6"
        stroke="currentColor"
        strokeWidth="1"
        strokeLinecap="round"
        opacity="0.7"
      />
    </svg>
  );
}
