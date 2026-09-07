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

const telegramAuthUrl = (baseUrl: string) => {
  let url: URL;
  try {
    url = new URL(baseUrl);
  } catch {
    throw new Error('Telegram API URL is invalid');
  }

  if (url.protocol !== 'https:' || url.username || url.password || url.search || url.hash) {
    throw new Error('Telegram API URL must be a clean HTTPS URL');
  }

  url.pathname = `${url.pathname.replace(/\/+$/, '')}/auth/telegram`;
  return url.toString();
};

const parseAccessToken = (payload: unknown) => {
  if (!payload || typeof payload !== 'object' || !('access_token' in payload)) {
    throw new Error('Telegram authentication response is invalid');
  }
  const token = (payload as { access_token?: unknown }).access_token;
  if (typeof token !== 'string' || !token.trim() || token.length > 16_384) {
    throw new Error('Telegram authentication response is invalid');
  }
  return token;
};

export async function authenticateTelegram() {
  if (process.env.NEXT_PUBLIC_DATA_MODE !== 'api') return;
  accessToken = undefined;
  const initData = telegram()?.initData;
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
  if (!initData || !baseUrl) return;

  const response = await fetch(telegramAuthUrl(baseUrl), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ init_data: initData }),
    cache: 'no-store',
    credentials: 'omit',
    referrerPolicy: 'no-referrer',
  });
  if (!response.ok) throw new Error('Telegram authentication failed');
  accessToken = parseAccessToken(await response.json());
}

export const currentAccessToken = () => accessToken;
