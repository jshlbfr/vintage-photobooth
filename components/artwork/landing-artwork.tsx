import { Doodle } from "@/components/artwork/doodle";
import { PhotoStrip } from "@/components/photobooth/photo-strip";
import { sampleComposition } from "@/lib/composition";

/** Replaceable original line-art placeholders, not traced or extracted Figma artwork. */
function BoothSketch() {
  return <svg className="booth-sketch" viewBox="0 0 760 950" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
    <path d="M40 200 530 90l180 87v686L215 936 37 843ZM40 200l175 70 495-93M215 270v666M530 90v714L37 843M245 290l257-56v583l-257 61Z" />
    <path d="m168 169 1-89 350-69 17 85M178 163V89l330-66v73M257 304l29-6v554l-29 9Zm248-69 168-32v631l-165 26M532 231c30 64-30 502 0 616m37-624c-20 154 32 445 0 615m36-622c30 156-22 468 0 617m36-624c-19 164 23 435 0 617M75 290l81 32v132l-81-31Zm5 14 68 26v104l-68-21M70 491l63 24v127l-63-24Zm26 189 58 22v68l-58-22M288 685l111-25 46 32-119 23v65l-38-13Z" />
    <text x="195" y="137" transform="rotate(-11 195 137)" fontSize="39" fontFamily="serif" strokeWidth=".5" fill="currentColor">PHOTOBOOTH</text>
  </svg>;
}

function CameraSketch() {
  return <svg className="camera-sketch" viewBox="0 0 400 260" aria-hidden="true"><g stroke="#33281c" strokeWidth="4"><rect x="8" y="44" width="380" height="204" rx="18" fill="#b9a181" /><path d="M8 108h380v117H8Z" fill="#3d3428" /><rect x="26" y="57" width="88" height="40" rx="3" fill="#e2d6b8" /><path d="M33 66h72m-72 9h72m-72 9h72" opacity=".4" /><rect x="267" y="58" width="66" height="40" rx="5" fill="#211c16" /><rect x="283" y="67" width="33" height="21" fill="#64705f" /><rect x="136" y="29" width="67" height="16" rx="5" fill="#6e5c44" /><circle cx="212" cy="156" r="82" fill="#a48b67" /><circle cx="212" cy="156" r="67" fill="#231f18" /><circle cx="212" cy="156" r="50" fill="#100f0d" /><circle cx="212" cy="156" r="32" fill="#2c3029" /><circle cx="203" cy="147" r="18" fill="#131613" /><path d="M179 129a42 42 0 0 1 53-10" stroke="#c9bf9e" opacity=".4" /></g></svg>;
}

export function LandingArtwork() {
  const woman = sampleComposition({ frameColor: "#d8c4a5", photos: Array.from({ length: 6 }, () => ({ src: "/images/sample-portrait-2.jpg", alt: "Sample portrait" })) });
  const man = sampleComposition({ frameColor: "#d8c4a5" });
  return <div className="landing-artwork" aria-hidden="true">
    <BoothSketch />
    <div className="collage-strip collage-left-one"><PhotoStrip composition={woman} /></div>
    <div className="collage-strip collage-left-two"><PhotoStrip composition={man} /></div>
    <div className="collage-strip collage-right-one"><PhotoStrip composition={woman} /></div>
    <div className="collage-strip collage-right-two"><PhotoStrip composition={man} /></div>
    <div className="collage-polaroid collage-left-front"><PhotoStrip composition={{ ...woman, count: 1, caption: "a little nostalgia" }} /></div>
    <div className="collage-polaroid collage-right-front"><PhotoStrip composition={{ ...man, count: 2 }} /></div>
    <Doodle kind="sparkles" className="landing-sparkles" />
    <Doodle kind="plane" className="landing-plane" />
    <Doodle kind="hearts" className="landing-hearts" />
    <CameraSketch />
    <div className="film-ribbon"><div />{Array.from({ length: 9 }, (_, i) => <span key={i} />)}<div /></div>
  </div>;
}
