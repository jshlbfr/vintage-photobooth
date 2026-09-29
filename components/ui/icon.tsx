import type { SVGProps } from "react";

export type IconName = "arrow-left" | "arrow-right" | "chevron-left" | "chevron-right" | "camera" | "switch-camera" | "download" | "play" | "qr" | "edit" | "text" | "gif" | "check" | "lock";

const paths: Record<IconName, React.ReactNode> = {
  "arrow-left": <path d="M19 12H5m6-6-6 6 6 6" />,
  "arrow-right": <path d="M5 12h14m-6-6 6 6-6 6" />,
  "chevron-left": <path d="m14 7-5 5 5 5" />,
  "chevron-right": <path d="m10 7 5 5-5 5" />,
  camera: <><path d="M8 5 6 8H3v12h18V8h-3l-2-3Z" /><circle cx="12" cy="13" r="3.5" /></>,
  "switch-camera": <><path d="M3 8V4m0 4h4M21 16v4m0-4h-4M4 7a9 9 0 0 1 15-2M20 17a9 9 0 0 1-15 2" /><rect x="7" y="8" width="10" height="8" rx="2" /><circle cx="12" cy="12" r="2" /></>,
  download: <><path d="M12 3v12m-4-4 4 4 4-4M4 16v5h16v-5" /></>,
  play: <><circle cx="12" cy="12" r="10" /><path d="m10 7 7 5-7 5Z" /></>,
  qr: <><path d="M3 3h7v7H3Zm11 0h7v7h-7ZM3 14h7v7H3Zm12 0h3v3h3v4h-7v-4m7-3v1M6 6h1m10 0h1M6 17h1" /></>,
  edit: <><path d="m15 4 5 5M3 21l1-7L17 1l6 6L10 20Z" /></>,
  text: <><path d="M5 6V3h14v3M12 3v18m-4 0h8" /></>,
  gif: <><rect x="3" y="2" width="18" height="20" rx="1" /><text x="12" y="15" textAnchor="middle" fill="currentColor" stroke="none" fontSize="8" fontFamily="sans-serif" fontWeight="600">GIF</text></>,
  check: <path d="m5 12 4 4L19 6" />,
  lock: <><rect x="5" y="10" width="14" height="11" rx="2" /><path d="M8 10V7a4 4 0 0 1 8 0v3m-4 4v3" /></>,
};

export function Icon({ name, ...props }: SVGProps<SVGSVGElement> & { name: IconName }) {
  return <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>{paths[name]}</svg>;
}
