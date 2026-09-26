export function Doodle({ kind, className = "" }: { kind: "rays" | "hearts" | "sparkles" | "underline" | "arrow" | "plane"; className?: string }) {
  return <svg viewBox="0 0 160 100" preserveAspectRatio={kind === "underline" ? "none" : undefined} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`doodle ${className}`} aria-hidden="true">
    {kind === "rays" && <path d="m21 76-16-24 12-7 20 25ZM50 62 36 8l15-3 12 54ZM82 56l7-54 16 4-11 51Zm31 9 26-40 13 9-29 39Zm18 16 27-10 1 15-26 3" />}
    {kind === "hearts" && <path d="M59 69C19 48 31 15 49 38 63 2 82 28 59 69Zm49 17c-35-23-20-43-9-25 11-25 29-5 9 25Z" />}
    {kind === "sparkles" && <path d="M54 7q-2 35-26 41 25 1 26 41 3-39 27-41Q57 43 54 7Zm57 17q0 15-12 18 12 1 12 18 2-15 12-18-11-2-12-18ZM91 1v15m-7-8h14" />}
    {kind === "underline" && <path d="M4 31C44 18 110 13 155 33 112 27 71 34 45 40c35-1 67 0 100 7-23-1-44 0-71 5l47 7-7 6" />}
    {kind === "arrow" && <path d="M14 12c112-18 137 66 36 65m20-17L49 77l25 12" />}
    {kind === "plane" && <path d="m29 38 99-31-36 65-21-22-21 24 4-36 74-31-57 43m-20 36-5 8m-8 6-8 5" />}
  </svg>;
}
