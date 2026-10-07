import { ContentPage, BoothCTA } from '@/components/content/site-chrome';
import { contentMetadata } from '@/lib/site';
import { FAQ } from '@/lib/site-faq';
export const metadata = contentMetadata('Your photobooth questions, answered', 'Answers about free downloads, camera permissions, timers, frames, Live Moments, local privacy and ten-minute QR links.', '/faq');
export default function Page(){return <ContentPage title="Before the next pose." intro="Practical answers about the booth, your files and those little moments in between." eyebrow="Frequently asked questions"><div className="faq-list">{FAQ.map(([question,answer])=><details key={question}><summary>{question}</summary><p>{answer}</p></details>)}</div><BoothCTA/></ContentPage>;}
