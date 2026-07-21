/**
 * Minimal inline SVG icon set. Kept dependency-free (no icon library)
 * since this project favors a small, self-hostable footprint.
 */
import type { SVGProps } from "react";

const base = (props: SVGProps<SVGSVGElement>) => ({
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  ...props,
});

export const CheckIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg {...base(props)}>
    <path d="M20 6 9 17l-5-5" />
  </svg>
);

export const ShieldIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg {...base(props)}>
    <path d="M12 2 4 5v6c0 5 3.4 8.7 8 11 4.6-2.3 8-6 8-11V5l-8-3Z" />
    <path d="m9 12 2 2 4-4" />
  </svg>
);

export const DatabaseIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg {...base(props)}>
    <ellipse cx="12" cy="5" rx="8" ry="3" />
    <path d="M4 5v14c0 1.7 3.6 3 8 3s8-1.3 8-3V5" />
    <path d="M4 12c0 1.7 3.6 3 8 3s8-1.3 8-3" />
  </svg>
);

export const UserCheckIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg {...base(props)}>
    <circle cx="9" cy="8" r="4" />
    <path d="M2 21v-2a6 6 0 0 1 6-6h2a6 6 0 0 1 4.2 1.7" />
    <path d="m17 12 2 2 4-4" />
  </svg>
);

export const SendIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg {...base(props)}>
    <path d="m22 2-9.5 9.5" />
    <path d="M22 2 15 22l-4-9-9-4 20-7Z" />
  </svg>
);

export const TargetIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg {...base(props)}>
    <circle cx="12" cy="12" r="9" />
    <circle cx="12" cy="12" r="5" />
    <circle cx="12" cy="12" r="1" />
  </svg>
);

export const FileTextIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg {...base(props)}>
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" />
    <path d="M14 2v6h6" />
    <path d="M9 13h6M9 17h6" />
  </svg>
);

export const MailDraftIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg {...base(props)}>
    <rect x="2" y="4" width="20" height="16" rx="2" />
    <path d="m22 6-10 7L2 6" />
    <path d="M8 20v-3l7-7 3 3-7 7Z" />
  </svg>
);

export const TrackIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg {...base(props)}>
    <path d="M3 3v18h18" />
    <path d="m7 15 4-4 3 3 5-6" />
  </svg>
);

export const UploadIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg {...base(props)}>
    <path d="M12 3v12" />
    <path d="m7 8 5-5 5 5" />
    <path d="M5 21h14" />
  </svg>
);

export const SearchIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg {...base(props)}>
    <circle cx="11" cy="11" r="7" />
    <path d="m21 21-4.3-4.3" />
  </svg>
);
