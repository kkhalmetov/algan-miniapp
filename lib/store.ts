'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { boxes } from './mock-data';
import { normalizePickupCode } from './order-id';
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
  completePurchase: (order: Order) => void;
  resetDemo: () => void;
}

type LegacyOrder = {
  id: string; boxId: string; quantity: number; total: number; pickupCode: string;
  createdAt: string; status: 'paid' | 'collected';
};

const isRecord = (value: unknown): value is Record<string, unknown> => Boolean(value) && typeof value === 'object';

export const migratePersistedState = (persistedState: unknown) => {
  if (!isRecord(persistedState) || !Array.isArray(persistedState.orders)) return persistedState;
  const orders = persistedState.orders.flatMap((candidate): Order[] => {
    if (!isRecord(candidate)) return [];
    if (Array.isArray(candidate.items)) {
      return [{ ...candidate, pickupCode: normalizePickupCode(String(candidate.pickupCode ?? '')) } as unknown as Order];
    }
    if (typeof candidate.boxId !== 'string') return [];
    const legacy = candidate as unknown as LegacyOrder;
    const box = boxes.find((item) => item.id === legacy.boxId);
    const quantity = Math.max(1, Number(legacy.quantity) || 1);
    return [{
      id: legacy.id,
      storeId: box?.storeId ?? '',
      items: [{ boxId: legacy.boxId, quantity, unitPrice: legacy.total / quantity }],
      total: legacy.total,
      pickupCode: normalizePickupCode(legacy.pickupCode),
      createdAt: legacy.createdAt,
      status: legacy.status,
    }];
  });
  return { ...persistedState, orders };
};

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
      completePurchase: (order) => set((state) => {
        const purchasedBoxQuantities = { ...state.purchasedBoxQuantities };
        order.items.forEach((item) => {
          purchasedBoxQuantities[item.boxId] = (purchasedBoxQuantities[item.boxId] ?? 0) + item.quantity;
        });
        return {
          orders: [order, ...state.orders],
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
      version: 2,
      migrate: (persistedState) => migratePersistedState(persistedState) as never,
      partialize: ({ onboardingDone, profile, location, locale, favoriteStoreIds, orders, cartStoreId, cartItems, purchasedBoxQuantities }) => ({
        onboardingDone, profile, location, locale, favoriteStoreIds, orders, cartStoreId, cartItems, purchasedBoxQuantities,
      }),
      onRehydrateStorage: () => (state) => state?.setHydrated(true),
    },
  ),
);
