import { telegram } from './telegram';
import type { Box, Order, Store, UserLocation, UserProfile } from './types';

export interface DataProvider {
  authenticateTelegram(initData: string): Promise<string>;
  getProfile(): Promise<UserProfile>;
  updateProfile(profile: UserProfile): Promise<UserProfile>;
  saveLocation(location: UserLocation): Promise<UserLocation>;
  listStores(location: UserLocation): Promise<Store[]>;
  listBoxes(location: UserLocation): Promise<Box[]>;
  listFavoriteStores(): Promise<Store[]>;
  toggleFavoriteStore(storeId: string): Promise<void>;
  listOrders(): Promise<Order[]>;
}

let accessToken: string | undefined;

export async function authenticateTelegram() {
  if (process.env.NEXT_PUBLIC_DATA_MODE !== 'api') return;
  const initData = telegram()?.initData;
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
  if (!initData || !baseUrl) return;

  const response = await fetch(`${baseUrl.replace(/\/$/, '')}/auth/telegram`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ init_data: initData }),
  });
  if (!response.ok) throw new Error('Telegram authentication failed');
  const body = await response.json() as { access_token: string };
  accessToken = body.access_token;
  sessionStorage.setItem('algan_access_token', accessToken);
}

export const currentAccessToken = () => accessToken ?? (typeof window === 'undefined' ? undefined : sessionStorage.getItem('algan_access_token') ?? undefined);
