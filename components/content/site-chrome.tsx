import type { ReactNode } from 'react';
import { ContentAds } from './content-ads';
import { SITE_CONTACT } from '@/lib/site';
const links = [['How it works','/how-it-works'],['Features','/features'],['FAQ','/faq']] as const;
// Native links intentionally isolate advertising documents from the in-memory booth session.
/* eslint-disable @next/next/no-html-link-for-pages */
export function SiteHeader(){return <header className="site-header"><a className="site-brand" href="/">The Vintage Photobooth<span>A little nostalgia. A memory to keep.</span></a><nav aria-label="Main navigation">{links.map(([label,href])=><a key={href} href={href}>{label}</a>)}<a className="button button-cream" href="/camera">Start Photobooth <span aria-hidden="true">↗</span></a></nav></header>;}
export function SiteFooter(){return <footer className="site-footer"><div><a className="site-brand" href="/">The Vintage Photobooth</a><p>Made for the poses—and the moments in between.</p><a href={`mailto:${SITE_CONTACT}`}>{SITE_CONTACT}</a></div><nav aria-label="Footer navigation">{[...links,['Privacy','/privacy'],['Terms','/terms']].map(([label,href])=><a key={href} href={href}>{label}</a>)}</nav></footer>;}
export function ContentPage({title,intro,eyebrow='Inside the booth',ads=true,children}:{title:string;intro:string;eyebrow?:string;ads?:boolean;children:ReactNode}){
  return <><SiteHeader/><main id="main-content" className="content-page"><header className="content-intro"><p className="eyebrow">{eyebrow}</p><h1>{title}</h1><p>{intro}</p></header><article className="content-prose">{children}</article></main><SiteFooter/>{ads&&<ContentAds/>}</>;
}
export function ContentSection({title,children}:{title:string;children:ReactNode}){return <section><h2>{title}</h2>{children}</section>;}
export function BoothCTA(){return <div className="content-cta"><p className="script">Your next favorite memory starts here.</p><a className="button" href="/camera">Start Photobooth →</a><p>No account needed. Photo downloads are free.</p></div>;}
export function EnhancedNotice(){return <aside className="content-note"><strong>A note about enhanced features</strong><p>Free PNG downloads are available now. GIF, Live Strip, Full Live Moment and QR sharing require a rewarded-ad unlock. The live reward provider is not connected yet, so these enhanced actions are currently unavailable on the public site. When connected, one completed reward will unlock them together for the current session.</p></aside>;}
