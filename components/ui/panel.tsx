import type { ReactNode } from "react";

export function Panel({ children, className = "", labelledBy }: { children: ReactNode; className?: string; labelledBy?: string }) {
  return <section className={`cream-panel ${className}`} aria-labelledby={labelledBy}>{children}</section>;
}
