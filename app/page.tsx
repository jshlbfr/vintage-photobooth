import { LandingArtwork } from "@/components/artwork/landing-artwork";
import { Doodle } from "@/components/artwork/doodle";
import { ActionLink } from "@/components/ui/controls";

export default function LandingPage() {
  return <main id="main-content" className="landing">
    <LandingArtwork />
    <div className="landing-content">
      <Doodle kind="rays" className="landing-title-rays" />
      <h1 className="landing-title">VINTAGE<br />PHOTOBOOTH</h1>
      <Doodle kind="underline" className="landing-underline" />
      <p className="script landing-tagline">Okay, show us the face card.</p>
      <div className="landing-start"><ActionLink href="/camera" className="button-cream" arrow={false}>START</ActionLink><Doodle kind="arrow" /></div>
    </div>
  </main>;
}
