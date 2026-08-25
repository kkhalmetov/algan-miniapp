type TelegramUser = { first_name?: string; last_name?: string; language_code?: string };

type TelegramWebApp = {
  initData: string;
  initDataUnsafe?: { user?: TelegramUser };
  ready: () => void;
  expand: () => void;
  close?: () => void;
  BackButton?: { show: () => void; hide: () => void; onClick: (handler: () => void) => void; offClick: (handler: () => void) => void };
  HapticFeedback?: { impactOccurred: (style: 'light' | 'medium' | 'heavy') => void; notificationOccurred: (type: 'success' | 'error' | 'warning') => void };
  setHeaderColor?: (color: string) => void;
  setBackgroundColor?: (color: string) => void;
};

declare global {
  interface Window {
    Telegram?: { WebApp: TelegramWebApp };
  }
}

export const telegram = () => (typeof window === 'undefined' ? undefined : window.Telegram?.WebApp);

export function prepareTelegram() {
  const webApp = telegram();
  webApp?.ready();
  webApp?.expand();
  webApp?.setHeaderColor?.('#1f5c49');
  webApp?.setBackgroundColor?.('#f5f0e6');
  return webApp;
}

export function telegramProfile() {
  const user = telegram()?.initDataUnsafe?.user;
  return {
    firstName: user?.first_name ?? '',
    lastName: user?.last_name ?? '',
    locale: user?.language_code?.toLowerCase().startsWith('kk') ? 'kk' as const : 'ru' as const,
  };
}

export const haptic = (kind: 'tap' | 'success' | 'error') => {
  const feedback = telegram()?.HapticFeedback;
  if (kind === 'tap') feedback?.impactOccurred('light');
  else feedback?.notificationOccurred(kind);
};
