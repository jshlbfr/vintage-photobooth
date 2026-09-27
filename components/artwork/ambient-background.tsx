import Image from "next/image";

export function AmbientBackground() {
  return <div className="ambient-background" aria-hidden="true">
    <Image src="/images/ombre 1.png" width={589} height={726} alt="" sizes="(max-width: 650px) 55vw, 589px" className="ombre-top" />
    <Image src="/images/ombre 2.png" width={589} height={726} alt="" sizes="(max-width: 650px) 55vw, 589px" className="ombre-bottom" />
  </div>;
}
