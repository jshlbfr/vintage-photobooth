import Image from "next/image";
import { DOODLES } from "@/lib/artwork";

export function Doodle({ kind, className = "" }: { kind: keyof typeof DOODLES; className?: string }) {
  return <Image {...DOODLES[kind]} alt="" aria-hidden="true" className={`doodle ${className}`} sizes="(max-width: 650px) 100px, 260px" />;
}
