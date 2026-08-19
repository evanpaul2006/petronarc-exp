import type { IconKey } from "../kart-systems";

interface GlyphProps {
  icon: IconKey;
  size?: number;
}

export function SystemGlyph({ icon, size = 30 }: GlyphProps) {
  const common = {
    width: size,
    height: size,
    viewBox: "0 0 32 32",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.7,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
  };

  switch (icon) {
    case "brake":
      return (
        <svg {...common}>
          <circle cx="15" cy="16" r="10" />
          <circle cx="15" cy="16" r="3.5" />
          <path d="M22 8.5c4 1.8 5.6 5.2 5.6 9.2 0 3.6-1.5 6.4-4.3 8.3l-3-4.4c1.4-1 2.1-2.4 2.1-4.2 0-2-.8-3.4-2.5-4.4Z" />
          <path d="M15 6v3M15 23v3M5 16h3M11.5 12.5l-2-2M11.5 19.5l-2 2M18.5 12.5l2-2M18.5 19.5l2 2" />
        </svg>
      );
    case "chassis":
      return (
        <svg {...common}>
          <path d="m4 21 5-10 14-4 5 13-13 6Z" />
          <path d="M9 11 15 26M23 7 15 26M4 21h24M9 11l14 9M23 7 4 21" />
        </svg>
      );
    case "steering":
      return (
        <svg {...common}>
          <circle cx="16" cy="15" r="11" />
          <circle cx="16" cy="15" r="2.8" />
          <path d="m8 8 6 5M24 8l-6 5M16 18v8" />
        </svg>
      );
    case "suspension":
      return (
        <svg {...common}>
          <path d="m10 4 12 4-12 4 12 4-12 4 12 4-12 4" />
          <path d="M8 3h16M8 29h16M16 4v-2M16 30v-2" />
        </svg>
      );
    case "wheels":
      return (
        <svg {...common}>
          <circle cx="16" cy="16" r="12" />
          <circle cx="16" cy="16" r="7.5" />
          <circle cx="16" cy="16" r="2" />
          <path d="m16 8 1.4 6.2 5.9-2.2-4.8 4 4.8 4-5.9-2.2L16 24l-1.4-6.2L8.7 20l4.8-4-4.8-4 5.9 2.2Z" />
        </svg>
      );
    case "electrical":
      return (
        <svg {...common}>
          <path d="M18.5 2 7 18h8l-1.5 12L25 13h-8Z" />
        </svg>
      );
    case "engine":
      return (
        <svg {...common}>
          <path d="M5 12h4l3-4h9l3 4h3v12H9l-4-4Z" />
          <path d="M2 15v6M30 14v7M14 8V5h7M13 15h8v6h-8z" />
        </svg>
      );
    case "seat":
      return (
        <svg {...common}>
          <path d="M12 4c4 0 6 2 6 6v7l5 3v7H8v-4l4-5Z" />
          <path d="M12 18h6M9 27l-2 3M22 27l2 3" />
        </svg>
      );
    case "safety":
      return (
        <svg {...common}>
          <path d="M16 3 5 7v9c0 6.2 4.4 11 11 13 6.6-2 11-6.8 11-13V7Z" />
          <path d="M11 15.5 15 19.5 21.5 12" />
        </svg>
      );
    case "assembly":
      return (
        <svg {...common}>
          <path d="m5 25 9-9M17 13l9-9M21 3l7 7" />
          <path d="M12 6a6 6 0 0 0 8 8l-6.5 6.5-8-8Z" />
          <circle cx="23" cy="23" r="4.5" />
          <path d="M23 15.5v3M23 27.5v3M15.5 23h3M27.5 23h3" />
        </svg>
      );
    default:
      return (
        <svg {...common}>
          <path d="m5 26 9-9M18 13l9-9M22 3l7 7M4 20l8 8" />
          <path d="M13 7a6 6 0 0 0 8 8l-6 6-8-8 6-6Z" />
        </svg>
      );
  }
}
