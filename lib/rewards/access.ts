/**
 * Temporary product switch while the site awaits AdSense approval. It is public
 * because client and server must make the same eligibility decision. Set this
 * to `true` in the deployment environment and rebuild to restore the existing
 * rewarded-unlock flow.
 */
export const rewardUnlockRequired = () => process.env.NEXT_PUBLIC_REWARD_UNLOCK_REQUIRED === 'true';
