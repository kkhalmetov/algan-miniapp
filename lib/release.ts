export type ReleaseMode = 'demo' | 'live';

export const RELEASE_MODE: ReleaseMode = process.env.NEXT_PUBLIC_RELEASE_MODE === 'live'
  ? 'live'
  : 'demo';

export const IS_DEMO_RELEASE = RELEASE_MODE === 'demo';
