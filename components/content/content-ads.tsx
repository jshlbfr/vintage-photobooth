import { ContentAdsClient } from './content-ads-client';
/** Server environment gate: Preview never loads publisher advertising. */
export function ContentAds(){return process.env.VERCEL_ENV === 'preview' ? null : <ContentAdsClient/>;}
