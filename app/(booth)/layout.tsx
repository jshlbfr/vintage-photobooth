import type { ReactNode } from "react";

export default function BoothLayout({ children }: { children: ReactNode }) {
  return <main id="main-content" className="booth-shell">{children}</main>;
}
