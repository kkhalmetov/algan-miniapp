import { APP_SURFACE_COLOR, BRAND_COLOR } from './design-tokens';

type TelegramUser = { id?: number; first_name?: string; last_name?: string; username?: string; language_code?: string; photo_url?: string };

type TelegramWebApp = {
  initData: string;
  version?: string;
  initDataUnsafe?: { user?: TelegramUser };
  ready: () => void;
  expand: () => void;
  isVersionAtLeast?: (version: string) => boolean;
  close?: () => void;
  BackButton?: { show: () => void; hide: () => void; onClick: (handler: () => void) => void; offClick: (handler: () => void) => void };
  HapticFeedback?: { impactOccurred: (style: 'light' | 'medium' | 'heavy') => void; notificationOccurred: (type: 'success' | 'error' | 'warning') => void };
  setHeaderColor?: (color: string) => void;
  setBackgroundColor?: (color: string) => void;
  openLink?: (url: string, options?: { try_instant_view?: boolean }) => void;
  openTelegramLink?: (url: string) => void;
};

declare global {
  interface Window {
    Telegram?: { WebApp: TelegramWebApp };
  }
}

export const telegram = () => (typeof window === 'undefined' ? undefined : window.Telegram?.WebApp);

const supportsTelegramVersion = (webApp: TelegramWebApp, minimumVersion: string) => {
  if (webApp.isVersionAtLeast) return webApp.isVersionAtLeast(minimumVersion);
  if (!webApp.version) return false;
  const current = webApp.version.split('.').map(Number);
  const minimum = minimumVersion.split('.').map(Number);
  const length = Math.max(current.length, minimum.length);
  for (let index = 0; index < length; index += 1) {
    const currentPart = current[index] ?? 0;
    const minimumPart = minimum[index] ?? 0;
    if (currentPart !== minimumPart) return currentPart > minimumPart;
  }
  return true;
};

export function prepareTelegram() {
  const webApp = telegram();
  webApp?.ready();
  webApp?.expand();
  if (webApp && supportsTelegramVersion(webApp, '6.1')) {
    webApp.setHeaderColor?.(supportsTelegramVersion(webApp, '6.9') ? BRAND_COLOR : 'bg_color');
    webApp.setBackgroundColor?.(APP_SURFACE_COLOR);
  }
  return webApp;
}

export function telegramProfile() {
  const user = telegram()?.initDataUnsafe?.user;
  return {
    telegramId: user?.id,
    firstName: user?.first_name ?? '',
    lastName: user?.last_name ?? '',
    username: user?.username ?? '',
    photoUrl: user?.photo_url ?? '',
    locale: user?.language_code?.toLowerCase().startsWith('kk') ? 'kk' as const : 'ru' as const,
    isTelegram: Boolean(user),
  };
}

export const haptic = (kind: 'tap' | 'success' | 'error') => {
  const webApp = telegram();
  const feedback = webApp && supportsTelegramVersion(webApp, '6.1') ? webApp.HapticFeedback : undefined;
  if (kind === 'tap') feedback?.impactOccurred('light');
  else feedback?.notificationOccurred(kind);
};

export function openTelegramLink(url: string) {
  const webApp = telegram();
  if (webApp?.openTelegramLink && supportsTelegramVersion(webApp, '6.1')) {
    webApp.openTelegramLink(url);
    return;
  }
  window.open(url, '_blank', 'noopener,noreferrer');
}

export function openExternalLink(url: string) {
  const webApp = telegram();
  if (webApp?.openLink && supportsTelegramVersion(webApp, '6.1')) {
    webApp.openLink(url);
    return;
  }
  window.open(url, '_blank', 'noopener,noreferrer');
}
