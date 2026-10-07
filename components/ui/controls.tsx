import Link from "next/link";
import type { ButtonHTMLAttributes, ReactNode } from "react";
import { Icon } from "@/components/ui/icon";

export function Button({ className = "", children, ...props }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button className={`button ${className}`} {...props}>{children}</button>;
}

export function ActionLink({ href, children, className = "", arrow = true, onNavigate }: { href: string; children: ReactNode; className?: string; arrow?: boolean; onNavigate?: () => void }) {
  return <Link href={href} className={`button ${className}`} onNavigate={onNavigate}>{children}{arrow && <Icon name="arrow-right" />}</Link>;
}

export function BackLink({ href, label = "Go back", className = "" }: { href: string; label?: string; className?: string }) {
  // Leave the booth through a new document; do not carry advertising across history entries.
  if (href === "/") return <a href={href} className={`icon-button back-link ${className}`} aria-label={label}><Icon name="arrow-left" /></a>;
  return <Link href={href} className={`icon-button back-link ${className}`} aria-label={label}><Icon name="arrow-left" /></Link>;
}

export function Switch({ checked, onChange, label, disabled = false }: { checked: boolean; onChange: (checked: boolean) => void; label: string; disabled?: boolean }) {
  return <button className="switch" type="button" role="switch" disabled={disabled} aria-label={label} aria-checked={checked} onClick={() => onChange(!checked)}><span /></button>;
}

export function SegmentedControl<T extends string | number>({ label, values, value, onChange, suffix = "" }: { label: string; values: readonly T[]; value: T; onChange: (value: T) => void; suffix?: string }) {
  return <div className="segmented-control" role="group" aria-label={label}>{values.map((option) => <button type="button" key={option} aria-pressed={value === option} onClick={() => onChange(option)}>{option}{suffix}</button>)}</div>;
}
