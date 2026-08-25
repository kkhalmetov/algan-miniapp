'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Locale, Order, Tab, UserLocation, UserProfile } from './types';

interface AppState {
  hydrated: boolean;
  onboardingDone: boolean;
  profile: UserProfile;
  location?: UserLocation;
  locale: Locale;
  tab: Tab;
  favoriteStoreIds: string[];
  orders: Order[];
  setHydrated: (value: boolean) => void;
  completeOnboarding: (profile: UserProfile) => void;
  syncTelegramProfile: (profile: Pick<UserProfile, 'telegramId' | 'firstName' | 'lastName' | 'photoUrl'>) => void;
  updatePhone: (phone: string) => void;
  setLocation: (location: UserLocation) => void;
  setLocale: (locale: Locale) => void;
  setTab: (tab: Tab) => void;
  toggleFavorite: (storeId: string) => void;
  addOrder: (order: Order) => void;
  resetDemo: () => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      hydrated: false,
      onboardingDone: false,
      profile: { firstName: '' },
      locale: 'ru',
      tab: 'home',
      favoriteStoreIds: [],
      orders: [],
      setHydrated: (hydrated) => set({ hydrated }),
      completeOnboarding: (profile) => set({ profile, onboardingDone: true }),
      syncTelegramProfile: (telegramProfile) => set((state) => {
        const isSameTelegramUser = Boolean(
          telegramProfile.telegramId && state.profile.telegramId === telegramProfile.telegramId,
        );
        return {
          profile: {
            ...state.profile,
            telegramId: telegramProfile.telegramId ?? state.profile.telegramId,
            firstName: telegramProfile.firstName || state.profile.firstName,
            lastName: telegramProfile.lastName || undefined,
            photoUrl: telegramProfile.photoUrl || (isSameTelegramUser ? state.profile.photoUrl : undefined),
          },
        };
      }),
      updatePhone: (phone) => set((state) => ({ profile: { ...state.profile, phone } })),
      setLocation: (location) => set({ location }),
      setLocale: (locale) => set({ locale }),
      setTab: (tab) => set({ tab }),
      toggleFavorite: (storeId) => set((state) => ({
        favoriteStoreIds: state.favoriteStoreIds.includes(storeId)
          ? state.favoriteStoreIds.filter((id) => id !== storeId)
          : [...state.favoriteStoreIds, storeId],
      })),
      addOrder: (order) => set((state) => ({ orders: [order, ...state.orders] })),
      resetDemo: () => set({ onboardingDone: false, profile: { firstName: '' }, location: undefined, favoriteStoreIds: [], orders: [], tab: 'home' }),
    }),
    {
      name: 'algan-miniapp',
      partialize: ({ onboardingDone, profile, location, locale, favoriteStoreIds, orders }) => ({
        onboardingDone, profile, location, locale, favoriteStoreIds, orders,
      }),
      onRehydrateStorage: () => (state) => state?.setHydrated(true),
    },
  ),
);
