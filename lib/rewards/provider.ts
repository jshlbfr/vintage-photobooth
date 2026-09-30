export type RewardResult={status:'completed';receipt:string}|{status:'cancelled'|'failed'};
export interface RewardProvider {request(sessionId:string,signal:AbortSignal):Promise<RewardResult>}
/** Only the explicitly-labelled local development UI invokes this adapter. */
export const developmentRewardProvider:RewardProvider={async request(sessionId,signal){
  const response=await fetch('/api/reward/development',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({sessionId,result:'completed'}),signal});
  if(!response.ok)return {status:'failed'};const result=await response.json();
  return result.status==='completed'&&typeof result.receipt==='string'?result:{status:'failed'};
}};
