import assert from 'node:assert/strict';
const origin=process.env.PHOTOBOOTH_URL??'http://127.0.0.1:3004';
const content=['/','/how-it-works','/features','/faq','/privacy','/terms'];
for(const path of content){
 const r=await fetch(origin+path),html=await r.text();assert.equal(r.status,200,path);
 assert.equal((html.match(/<h1[ >]/g)??[]).length,1,path+' one heading');
 assert.match(html,/rel="canonical"/);assert.match(html,/google-adsense-account/);
 assert.equal(html.includes('pagead2.googlesyndication.com/pagead/js/adsbygoogle.js'),!['/privacy','/terms'].includes(path),path+' ad script');
 assert.equal(r.headers.get('x-content-type-options'),'nosniff');assert.equal(r.headers.get('referrer-policy'),'no-referrer');assert.match(r.headers.get('permissions-policy'),/camera=\(self\)/);assert.match(r.headers.get('content-security-policy'),/frame-ancestors 'none'/);
}
for(const path of ['/camera','/capture','/customize','/print','/results','/share/invalid','/missing-m9-page']){const r=await fetch(origin+path),html=await r.text();assert.ok(!html.includes('pagead2.googlesyndication.com/pagead/js/adsbygoogle.js'),path+' utility ad-free');if(path.startsWith('/share')){assert.match(r.headers.get('cache-control'),/no-store/);assert.match(html,/noindex/);assert.equal(r.headers.get('referrer-policy'),'no-referrer');}}
const ads=await fetch(origin+'/ads.txt');assert.equal(ads.status,200);assert.match(ads.headers.get('content-type'),/text\/plain/);assert.equal(await ads.text(),'google.com, pub-1193568598392219, DIRECT, f08c47fec0942fa0\n');
const robots=await (await fetch(origin+'/robots.txt')).text();assert.match(robots,/Allow: \//);assert.match(robots,/Sitemap: https:\/\/thevintagebooth.vercel.app\/sitemap.xml/);
const sitemap=await (await fetch(origin+'/sitemap.xml')).text();assert.equal((sitemap.match(/<loc>/g)??[]).length,6);assert.ok(!/\/share\/|\/api\/|\/camera/.test(sitemap));
console.log('M9 HTTP checks passed: six content pages, ad eligibility, headers, private share caching, ads.txt, robots and sitemap.');
