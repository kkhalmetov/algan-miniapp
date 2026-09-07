import type { Box, UserProfile } from './types';

const DEMO_FALLBACK_NAMES = new Set(['Пользователь', 'Қолданушы']);

export const isDemoFallbackName = (name: string) => DEMO_FALLBACK_NAMES.has(name.trim());

export const localizedFirstName = (profile: UserProfile, fallbackName: string) => {
  const firstName = profile.firstName.trim();
  return !firstName || isDemoFallbackName(firstName) ? fallbackName : firstName;
};

export const avatarRetryUrl = (url: string, attempt: number) =>
  `${url}${url.includes('?') ? '&' : '?'}algan_avatar_retry=${attempt}`;

export const availableQuantity = (box: Box, purchasedBoxQuantities: Record<string, number>) =>
  Math.max(0, box.quantity - (purchasedBoxQuantities[box.id] ?? 0));
