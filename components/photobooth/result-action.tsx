import Link from "next/link";
import { Icon, type IconName } from "@/components/ui/icon";

type ResultActionProps = { icon: IconName; title: string; description: string; free?: boolean; href?: string; onNavigate?: () => void };

export function ResultAction({ icon, title, description, free = false, href, onNavigate }: ResultActionProps) {
  const content = <><Icon name={icon} /><span className="result-action-copy"><span className="result-action-title">{title}</span><span className="result-action-description">{description}</span></span>{free && <span className="free-badge">FREE</span>}</>;
  const className = `result-action ${free ? "result-action-primary" : ""}`;
  return href ? <Link href={href} className={className} onNavigate={onNavigate}>{content}</Link> : <button type="button" className={className} disabled title={`${title} is not available in this sample preview`} aria-describedby="results-preview-note">{content}</button>;
}
