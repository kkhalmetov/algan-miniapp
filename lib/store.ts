'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { boxes } from './mock-data';
import { normalizePickupCode } from './order-id';
import type { CartItem, Currency, LegalAcceptance, Locale, Order, Tab, UserLocation, UserProfile } from './types';

interface AppState {
  hydrated: boolean;
  onboardingDone: boolean;
  profile: UserProfile;
  legalAcceptance?: LegalAcceptance;
  location?: UserLocation;
  locale: Locale;
  currency: Currency;
  tab: Tab;
  favoriteBoxIds: string[];
  orders: Order[];
  cartStoreId?: string;
  cartItems: CartItem[];
  purchasedBoxQuantities: Record<string, number>;
  setHydrated: (value: boolean) => void;
  completeOnboarding: (profile: UserProfile, legalAcceptance: LegalAcceptance) => void;
  acceptLegalDocuments: (legalAcceptance: LegalAcceptance) => void;
  syncTelegramProfile: (profile: Pick<UserProfile, 'telegramId' | 'firstName' | 'lastName' | 'photoUrl'>) => void;
  updatePhone: (phone: string) => void;
  setLocation: (location: UserLocation) => void;
  setLocale: (locale: Locale) => void;
  setCurrency: (currency: Currency) => void;
  setTab: (tab: Tab) => void;
  toggleFavoriteBox: (boxId: string) => void;
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
  if (!isRecord(persistedState)) return persistedState;
  const legacyFavoriteStoreIds = Array.isArray(persistedState.favoriteStoreIds)
    ? persistedState.favoriteStoreIds.filter((id): id is string => typeof id === 'string')
    : [];
  const orders = Array.isArray(persistedState.orders) ? persistedState.orders.flatMap((candidate): Order[] => {
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
  }) : persistedState.orders;
  const favoriteBoxIds = Array.isArray(persistedState.favoriteBoxIds)
    ? [...new Set(persistedState.favoriteBoxIds.filter((id): id is string => typeof id === 'string' && boxes.some((box) => box.id === id)))]
    : legacyFavoriteStoreIds.length > 0
      ? boxes
          .filter((box) => legacyFavoriteStoreIds.includes(box.storeId))
          .map((box) => box.id)
      : [];
  return Array.isArray(persistedState.orders)
    ? { ...persistedState, orders, favoriteBoxIds }
    : { ...persistedState, favoriteBoxIds };
};

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      hydrated: false,
      onboardingDone: false,
      profile: { firstName: '' },
      legalAcceptance: undefined,
      locale: 'kk',
      currency: 'KZT',
      tab: 'home',
      favoriteBoxIds: [],
      orders: [],
      cartItems: [],
      purchasedBoxQuantities: {},
      setHydrated: (hydrated) => set({ hydrated }),
      completeOnboarding: (profile, legalAcceptance) => set({ profile, legalAcceptance, onboardingDone: true }),
      acceptLegalDocuments: (legalAcceptance) => set({ legalAcceptance }),
      syncTelegramProfile: (telegramProfile) => set((state) => {
        const isSameTelegramUser = Boolean(
          telegramProfile.telegramId && state.profile.telegramId === telegramProfile.telegramId,
        );
        const profile = {
          ...state.profile,
          telegramId: telegramProfile.telegramId ?? state.profile.telegramId,
          firstName: telegramProfile.firstName || state.profile.firstName,
          lastName: telegramProfile.lastName || undefined,
          photoUrl: telegramProfile.photoUrl || (isSameTelegramUser ? state.profile.photoUrl : undefined),
        };
        if (
          profile.telegramId === state.profile.telegramId
          && profile.firstName === state.profile.firstName
          && profile.lastName === state.profile.lastName
          && profile.photoUrl === state.profile.photoUrl
        ) return state;
        return { profile };
      }),
      updatePhone: (phone) => set((state) => ({ profile: { ...state.profile, phone } })),
      setLocation: (location) => set({ location }),
      setLocale: (locale) => set({ locale }),
      setCurrency: (currency) => set({ currency }),
      setTab: (tab) => set({ tab }),
      toggleFavoriteBox: (boxId) => set((state) => ({
        favoriteBoxIds: state.favoriteBoxIds.includes(boxId)
          ? state.favoriteBoxIds.filter((id) => id !== boxId)
          : [...state.favoriteBoxIds, boxId],
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
        onboardingDone: false, profile: { firstName: '' }, legalAcceptance: undefined, location: undefined, favoriteBoxIds: [], orders: [],
        cartStoreId: undefined, cartItems: [], purchasedBoxQuantities: {}, tab: 'home',
      }),
    }),
    {
      name: 'algan-miniapp',
      version: 4,
      migrate: (persistedState) => migratePersistedState(persistedState) as never,
      partialize: ({ onboardingDone, profile, legalAcceptance, location, locale, currency, favoriteBoxIds, orders, cartStoreId, cartItems, purchasedBoxQuantities }) => ({
        onboardingDone, profile, legalAcceptance, location, locale, currency, favoriteBoxIds, orders, cartStoreId, cartItems, purchasedBoxQuantities,
      }),
      onRehydrateStorage: () => (state) => state?.setHydrated(true),
    },
  ),
);
