import Image from "next/image";
import { Doodle } from "@/components/artwork/doodle";

const photos = [
  { file: 1, width: 220, height: 587, className: "collage-left-one" },
  { file: 2, width: 347, height: 591, className: "collage-left-two" },
  { file: 3, width: 297, height: 314, className: "collage-left-front" },
  { file: 4, width: 291, height: 274, className: "collage-left-second" },
  { file: 5, width: 250, height: 518, className: "collage-right-one" },
  { file: 6, width: 353, height: 622, className: "collage-right-two" },
  { file: 7, width: 275, height: 397, className: "collage-right-front" },
];

export function LandingArtwork() {
  return <div className="landing-artwork" aria-hidden="true">
    <Image src="/images/photobooth bg.png" width={895} height={1024} alt="" className="booth-art" sizes="(max-width: 650px) 570px, 895px" />
    {photos.map(({ file, width, height, className }) => <Image key={file} src={`/images/photo strip ${file}.png`} width={width} height={height} alt="" className={`collage-photo ${className}`} sizes="(max-width: 650px) 110px, (max-width: 1050px) 220px, 300px" />)}
    <Doodle kind="sparkles" className="landing-sparkles" />
    <Doodle kind="sparkles-alt" className="landing-sparkles-alt" />
    <Doodle kind="plane" className="landing-plane" />
    <Doodle kind="hearts" className="landing-hearts" />
    <Doodle kind="rays-alt" className="landing-rays-alt" />
    <Image src="/images/vintage camera.png" width={610} height={428} alt="" className="camera-art" sizes="(max-width: 650px) 260px, 610px" />
    {/* No standalone film asset was supplied; retain this code-native decoration. */}
    <div className="film-ribbon"><div />{Array.from({ length: 9 }, (_, i) => <span key={i} />)}<div /></div>
  </div>;
}
