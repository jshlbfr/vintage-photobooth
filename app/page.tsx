import { LandingArtwork } from "@/components/artwork/landing-artwork";
import { Doodle } from "@/components/artwork/doodle";
import { StartSessionLink } from "@/components/session/start-session-link";

import { SiteHeader, SiteFooter, BoothCTA, EnhancedNotice } from '@/components/content/site-chrome';
import { ContentAds } from '@/components/content/content-ads';
import { contentMetadata } from '@/lib/site';
export const metadata = contentMetadata('Vintage Photobooth — make a memory', 'Take vintage-inspired photo strips in your browser. Explore filters, custom frames, local photo processing and free PNG downloads.', '/');
export default function LandingPage() {
  return <><SiteHeader landing/><main id="main-content"><section className="landing" aria-label="Step inside the photobooth">
    <LandingArtwork />
    <div className="landing-content">
      <Doodle kind="rays" className="landing-title-rays" />
      <h1 className="landing-title">VINTAGE<br />PHOTOBOOTH</h1>
      <Doodle kind="underline" className="landing-underline" />
      <p className="script landing-tagline">Okay, show us the face card.</p>
      <div className="landing-start"><StartSessionLink /><Doodle kind="arrow" /></div>
    </div>
  </section>
  <div className="home-stories">
    <section className="home-story"><p className="eyebrow">The photobooth experience</p><h2>Small strips.<br/>Big memories.</h2><div><p>A good photobooth gives you a few seconds to decide who you want to be: perfectly posed, mid-laugh, or squeezed into the frame with someone you love. The Vintage Photobooth brings that little ritual to your browser.</p><p>Use your camera or choose existing photos, build a strip, and make it your own. There is no account to create. Your finished still strip downloads as a free PNG, ready to save in your own collection.</p></div></section>
    <section className="home-story"><p className="eyebrow">From first pose to finished strip</p><h2>A familiar ritual,<br/>on your screen.</h2><div><ol className="story-steps"><li><strong>Set the scene.</strong> Choose a camera, photo count and timer. Mirror the preview if it feels more natural.</li><li><strong>Make your faces.</strong> Capture one pose at a time or let the countdown carry you through a sequence. Smile! is your final pose cue.</li><li><strong>Leave your mark.</strong> Choose a frame and color, place stickers, and add a few words.</li><li><strong>Collect your photos.</strong> Press Print for a short photobooth animation, then open Results and download your strip.</li></ol><a className="story-link" href="/how-it-works">Walk through the booth →</a></div></section>
    <section className="home-story"><p className="eyebrow">Make it yours</p><h2>A little grain.<br/>A lot of character.</h2><div><p>Keep camera colors with Original, soften a portrait with Velvet, or use Mono for a silver-toned black-and-white strip. Ten looks let you choose the mood without changing the ritual.</p><p>Try a clean frame or one of five illustrated four-photo templates. Change the backing color, let the frame fit your photos, layer stickers, and finish with a date, an inside joke, or a tiny caption. Undo and redo leave room to experiment.</p><a className="story-link" href="/features">Explore the details →</a></div></section>
    <section className="home-story"><p className="eyebrow">The moments in between</p><h2>The getting-ready<br/>part counts, too.</h2><div><p>A Live Moment records the lead-up to a camera photo, including its countdown and Smile! pose. Live Strip brings those moments into the decorated strip; Full Live Moment keeps a continuous camera run in a single video. Optional microphone audio can keep the laughter, too.</p><p>Uploaded photos remain still. Recording and export support depend on your browser, and an interrupted camera run may not offer a Full Live Moment.</p><EnhancedNotice/></div></section>
    <section className="home-story"><p className="eyebrow">Your memories, on your device</p><h2>Made locally.<br/>Shared deliberately.</h2><div><p>Camera photos, chosen uploads, GIFs, motion and audio are processed in the browser. Choosing a photo does not upload it to our server. Save downloads before you refresh or leave the session.</p><p>The QR feature is the explicit exception: when available, it uploads only your final still PNG to private temporary storage. The server stops new access exactly ten minutes after publication. Anyone who has already downloaded a copy can keep it.</p><a className="story-link" href="/privacy">Read how privacy works →</a></div></section>
    <section className="home-faq"><p className="eyebrow">Before you step inside</p><h2>A few things to know.</h2><div className="home-faq-grid"><div><h3>Do I need a camera?</h3><p>You can use a camera or choose photos from your device. Uploads produce stills, without recorded motion.</p></div><div><h3>Is Print a real printer?</h3><p>It is a short on-screen printing animation. It never opens your system print dialog.</p></div><div><h3>Can I use my phone?</h3><p>The layout adapts to small screens. Camera access and motion exports depend on the browser and device.</p></div></div><a className="story-link" href="/faq">More answers in the FAQ →</a></section>
    <BoothCTA/>
  </div></main><SiteFooter/><ContentAds/></>;
}
