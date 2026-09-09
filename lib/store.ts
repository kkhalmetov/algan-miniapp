'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { boxes } from './mock-data';
import { normalizePickupCode } from './order-id';
import { canCancelOrder, createOrderPickupSnapshot } from './order-cancellation';
import type { CartItem, Currency, LegalAcceptance, Locale, Order, Tab, UserProfile } from './types';

interface AppState {
  hydrated: boolean;
  onboardingDone: boolean;
  profile: UserProfile;
  legalAcceptance?: LegalAcceptance;
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
  setLocale: (locale: Locale) => void;
  setCurrency: (currency: Currency) => void;
  setTab: (tab: Tab) => void;
  toggleFavoriteBox: (boxId: string) => void;
  addOrder: (order: Order) => void;
  cancelOrder: (orderId: string) => boolean;
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

const withPickupSnapshot = (order: Order): Order => {
  const snapshot = createOrderPickupSnapshot(order.createdAt, order.items, boxes);
  return {
    ...order,
    pickupStartsAt: typeof order.pickupStartsAt === 'string' ? order.pickupStartsAt : snapshot.pickupStartsAt,
    pickupEndsAt: typeof order.pickupEndsAt === 'string' ? order.pickupEndsAt : snapshot.pickupEndsAt,
  };
};

export const migratePersistedState = (persistedState: unknown) => {
  if (!isRecord(persistedState)) return persistedState;
  const migratedState = { ...persistedState };
  delete migratedState.location;
  const legacyFavoriteStoreIds = Array.isArray(migratedState.favoriteStoreIds)
    ? migratedState.favoriteStoreIds.filter((id): id is string => typeof id === 'string')
    : [];
  const orders = Array.isArray(migratedState.orders) ? migratedState.orders.flatMap((candidate): Order[] => {
    if (!isRecord(candidate)) return [];
    if (Array.isArray(candidate.items)) {
      return [withPickupSnapshot({ ...candidate, pickupCode: normalizePickupCode(String(candidate.pickupCode ?? '')) } as unknown as Order)];
    }
    if (typeof candidate.boxId !== 'string') return [];
    const legacy = candidate as unknown as LegacyOrder;
    const box = boxes.find((item) => item.id === legacy.boxId);
    const quantity = Math.max(1, Number(legacy.quantity) || 1);
    return [withPickupSnapshot({
      id: legacy.id,
      storeId: box?.storeId ?? '',
      items: [{ boxId: legacy.boxId, quantity, unitPrice: legacy.total / quantity }],
      total: legacy.total,
      pickupCode: normalizePickupCode(legacy.pickupCode),
      createdAt: legacy.createdAt,
      status: legacy.status,
    })];
  }) : migratedState.orders;
  const favoriteBoxIds = Array.isArray(migratedState.favoriteBoxIds)
    ? [...new Set(migratedState.favoriteBoxIds.filter((id): id is string => typeof id === 'string' && boxes.some((box) => box.id === id)))]
    : legacyFavoriteStoreIds.length > 0
      ? boxes
          .filter((box) => legacyFavoriteStoreIds.includes(box.storeId))
          .map((box) => box.id)
      : [];
  return Array.isArray(migratedState.orders)
    ? { ...migratedState, orders, favoriteBoxIds }
    : { ...migratedState, favoriteBoxIds };
};

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
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
      setLocale: (locale) => set({ locale }),
      setCurrency: (currency) => set({ currency }),
      setTab: (tab) => set({ tab }),
      toggleFavoriteBox: (boxId) => set((state) => ({
        favoriteBoxIds: state.favoriteBoxIds.includes(boxId)
          ? state.favoriteBoxIds.filter((id) => id !== boxId)
          : [...state.favoriteBoxIds, boxId],
      })),
      addOrder: (order) => set((state) => ({ orders: [order, ...state.orders] })),
      cancelOrder: (orderId) => {
        const state = get();
        const order = state.orders.find((candidate) => candidate.id === orderId);
        if (!order || !canCancelOrder(order)) return false;

        const purchasedBoxQuantities = { ...state.purchasedBoxQuantities };
        order.items.forEach((item) => {
          const nextQuantity = Math.max(0, (purchasedBoxQuantities[item.boxId] ?? 0) - item.quantity);
          if (nextQuantity === 0) delete purchasedBoxQuantities[item.boxId];
          else purchasedBoxQuantities[item.boxId] = nextQuantity;
        });
        set({
          orders: state.orders.map((candidate) => candidate.id === orderId ? { ...candidate, status: 'cancelled' } : candidate),
          purchasedBoxQuantities,
        });
        return true;
      },
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
        onboardingDone: false, profile: { firstName: '' }, legalAcceptance: undefined, favoriteBoxIds: [], orders: [],
        cartStoreId: undefined, cartItems: [], purchasedBoxQuantities: {}, tab: 'home',
      }),
    }),
    {
      name: 'algan-miniapp',
      version: 6,
      migrate: (persistedState) => migratePersistedState(persistedState) as never,
      partialize: ({ onboardingDone, profile, legalAcceptance, locale, currency, favoriteBoxIds, orders, cartStoreId, cartItems, purchasedBoxQuantities }) => ({
        onboardingDone, profile, legalAcceptance, locale, currency, favoriteBoxIds, orders, cartStoreId, cartItems, purchasedBoxQuantities,
      }),
      onRehydrateStorage: () => (state) => state?.setHydrated(true),
    },
  ),
);
