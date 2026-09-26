import type { StickerKind } from "@/lib/design-data";

/** Original, deliberately simple SVG stand-ins. Replace with the individual Figma exports. */
export function Sticker({ kind, className = "" }: { kind: StickerKind; className?: string }) {
  const art = () => {
    switch (kind) {
      case "camera": return <><rect x="9" y="18" width="46" height="31" rx="4" fill="#f3e9d2" /><path d="m17 18 3-5h13l3 5M10 27h44" /><circle cx="36" cy="35" r="10" /><circle cx="36" cy="35" r="6" /><path d="M16 23h7m-7 10 3-3 3 3-3 5Z" stroke="#9B4034" /></>;
      case "heart": return <path d="M32 54C24 44 7 33 9 20 11 8 25 9 32 20 40 6 54 10 55 21 57 34 39 48 32 54Z" fill="#9B4034" stroke="#fffbea" strokeWidth="4" />;
      case "hearts": return <><path d="M25 48 9 31C0 20 17 13 25 25 30 7 44 12 40 26Zm17 7L29 40c-5-9 7-16 13-7 7-13 18-5 12 4Z" fill="#f3e9d2" strokeWidth="2.5" /></>;
      case "sunglasses": return <><path d="M5 25q10-7 23 0m8 0q13-7 23 0M27 28q5-5 10 0M5 24l-3-6m57 6 3-6" /><path d="M7 25q-2 19 15 13l6-12Zm29 1 6 12q16 6 15-13Z" fill="#1d1812" /><path d="m10 27 7 2m26-2 7 2" stroke="#f3e9d2" /></>;
      case "sparkle": return <><path d="M28 6q-2 23-20 26 18 2 20 26 3-24 19-26Q31 29 28 6Z" fill="#9B4034" stroke="#f3e9d2" strokeWidth="3" /><path d="M51 5v14m-6-7h12M52 43v13m-6-6h12" /></>;
      case "record": return <><circle cx="30" cy="33" r="23" fill="#2a211a" stroke="#f3e9d2" strokeWidth="3" /><circle cx="30" cy="33" r="17" stroke="#756850" /><circle cx="30" cy="33" r="10" fill="#f3e9d2" /><circle cx="30" cy="33" r="2" /><path d="m51 7 5-4m-2 12h7" stroke="#9B4034" /></>;
      case "good-photos": return <><path d="M54 32C59 8 13 3 7 26 2 40 11 47 20 48l-5 11 15-10c13 1 22-7 24-17Z" fill="#f3e9d2" /><text x="32" y="25" className="sticker-script" textAnchor="middle" stroke="none">good</text><text x="31" y="36" className="sticker-script" textAnchor="middle" stroke="none">photos</text><text x="30" y="46" className="sticker-script" textAnchor="middle" stroke="none">only!</text></>;
      case "cherries": return <><path d="M19 43 34 12l12 31M34 12c-22 4-20-12 0 0 19-15 22 2 0 0" /><circle cx="18" cy="45" r="11" fill="#9B4034" stroke="#f3e9d2" /><circle cx="45" cy="46" r="11" fill="#9B4034" stroke="#f3e9d2" /><path d="m14 40 3-2m24 3 3-2" stroke="#fffbea" /></>;
      case "strip": return <><path d="m24 6 25 5-10 48-25-5Z" fill="#f3e9d2" /><path d="m27 12 16 3-3 13-16-3Zm-4 18 16 3-3 14-16-3Z" fill="#1d1812" /><path d="m44 49 5-4 4 3-8 9-3-6" stroke="#9B4034" /></>;
      case "flower": return <><path d="M32 17c-20-24-35 5-18 15-22 17 6 35 18 16 15 24 37-3 18-16 21-17-5-36-18-15Z" fill="#f3e9d2" /><circle cx="32" cy="32" r="10" fill="#C39A45" /><path d="M28 31h1m7 0h1m-9 6q4 4 8 0" /></>;
      case "star": return <path d="m31 5 8 19 20-3-16 15 9 21-21-11-17 12 3-23L3 23l22 1Z" fill="#f3e9d2" strokeWidth="3" />;
      case "photo-booth": return <><path d="M32 56C-14 28 17-3 32 16 51-4 80 30 32 56Z" fill="#9B4034" stroke="#f3e9d2" strokeWidth="3" /><text x="32" y="29" className="sticker-script" fill="#fffbea" stroke="none" textAnchor="middle">photo</text><text x="32" y="42" className="sticker-script" fill="#fffbea" stroke="none" textAnchor="middle">booth</text></>;
      case "smile": return <><circle cx="32" cy="33" r="24" fill="#f3e9d2" /><path d="M23 23v7m17-7v7M20 38q12 17 24 0" strokeWidth="3" /><path d="m48 9 5-6 6 3-7 9Z" fill="#9B4034" stroke="none" /></>;
      case "bow": return <><path d="M31 25C0-4 0 48 31 25 63 0 66 46 31 25Z" fill="#9B4034" stroke="#f3e9d2" strokeWidth="2" /><path d="m29 29-15 28 1-14-7 1 19-17m9 1 18 22-10-4-1 13-12-28" fill="#9B4034" /><circle cx="32" cy="26" r="4" fill="#f3e9d2" /></>;
      case "dice": return <><path d="m4 14 18-8 18 14-7 24-24-6Zm26 21 16-10 15 15-8 22-22-9Z" fill="#f3e9d2" /><path d="m4 14 19 10 17-4M23 24l-3 17m10-6 17 9 14-4M47 44l-2 14" /><g fill="#1d1812"><circle cx="14" cy="23" r="2" /><circle cx="15" cy="31" r="2" /><circle cx="29" cy="29" r="2" /><circle cx="48" cy="34" r="2" /><circle cx="38" cy="43" r="2" /><circle cx="39" cy="49" r="2" /><circle cx="54" cy="48" r="2" /></g></>;
      case "memories": return <><path d="M5 27C4 8 25 7 31 14 46 0 65 19 55 31 72 49 35 61 16 52 2 49 0 37 5 27Z" fill="#1d1812" stroke="#f3e9d2" strokeWidth="3" /><text x="32" y="29" className="sticker-script" fill="#fffbea" stroke="none" textAnchor="middle">make</text><text x="31" y="42" className="sticker-script" fill="#fffbea" stroke="none" textAnchor="middle">memories</text></>;
    }
  };
  return <svg className={className} viewBox="0 0 64 64" fill="none" stroke="#2a211a" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{art()}</svg>;
}
