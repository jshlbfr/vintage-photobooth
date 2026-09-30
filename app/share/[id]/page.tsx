import {shareStore} from '@/lib/sharing/supabase';
import {SHARE_ID,activeShare} from '@/lib/sharing/policy';
import {PublicShare} from '@/components/sharing/public-share';
import Link from 'next/link';
export const dynamic='force-dynamic';
export const metadata={title:'Your shared photo strip',robots:{index:false,follow:false,noarchive:true}};
export default async function SharePage({params}:{params:Promise<{id:string}>}){
  const {id}=await params;let expiresAt:string|undefined;
  if(SHARE_ID.test(id)){try{const row=await shareStore.active(id);if(row&&activeShare(row.expires_at))expiresAt=row.expires_at;}catch{}}
  // This dynamic server response takes a request-time snapshot for the expiry display.
  // eslint-disable-next-line react-hooks/purity
  const serverNow=Date.now();
  return <main id="main-content" className="booth-shell"><section className="cream-panel public-share"><h1>Vintage Photobooth</h1>{expiresAt?<PublicShare id={id} expiresAt={expiresAt} serverNow={serverNow}/>:<p>This photo strip has expired or is unavailable.</p>}<Link className="text-link" href="/">Make your own memories →</Link></section></main>;
}
