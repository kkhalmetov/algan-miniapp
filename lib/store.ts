'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { CartItem, Locale, Order, Tab, UserLocation, UserProfile } from './types';

interface AppState {
  hydrated: boolean;
  onboardingDone: boolean;
  profile: UserProfile;
  location?: UserLocation;
  locale: Locale;
  tab: Tab;
  favoriteStoreIds: string[];
  orders: Order[];
  cartStoreId?: string;
  cartItems: CartItem[];
  purchasedBoxQuantities: Record<string, number>;
  setHydrated: (value: boolean) => void;
  completeOnboarding: (profile: UserProfile) => void;
  syncTelegramProfile: (profile: Pick<UserProfile, 'telegramId' | 'firstName' | 'lastName' | 'photoUrl'>) => void;
  updatePhone: (phone: string) => void;
  setLocation: (location: UserLocation) => void;
  setLocale: (locale: Locale) => void;
  setTab: (tab: Tab) => void;
  toggleFavorite: (storeId: string) => void;
  addOrder: (order: Order) => void;
  setCartItemQuantity: (boxId: string, storeId: string, quantity: number) => void;
  clearCart: () => void;
  completePurchase: (orders: Order[]) => void;
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
      cartItems: [],
      purchasedBoxQuantities: {},
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
      setCartItemQuantity: (boxId, storeId, quantity) => set((state) => {
        const currentItems = state.cartStoreId && state.cartStoreId !== storeId ? [] : state.cartItems;
        const nextItems = quantity <= 0
          ? currentItems.filter((item) => item.boxId !== boxId)
          : currentItems.some((item) => item.boxId === boxId)
            ? currentItems.map((item) => item.boxId === boxId ? { ...item, quantity } : item)
            : [...currentItems, { boxId, quantity }];
        return { cartItems: nextItems, cartStoreId: nextItems.length > 0 ? storeId : undefined };
      }),
      clearCart: () => set({ cartStoreId: undefined, cartItems: [] }),
      completePurchase: (newOrders) => set((state) => {
        const purchasedBoxQuantities = { ...state.purchasedBoxQuantities };
        newOrders.forEach((order) => {
          purchasedBoxQuantities[order.boxId] = (purchasedBoxQuantities[order.boxId] ?? 0) + order.quantity;
        });
        return {
          orders: [...newOrders, ...state.orders],
          purchasedBoxQuantities,
          cartStoreId: undefined,
          cartItems: [],
        };
      }),
      resetDemo: () => set({
        onboardingDone: false, profile: { firstName: '' }, location: undefined, favoriteStoreIds: [], orders: [],
        cartStoreId: undefined, cartItems: [], purchasedBoxQuantities: {}, tab: 'home',
      }),
    }),
    {
      name: 'algan-miniapp',
      partialize: ({ onboardingDone, profile, location, locale, favoriteStoreIds, orders, cartStoreId, cartItems, purchasedBoxQuantities }) => ({
        onboardingDone, profile, location, locale, favoriteStoreIds, orders, cartStoreId, cartItems, purchasedBoxQuantities,
      }),
      onRehydrateStorage: () => (state) => state?.setHydrated(true),
    },
  ),
);
