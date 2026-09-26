import Link from "next/link";
import type { ButtonHTMLAttributes, ReactNode } from "react";
import { Icon } from "@/components/ui/icon";

export function Button({ className = "", children, ...props }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button className={`button ${className}`} {...props}>{children}</button>;
}

export function ActionLink({ href, children, className = "", arrow = true }: { href: string; children: ReactNode; className?: string; arrow?: boolean }) {
  return <Link href={href} className={`button ${className}`}>{children}{arrow && <Icon name="arrow-right" />}</Link>;
}

export function BackLink({ href, label = "Go back", className = "" }: { href: string; label?: string; className?: string }) {
  return <Link href={href} className={`icon-button back-link ${className}`} aria-label={label}><Icon name="arrow-left" /></Link>;
}

export function Switch({ checked, onChange, label }: { checked: boolean; onChange: (checked: boolean) => void; label: string }) {
  return <button className="switch" type="button" role="switch" aria-label={label} aria-checked={checked} onClick={() => onChange(!checked)}><span /></button>;
}

export function SegmentedControl<T extends string | number>({ label, values, value, onChange, suffix = "" }: { label: string; values: readonly T[]; value: T; onChange: (value: T) => void; suffix?: string }) {
  return <div className="segmented-control" role="group" aria-label={label}>{values.map((option) => <button type="button" key={option} aria-pressed={value === option} onClick={() => onChange(option)}>{option}{suffix}</button>)}</div>;
}
