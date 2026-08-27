'use client';
/* eslint-disable @next/next/no-img-element */

import {
  AlertTriangle, Building2, Check, ChevronDown, ChevronRight, CircleHelp, Clock3, Heart, Home, Info, Languages, Mail, Map as MapIcon,
  MapPin, Minus, Package, PackageCheck, Phone, Plus, Route, ShoppingBag, Sparkles,
} from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { AlganLogo } from '@/components/algan-logo';
import LocationMap from '@/components/location-map';
import { DangerButton, EmptyState, IconBadge, IconButton, ListRow, ModalHeader, PrimaryButton, SecondaryButton, SegmentedControl, SheetHandle, SurfaceCard, TextField } from '@/components/ui-kit';
import { authenticateTelegram } from '@/lib/api';
import { getRouteOptions, type RouteProvider } from '@/lib/maps';
import { boxes, storeById, stores } from '@/lib/mock-data';
import { createOrderId, formatOrderId } from '@/lib/order-id';
import { formatKazakhstanPhoneInput, normalizeKazakhstanPhone } from '@/lib/phone';
import { formatBoxesLeft } from '@/lib/stock';
import { useAppStore } from '@/lib/store';
import { getCopy, type CopyKey } from '@/lib/translations';
import { haptic, openExternalLink, openTelegramLink, prepareTelegram, telegramProfile } from '@/lib/telegram';
import type { Box, Locale, Order, Tab, UserProfile } from '@/lib/types';

const SHYMKENT = { lat: 42.3155, lng: 69.5869 };
export const MINIMUM_SPLASH_MS = 900;
const TELEGRAM_SYNC_DELAYS_MS = [0, 250, 750, 1500, 3000] as const;
const SUPPORT_TELEGRAM_URL = 'https://t.me/kkhalmetov';
type LegalDocument = 'terms' | 'privacy' | 'orderRules' | 'publicOffer';
const LEGAL_TITLE_KEYS: Record<LegalDocument, CopyKey> = {
  terms: 'termsTitle', privacy: 'privacyTitle', orderRules: 'orderRulesTitle', publicOffer: 'publicOfferTitle',
};

export const avatarRetryUrl = (url: string, attempt: number) =>
  `${url}${url.includes('?') ? '&' : '?'}algan_avatar_retry=${attempt}`;

const formatPrice = (value: number, locale: Locale) =>
  `${new Intl.NumberFormat(locale === 'kk' ? 'kk-KZ' : 'ru-KZ').format(value)} ₸`;

export default function AlganApp() {
  const {
    hydrated, onboardingDone, profile, locale, tab, favoriteStoreIds, orders,
    completeOnboarding, syncTelegramProfile, updatePhone, setLocale, setTab, toggleFavorite, addOrder, resetDemo,
  } = useAppStore();
  const t = getCopy(locale);
  const [phone, setPhone] = useState('+7');
  const [terms, setTerms] = useState(false);
  const [privacy, setPrivacy] = useState(false);
  const [legal, setLegal] = useState<LegalDocument | null>(null);
  const [documentsOpen, setDocumentsOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [selectedBox, setSelectedBox] = useState<Box | null>(null);
  const [checkoutBox, setCheckoutBox] = useState<Box | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [successOrder, setSuccessOrder] = useState<Order | null>(null);
  const [editingPhone, setEditingPhone] = useState(false);
  const [category, setCategory] = useState<'all' | 'bakery' | 'cafe' | 'market'>('all');
  const [minimumSplashElapsed, setMinimumSplashElapsed] = useState(false);
  const onboardingLocaleInitialized = useRef(false);
  const onboardingLocaleChosenManually = useRef(false);

  useEffect(() => {
    const splashTimer = window.setTimeout(() => setMinimumSplashElapsed(true), MINIMUM_SPLASH_MS);
    return () => window.clearTimeout(splashTimer);
  }, []);

  const syncFromTelegram = useCallback(() => {
    prepareTelegram();
    const tgProfile = telegramProfile();
    if (!tgProfile.isTelegram) return;
    if (onboardingDone) {
      syncTelegramProfile({
        telegramId: tgProfile.telegramId,
        firstName: tgProfile.firstName,
        lastName: tgProfile.lastName || undefined,
        photoUrl: tgProfile.photoUrl || undefined,
      });
    } else if (!onboardingLocaleInitialized.current && !onboardingLocaleChosenManually.current) {
      onboardingLocaleInitialized.current = true;
      setLocale(tgProfile.locale);
    }
  }, [onboardingDone, setLocale, syncTelegramProfile]);

  const setOnboardingLocale = useCallback((nextLocale: Locale) => {
    onboardingLocaleChosenManually.current = true;
    onboardingLocaleInitialized.current = true;
    setLocale(nextLocale);
  }, [setLocale]);

  useEffect(() => {
    const retryTimers = new Set<number>();
    let lastScheduledAt = Number.NEGATIVE_INFINITY;

    const scheduleTelegramSync = () => {
      const now = Date.now();
      if (now - lastScheduledAt < 200) return;
      lastScheduledAt = now;
      TELEGRAM_SYNC_DELAYS_MS.forEach((delay) => {
        const timer = window.setTimeout(() => {
          retryTimers.delete(timer);
          syncFromTelegram();
        }, delay);
        retryTimers.add(timer);
      });
    };

    const syncWhenVisible = () => {
      if (!document.hidden) scheduleTelegramSync();
    };

    scheduleTelegramSync();
    window.addEventListener('focus', scheduleTelegramSync);
    document.addEventListener('visibilitychange', syncWhenVisible);

    return () => {
      retryTimers.forEach((timer) => window.clearTimeout(timer));
      window.removeEventListener('focus', scheduleTelegramSync);
      document.removeEventListener('visibilitychange', syncWhenVisible);
    };
  }, [syncFromTelegram]);

  useEffect(() => {
    void authenticateTelegram().catch(() => undefined);
  }, []);

  const finishOnboarding = () => {
    const normalizedPhone = normalizeKazakhstanPhone(phone);
    if (!normalizedPhone || !terms || !privacy) return;
    const tgProfile = telegramProfile();
    haptic('success');
    completeOnboarding({
      telegramId: tgProfile.telegramId,
      firstName: tgProfile.firstName.trim() || t('fallbackUser'),
      lastName: tgProfile.lastName.trim() || undefined,
      phone: normalizedPhone,
      photoUrl: tgProfile.photoUrl || undefined,
    });
  };

  const openBox = (box: Box) => {
    haptic('tap');
    setSelectedBox(box);
  };

  const buyBox = (box: Box) => {
    setSelectedBox(null);
    setCheckoutBox(box);
    setQuantity(1);
  };

  const pay = () => {
    if (!checkoutBox) return;
    const order: Order = {
      id: createOrderId(orders.map((order) => order.id)),
      boxId: checkoutBox.id,
      quantity,
      total: checkoutBox.salePrice * quantity,
      pickupCode: String(Math.floor(1000 + Math.random() * 9000)),
      createdAt: new Date().toISOString(),
      status: 'paid',
    };
    addOrder(order);
    setCheckoutBox(null);
    setSuccessOrder(order);
    haptic('success');
  };

  if (!hydrated || !minimumSplashElapsed) return <Splash />;
  if (!onboardingDone) {
    return (
      <PhoneShell>
        <Onboarding
          t={t} locale={locale} setLocale={setOnboardingLocale}
          phone={phone} setPhone={setPhone}
          terms={terms} setTerms={setTerms} privacy={privacy} setPrivacy={setPrivacy}
          openLegal={setLegal} onContinue={finishOnboarding}
        />
        {legal && <LegalModal type={legal} t={t} onClose={() => setLegal(null)} />}
      </PhoneShell>
    );
  }
  return (
    <PhoneShell>
      <div className="relative flex h-dvh min-h-0 flex-col overflow-hidden bg-surface sm:h-[780px]">
        <main className={`min-h-0 flex-1 overflow-x-hidden overscroll-contain ${tab === 'map' ? 'overflow-y-hidden' : 'overflow-y-auto'}`}>
          {tab === 'home' && (
            <HomeTab
              t={t} locale={locale} profile={profile} openProfile={() => { setTab('profile'); haptic('tap'); }}
              favoriteStoreIds={favoriteStoreIds} category={category} setCategory={setCategory}
              toggleFavorite={toggleFavorite} openBox={openBox}
            />
          )}
          {tab === 'map' && <MapTab locale={locale} openBox={openBox} />}
          {tab === 'favorites' && (
            <FavoritesTab t={t} locale={locale} favoriteStoreIds={favoriteStoreIds} toggleFavorite={toggleFavorite} openBox={openBox} />
          )}
          {tab === 'orders' && <OrdersTab t={t} locale={locale} orders={orders} openBox={openBox} />}
          {tab === 'profile' && (
            <ProfileTab t={t} locale={locale} setLocale={setLocale} profile={profile}
              openHelp={() => setHelpOpen(true)}
              openDocuments={() => setDocumentsOpen(true)}
              resetDemo={resetDemo} onEditPhone={() => setEditingPhone(true)} />
          )}
        </main>
        <BottomNav tab={tab} setTab={setTab} t={t} />
      </div>

      {selectedBox && (
        <BoxDetails box={selectedBox} locale={locale} t={t} isFavorite={favoriteStoreIds.includes(selectedBox.storeId)}
          toggleFavorite={() => toggleFavorite(selectedBox.storeId)} onClose={() => setSelectedBox(null)} onBuy={() => buyBox(selectedBox)} />
      )}
      {checkoutBox && (
        <Checkout box={checkoutBox} quantity={quantity} setQuantity={setQuantity} locale={locale} t={t}
          onClose={() => setCheckoutBox(null)} onPay={pay} />
      )}
      {successOrder && (
        <Success order={successOrder} t={t} onDone={() => { setSuccessOrder(null); setTab('orders'); }} />
      )}
      {editingPhone && (
        <PhoneEditor currentPhone={profile.phone} t={t} onClose={() => setEditingPhone(false)} onSave={(value) => {
          updatePhone(value);
          setEditingPhone(false);
          haptic('success');
        }} />
      )}
      {documentsOpen && <DocumentsModal t={t} onClose={() => setDocumentsOpen(false)} />}
      {helpOpen && <HelpModal t={t} onClose={() => setHelpOpen(false)} />}
      {legal && <LegalModal type={legal} t={t} onClose={() => setLegal(null)} />}
    </PhoneShell>
  );
}

function Splash() {
  return (
    <main className="grid min-h-dvh place-items-center overflow-hidden bg-brand px-6 text-white" aria-label="Algan загружается">
      <div className="flex flex-col items-center">
        <AlganLogo
          light
          className="flex-col gap-3"
          markClassName="h-20 w-20"
          wordmarkClassName="h-9 w-[110px]"
        />
        <span className="algan-loader mt-10" role="status">
          <span className="sr-only">Загрузка</span>
        </span>
      </div>
    </main>
  );
}

function PhoneShell({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-dvh bg-canvas text-ink sm:grid sm:place-items-center sm:px-8 sm:py-6">
      <section className="relative mx-auto min-h-dvh w-full max-w-[460px] overflow-hidden bg-surface sm:min-h-[780px] sm:rounded-shell sm:shadow-shell">
        {children}
      </section>
    </main>
  );
}

type Translator = (key: CopyKey) => string;

interface OnboardingProps {
  t: Translator; locale: Locale; setLocale: (locale: Locale) => void;
  phone: string; setPhone: (value: string) => void;
  terms: boolean; setTerms: (value: boolean) => void;
  privacy: boolean; setPrivacy: (value: boolean) => void;
  openLegal: (type: 'terms' | 'privacy') => void; onContinue: () => void;
}

function Onboarding(props: OnboardingProps) {
  const { t, locale, setLocale, phone, setPhone, terms, setTerms, privacy, setPrivacy, openLegal, onContinue } = props;
  const canContinue = Boolean(normalizeKazakhstanPhone(phone) && terms && privacy);
  return (
    <div className="flex min-h-dvh flex-col sm:min-h-[780px]">
      <div className="relative overflow-hidden bg-brand px-7 pb-9 pt-[max(1.5rem,env(safe-area-inset-top))] text-white">
        <div className="absolute -right-8 -top-6 h-40 w-40 rounded-full bg-warning-ink/20" />
        <div className="absolute -bottom-14 -left-8 h-36 w-36 rounded-full border-[28px] border-highlight/20" />
        <div className="relative flex items-start justify-between">
          <AlganLogo light />
          <LanguagePill locale={locale} setLocale={setLocale} dark />
        </div>
        <div className="relative mt-12">
          <p className="text-sm font-bold text-highlight">{t('slogan')}</p>
          <h1 className="mt-2 max-w-[340px] text-[34px] font-black leading-[1.04] tracking-[-0.05em]">{t('hero')}</h1>
        </div>
      </div>

      <form className="flex flex-1 flex-col px-7 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-7" onSubmit={(event) => { event.preventDefault(); onContinue(); }}>
        <p className="text-sm font-bold text-accent">{t('intro')}</p>
        <h2 className="mt-1 text-2xl font-black tracking-[-0.04em]">{t('askName')}</h2>
        <p className="mt-2 text-sm leading-6 text-ink-secondary">{t('nameHelp')}</p>

        <TextField label={t('phone')} required value={phone} onValueChange={(value) => setPhone(formatKazakhstanPhoneInput(value))} placeholder="+7 700 000 00 00" autoComplete="tel" type="tel" />

        <div className="mt-5 space-y-3 text-[13px] leading-5 text-ink-secondary">
          <Consent checked={terms} setChecked={setTerms} text={t('terms')} onOpen={() => openLegal('terms')} />
          <Consent checked={privacy} setChecked={setPrivacy} text={t('privacy')} onOpen={() => openLegal('privacy')} />
        </div>

        <PrimaryButton type="submit" disabled={!canContinue} className="mt-7">{t('continue')}<ChevronRight size={19} /></PrimaryButton>
      </form>
    </div>
  );
}

function Consent({ checked, setChecked, text, onOpen }: { checked: boolean; setChecked: (value: boolean) => void; text: string; onOpen: () => void }) {
  const words = text.split(' ');
  const linked = words.slice(Math.max(words.length - 2, 1)).join(' ');
  const prefix = text.slice(0, Math.max(0, text.length - linked.length));
  return (
    <label className="flex cursor-pointer gap-3">
      <input type="checkbox" checked={checked} onChange={(event) => setChecked(event.target.checked)} className="peer sr-only" />
      <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-md border-2 border-border-strong bg-panel text-white transition peer-checked:border-brand peer-checked:bg-brand"><Check size={14} strokeWidth={3} /></span>
      <span>{prefix}<button type="button" onClick={(event) => { event.preventDefault(); onOpen(); }} className="font-extrabold text-brand underline decoration-border-strong underline-offset-2">{linked}</button></span>
    </label>
  );
}

function LanguagePill({ locale, setLocale, dark = false }: { locale: Locale; setLocale: (locale: Locale) => void; dark?: boolean }) {
  return (
    <button type="button" onClick={() => setLocale(locale === 'ru' ? 'kk' : 'ru')} className={`flex h-11 items-center gap-1.5 rounded-full px-3 text-xs font-black uppercase ${dark ? 'bg-white/12 text-white' : 'bg-surface-soft text-brand'}`} aria-label="Русский / Қазақша">
      <Languages size={15} /> {locale === 'ru' ? 'Қаз' : 'Рус'}
    </button>
  );
}

function HomeTab({ t, locale, profile, openProfile, favoriteStoreIds, category, setCategory, toggleFavorite, openBox }: {
  t: Translator; locale: Locale; profile: UserProfile; openProfile: () => void; favoriteStoreIds: string[];
  category: 'all' | 'bakery' | 'cafe' | 'market'; setCategory: (value: 'all' | 'bakery' | 'cafe' | 'market') => void;
  toggleFavorite: (id: string) => void; openBox: (box: Box) => void;
}) {
  const filtered = category === 'all' ? boxes : boxes.filter((box) => storeById(box.storeId).type === category);
  return (
    <>
      <header className="bg-brand px-6 pb-8 pt-[max(1.4rem,env(safe-area-inset-top))] text-white">
        <div className="mt-2 flex items-center justify-between gap-4">
          <div className="min-w-0"><p className="text-sm text-white/70">{t('greeting')},</p><h1 className="mt-0.5 truncate text-[30px] font-black tracking-[-0.045em]">{profile.firstName}!</h1></div>
          <button type="button" onClick={openProfile} aria-label={t('profile')} className="shrink-0 rounded-full outline-none ring-white/70 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-brand">
            <ProfileAvatar key={profile.photoUrl ?? 'fallback-avatar'} profile={profile} compact />
          </button>
        </div>
      </header>

      <section className="bg-surface px-5 pt-6">
        <div className="hide-scrollbar -mx-5 flex gap-2 overflow-x-auto px-5">
          {(['all', 'bakery', 'cafe', 'market'] as const).map((item) => (
            <button key={item} type="button" aria-pressed={category === item} onClick={() => setCategory(item)} className={`min-h-11 shrink-0 rounded-full px-4 py-2.5 text-xs font-black transition ${category === item ? 'bg-brand text-white' : 'bg-surface-soft text-ink-secondary'}`}>{t(item)}</button>
          ))}
        </div>

        <h2 className="mt-7 text-xl font-black tracking-[-0.035em]">{t('nearby')}</h2>
        <div className="mt-4 space-y-4 pb-6">
          {filtered.map((box) => <BoxCard key={box.id} box={box} locale={locale} t={t} favorite={favoriteStoreIds.includes(box.storeId)} toggleFavorite={() => toggleFavorite(box.storeId)} onOpen={() => openBox(box)} />)}
        </div>
      </section>
    </>
  );
}

function BoxCard({ box, locale, t, favorite, toggleFavorite, onOpen }: { box: Box; locale: Locale; t: Translator; favorite: boolean; toggleFavorite: () => void; onOpen: () => void }) {
  const store = storeById(box.storeId);
  const discount = Math.round((1 - box.salePrice / box.originalPrice) * 100);
  return (
    <article className="overflow-hidden rounded-card border border-border bg-panel shadow-card">
      <button type="button" onClick={onOpen} className="relative block h-44 w-full overflow-hidden text-left">
        <img src={box.image} alt="" className="h-full w-full object-cover transition duration-500 hover:scale-105" />
        <span className="absolute left-3 top-3 rounded-full bg-accent px-3 py-1.5 text-[11px] font-black text-white">−{discount}%</span>
        {box.type === 'SURPRISE' && <SurpriseBadge className="absolute right-3 top-3" />}
        <span className="absolute bottom-3 left-3 grid h-12 w-12 place-items-center overflow-hidden rounded-full border-3 border-panel bg-panel shadow-card">
          <img src={store.logo} alt={`${store.name} logo`} className="h-9 w-9 object-contain" />
        </span>
      </button>
      <div className="p-4">
        <div className="flex items-start gap-3">
          <button type="button" onClick={onOpen} className="min-w-0 flex-1 text-left">
            <p className="text-xs font-bold text-ink-muted">{store.name}</p>
            <h3 className="mt-1 truncate text-lg font-black tracking-[-0.03em]">{box.name}</h3>
          </button>
          <IconButton onClick={toggleFavorite} label={t('favorites')} aria-pressed={favorite} tone={favorite ? 'accent' : 'muted'}><Heart size={19} fill={favorite ? 'currentColor' : 'none'} /></IconButton>
        </div>
        <div className="mt-4 flex items-end justify-between gap-3">
          <div><p className="text-xs text-ink-muted line-through">{formatPrice(box.originalPrice, locale)}</p><p className="text-lg font-black text-brand">{formatPrice(box.salePrice, locale)}</p></div>
          <div className="text-right"><p className={`text-[11px] font-bold ${box.quantity > 0 ? 'text-accent' : 'text-danger'}`}>{box.quantity > 0 ? `${box.quantity} ${t('left')}` : formatBoxesLeft(0, locale)}</p><p className="mt-1 text-xs font-semibold text-ink-secondary">{box.pickupFrom}–{box.pickupTo}</p></div>
        </div>
      </div>
    </article>
  );
}

function SurpriseBadge({ className = '' }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-1 rounded-full bg-brand-deep/92 px-2.5 py-1.5 text-[10px] font-black tracking-[0.08em] text-white shadow-card backdrop-blur-sm ${className}`}>
      <Sparkles size={12} aria-hidden="true" />SURPRISE
    </span>
  );
}

function MapTab({ locale, openBox }: { locale: Locale; openBox: (box: Box) => void }) {
  const [storeId, setStoreId] = useState<string | null>(null);
  const selectedBoxes = storeId ? boxes.filter((box) => box.storeId === storeId) : [];
  const selectStore = useCallback((id: string) => setStoreId(id), []);
  return (
    <div className="relative h-full min-h-0">
      <LocationMap lat={SHYMKENT.lat} lng={SHYMKENT.lng} stores={stores} onSelectStore={selectStore} className="absolute inset-0" />
      {selectedBoxes.length > 0 && (
        <div data-testid="map-box-options" className="hide-scrollbar absolute bottom-5 left-0 right-0 z-[600] flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-1">
          {selectedBoxes.map((box) => (
            <button key={box.id} type="button" onClick={() => openBox(box)} className="flex w-[calc(100%_-_2rem)] shrink-0 snap-center gap-3 rounded-card bg-panel p-3 text-left shadow-floating">
              <span className="relative h-20 w-20 shrink-0 overflow-hidden rounded-2xl">
                <img src={box.image} alt="" className="h-full w-full object-cover" />
              </span>
              <span className="min-w-0 flex-1 py-1">
                <span className="flex items-start justify-between gap-2">
                  <span className="block truncate text-xs font-bold text-ink-muted">{storeById(box.storeId).name}</span>
                  {box.type === 'SURPRISE' && <SurpriseBadge className="shrink-0 px-2 py-1 text-[8px]" />}
                </span>
                <span className="mt-1 block truncate text-base font-black">{box.name}</span>
                <span className="mt-2 block text-sm font-black text-brand">{formatPrice(box.salePrice, locale)}</span>
              </span>
              <ChevronRight className="mt-7 shrink-0 text-ink-muted" size={19} />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function FavoritesTab({ t, locale, favoriteStoreIds, toggleFavorite, openBox }: { t: Translator; locale: Locale; favoriteStoreIds: string[]; toggleFavorite: (id: string) => void; openBox: (box: Box) => void }) {
  const favoriteBoxes = boxes.filter((box) => favoriteStoreIds.includes(box.storeId));
  return (
    <section className="px-5 pb-7 pt-[max(1.5rem,env(safe-area-inset-top))]">
      <h1 className="mt-2 text-[30px] font-black tracking-[-0.045em]">{t('favorites')}</h1>
      {favoriteBoxes.length === 0 ? (
        <EmptyState icon={<Heart size={34} />} title={t('noFavorites')} description={t('noFavoritesText')} tone="accent" />
      ) : (
        <div className="mt-6 space-y-4">
          {favoriteBoxes.map((box) => <BoxCard key={box.id} box={box} locale={locale} t={t} favorite toggleFavorite={() => toggleFavorite(box.storeId)} onOpen={() => openBox(box)} />)}
        </div>
      )}
    </section>
  );
}

function OrdersTab({ t, locale, orders, openBox }: {
  t: Translator; locale: Locale; orders: Order[]; openBox: (box: Box) => void;
}) {
  const [view, setView] = useState<'active' | 'past'>('active');
  const visibleOrders = orders.filter((order) => view === 'active' ? order.status === 'paid' : order.status === 'collected');
  const emptyTitle = view === 'active' ? t('noActiveOrders') : t('noPastOrders');
  const emptyText = view === 'active' ? t('noActiveOrdersText') : t('noPastOrdersText');

  return (
    <section className="px-5 pb-7 pt-[max(1.5rem,env(safe-area-inset-top))]">
      <h1 className="mt-2 text-[30px] font-black tracking-[-0.045em]">{t('orders')}</h1>
      <div className="mt-5">
        <SegmentedControl
          value={view}
          label={t('orders')}
          items={[
            { value: 'active', label: t('activeOrders') },
            { value: 'past', label: t('pastOrders') },
          ]}
          onChange={(item) => { setView(item); haptic('tap'); }}
        />
      </div>

      {visibleOrders.length === 0 ? (
        <EmptyState
          icon={view === 'active' ? <ShoppingBag size={34} /> : <PackageCheck size={34} />}
          title={emptyTitle}
          description={emptyText}
        />
      ) : (
        <div className="mt-5 space-y-3">
          {visibleOrders.map((order) => {
            const box = boxes.find((item) => item.id === order.boxId);
            if (!box) return null;
            const store = storeById(box.storeId);
            const orderDate = new Intl.DateTimeFormat(locale === 'kk' ? 'kk-KZ' : 'ru-KZ', {
              day: 'numeric', month: 'long', year: 'numeric',
            }).format(new Date(order.createdAt));
            return (
              <button key={order.id} type="button" onClick={() => openBox(box)} className="w-full rounded-card border border-border bg-panel p-3 text-left shadow-card">
                <span className="flex gap-3">
                  <img src={box.image} alt="" className="h-20 w-20 shrink-0 rounded-2xl object-cover" />
                  <span className="min-w-0 flex-1 py-0.5">
                    <span className="block truncate text-xs font-bold text-ink-muted">{store.name}</span>
                    <span className="mt-1 block truncate text-base font-black">{box.name}</span>
                    <span className="mt-1 block truncate text-[11px] font-semibold text-ink-subtle">{t('orderId')}: {formatOrderId(order.id)}</span>
                    <span className="mt-2 flex items-center justify-between gap-3 text-xs text-ink-secondary">
                      <span>{t('quantity')}: {order.quantity}</span>
                      <b className="text-sm text-brand">{formatPrice(order.total, locale)}</b>
                    </span>
                  </span>
                </span>
                <span className="mt-3 flex items-center justify-between gap-3 border-t border-border pt-3 text-xs">
                  {view === 'active' ? (
                    <><span className="font-bold text-ink-secondary">{t('pickup')}: {box.pickupFrom}–{box.pickupTo}</span><span className="rounded-full bg-brand-soft px-3 py-1.5 font-black text-brand">{t('pickupCode')}: {order.pickupCode}</span></>
                  ) : (
                    <><span className="font-bold text-ink-muted">{orderDate}</span><ChevronRight size={17} className="text-ink-subtle" /></>
                  )}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </section>
  );
}

function ProfileTab({ t, locale, setLocale, profile, openHelp, openDocuments, resetDemo, onEditPhone }: {
  t: Translator; locale: Locale; setLocale: (locale: Locale) => void; profile: UserProfile;
  openHelp: () => void; openDocuments: () => void; resetDemo: () => void; onEditPhone: () => void;
}) {
  return (
    <section className="pb-8">
      <header className="bg-brand px-6 pb-8 pt-[max(1.5rem,env(safe-area-inset-top))] text-white">
        <div className="mt-2 flex items-center gap-4">
          <ProfileAvatar key={profile.photoUrl ?? 'fallback-avatar'} profile={profile} />
          <div><h1 className="text-2xl font-black">{profile.firstName} {profile.lastName}</h1><p className="mt-1 text-sm text-white/65">{profile.phone ? formatKazakhstanPhoneInput(profile.phone) : 'Telegram Mini App'}</p></div>
        </div>
      </header>

      <div className="bg-surface px-5 pt-6">
        <div className="space-y-2">
          <ProfileRow icon={<Phone size={18} />} label={t('phoneNumber')} value={profile.phone ? formatKazakhstanPhoneInput(profile.phone) : undefined} onClick={onEditPhone} />
          <ProfileRow icon={<Languages size={18} />} label={t('language')} value={locale === 'ru' ? 'Русский' : 'Қазақша'} onClick={() => setLocale(locale === 'ru' ? 'kk' : 'ru')} />
          <ProfileRow icon={<CircleHelp size={18} />} label={t('support')} onClick={openHelp} />
          <ProfileRow icon={<PackageCheck size={18} />} label={t('legal')} onClick={openDocuments} />
        </div>
        <DangerButton onClick={() => { if (window.confirm(t('signOutDemo'))) resetDemo(); }} className="mt-6">{t('signOutDemo')}</DangerButton>
      </div>
    </section>
  );
}

function ProfileAvatar({ profile, compact = false }: { profile: UserProfile; compact?: boolean }) {
  const [imageFailed, setImageFailed] = useState(false);
  const [reloadAttempt, setReloadAttempt] = useState(0);
  const initial = profile.firstName.trim().charAt(0).toUpperCase() || 'A';
  const photoSource = profile.photoUrl
    ? reloadAttempt === 0 ? profile.photoUrl : avatarRetryUrl(profile.photoUrl, reloadAttempt)
    : undefined;

  const retryImage = () => {
    if (reloadAttempt < 2) setReloadAttempt((attempt) => attempt + 1);
    else setImageFailed(true);
  };

  return (
    <div className={`grid shrink-0 place-items-center overflow-hidden rounded-full bg-highlight font-black text-ink ${compact ? 'h-12 w-12 text-lg' : 'h-16 w-16 text-2xl'}`}>
      {photoSource && !imageFailed
        ? <img src={photoSource} alt="" referrerPolicy="no-referrer" className="h-full w-full object-cover" onError={retryImage} />
        : initial}
    </div>
  );
}

function PhoneEditor({ currentPhone, t, onClose, onSave }: {
  currentPhone?: string; t: Translator; onClose: () => void; onSave: (phone: string) => void;
}) {
  const [value, setValue] = useState(formatKazakhstanPhoneInput(currentPhone ?? '+7'));
  const normalizedPhone = normalizeKazakhstanPhone(value);

  return (
    <Overlay onClose={onClose}>
      <form className="modal-body" onSubmit={(event) => {
        event.preventDefault();
        if (normalizedPhone) onSave(normalizedPhone);
      }}>
        <ModalHeader title={t('changePhone')} onClose={onClose} closeLabel={t('close')} />
        <TextField label={t('phone')} required value={value} onValueChange={(phone) => setValue(formatKazakhstanPhoneInput(phone))}
          placeholder="+7 700 000 00 00" autoComplete="tel" type="tel" />
        <PrimaryButton type="submit" disabled={!normalizedPhone} className="mt-6">{t('savePhone')}<Check size={19} /></PrimaryButton>
      </form>
    </Overlay>
  );
}

function ProfileRow({ icon, label, value, onClick }: { icon: React.ReactNode; label: string; value?: string; onClick?: () => void }) {
  return (
    <ListRow
      icon={icon}
      title={label}
      subtitle={value}
      onClick={onClick}
      disabled={!onClick}
      trailing={onClick ? <ChevronRight size={17} className="text-ink-subtle" /> : undefined}
    />
  );
}

function BottomNav({ tab, setTab, t }: { tab: Tab; setTab: (tab: Tab) => void; t: Translator }) {
  const items: { id: Tab; icon: React.ReactNode; label: CopyKey }[] = [
    { id: 'home', icon: <Home size={21} />, label: 'home' },
    { id: 'map', icon: <MapIcon size={21} />, label: 'map' },
    { id: 'favorites', icon: <Heart size={21} />, label: 'favorites' },
    { id: 'orders', icon: <ShoppingBag size={21} />, label: 'orders' },
  ];
  return (
    <nav className="z-[800] shrink-0 border-t border-border bg-surface/95 px-3 pb-[max(.6rem,env(safe-area-inset-bottom))] pt-2 backdrop-blur-xl">
      <div className="grid grid-cols-4">
        {items.map((item) => (
          <button key={item.id} type="button" aria-current={tab === item.id ? 'page' : undefined} onClick={() => { setTab(item.id); haptic('tap'); }} className={`flex min-h-14 flex-col items-center justify-center gap-1 rounded-xl text-[10px] font-black transition ${tab === item.id ? 'text-brand' : 'text-ink-subtle'}`}>
            <span className={`grid h-8 w-12 place-items-center rounded-full ${tab === item.id ? 'bg-brand-soft' : ''}`}>{item.icon}</span>{t(item.label)}
          </button>
        ))}
      </div>
    </nav>
  );
}

function Overlay({ children, onClose, full = false }: { children: React.ReactNode; onClose: () => void; full?: boolean }) {
  return (
    <div className="absolute inset-0 z-[1000] flex items-end bg-brand-deep/40 backdrop-blur-[2px]" role="dialog" aria-modal="true">
      <button type="button" onClick={onClose} className="absolute inset-0" aria-label="Close" />
      <section className={`relative z-10 w-full overflow-hidden bg-surface ${full ? 'min-h-full' : 'max-h-[92%] rounded-t-sheet'}`}>{children}</section>
    </div>
  );
}

function BoxDetails({ box, locale, t, isFavorite, toggleFavorite, onClose, onBuy }: {
  box: Box; locale: Locale; t: Translator; isFavorite: boolean; toggleFavorite: () => void; onClose: () => void; onBuy: () => void;
}) {
  const store = storeById(box.storeId);
  const discount = Math.round((1 - box.salePrice / box.originalPrice) * 100);
  const [routePickerOpen, setRoutePickerOpen] = useState(false);
  return (
    <section className="absolute inset-0 z-[1000] flex h-full min-h-0 flex-col overflow-hidden bg-surface" role="dialog" aria-modal="true" aria-label={box.name}>
      <header data-testid="box-details-header" className="shrink-0 bg-brand px-4 pb-3 pt-[max(.75rem,env(safe-area-inset-top))] text-white">
        <div className="flex min-h-11 items-center gap-3">
          <IconButton onClick={onClose} label={t('back')} tone="dark"><ChevronRight className="rotate-180" size={20} /></IconButton>
          <p className="min-w-0 flex-1 truncate text-center text-sm font-black">{store.name}</p>
          <IconButton onClick={toggleFavorite} label={t('favorites')} aria-pressed={isFavorite} tone={isFavorite ? 'accent' : 'dark'}><Heart size={20} fill={isFavorite ? 'currentColor' : 'none'} /></IconButton>
        </div>
      </header>

      <div data-testid="box-details-scroll" className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
        <div data-testid="box-details-cover" className="relative h-[260px] bg-canvas">
          <img src={box.image} alt="" className="h-full w-full object-cover object-center" />
          <span className="absolute -bottom-8 left-5 grid h-17 w-17 place-items-center overflow-hidden rounded-full border-4 border-surface bg-panel shadow-card">
            <img src={store.logo} alt={`${store.name} logo`} className="h-13 w-13 object-contain" />
          </span>
        </div>
        <div className="px-6 pb-6 pt-11">
          <p className="text-sm font-bold text-ink-secondary">{store.name}</p>
          <h1 className="mt-2 text-[29px] font-black tracking-[-0.045em]">{box.name}</h1>
          {box.type === 'SURPRISE' && <SurpriseBadge className="mt-3" />}
          <span data-testid="box-stock" className={`mt-3 inline-flex items-center gap-2 rounded-full px-3 py-2 text-xs font-black ${box.quantity > 0 ? 'bg-accent-soft text-accent-strong' : 'bg-danger-soft text-danger'}`}>
            <Package size={15} />{formatBoxesLeft(box.quantity, locale)}
          </span>
          <div className="mt-4 grid grid-cols-[1.08fr_.92fr] gap-3">
            <div data-testid="box-price-card" className="rounded-control bg-brand-pale p-4">
              <p className="text-[11px] font-black uppercase tracking-[0.08em] text-ink-secondary">{t('boxPrice')}</p>
              <p className="mt-2 text-[25px] font-black tracking-[-0.04em] text-brand">{formatPrice(box.salePrice, locale)}</p>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <span className="text-xs font-semibold text-ink-muted line-through">{formatPrice(box.originalPrice, locale)}</span>
                <span className="rounded-full bg-accent px-2.5 py-1 text-[11px] font-black text-white">−{discount}%</span>
              </div>
            </div>
            <div data-testid="box-pickup-card" className="flex flex-col rounded-control border border-border bg-panel p-4">
              <IconBadge tone="soft"><Clock3 size={18} /></IconBadge>
              <p className="mt-3 text-[11px] font-black uppercase tracking-[0.08em] text-ink-secondary">{t('pickup')}</p>
              <p className="mt-1 whitespace-nowrap text-sm font-black text-ink">{box.pickupFrom}–{box.pickupTo}</p>
            </div>
          </div>
          <h2 className="mt-6 text-lg font-black">{t('composition')}</h2>
          {box.type === 'SURPRISE' ? (
            <p className="mt-2 text-sm leading-6 text-ink-secondary">{t('surprise')}</p>
          ) : (
            <ul className="mt-3 space-y-2" data-testid="box-contents">
              {box.contents?.map((item) => (
                <li key={item.contentName} className="flex items-center justify-between gap-4 rounded-control bg-surface-soft px-4 py-3 text-sm">
                  <span className="font-bold text-ink">{item.contentName}</span>
                  <span className="shrink-0 font-black text-brand">× {item.quantity}</span>
                </li>
              ))}
            </ul>
          )}
          <div className="mt-4 rounded-control border border-allergen-border bg-allergen-surface p-4">
            <div className="flex items-start gap-3">
              <IconBadge tone="accent"><AlertTriangle size={19} /></IconBadge>
              <div className="min-w-0">
                <h3 className="text-sm font-black text-allergen-ink">{box.allergens ? t('containsAllergens') : t('allergens')}</h3>
                <p className="mt-1.5 text-sm leading-5 text-allergen-body">{box.allergens ?? t('allergensUnknown')}</p>
              </div>
            </div>
          </div>
          <SurfaceCard className="mt-5 p-4">
            <div className="flex items-start gap-3">
              <IconBadge><MapPin size={19} /></IconBadge>
              <div className="min-w-0"><p className="text-xs font-bold text-ink-muted">{t('addressLabel')}</p><p className="mt-1 text-sm font-black leading-5">{store.address}</p></div>
            </div>
            <SecondaryButton onClick={() => { setRoutePickerOpen(true); haptic('tap'); }} className="mt-4">
              <Route size={18} />{t('buildRoute')}
            </SecondaryButton>
          </SurfaceCard>
        </div>
      </div>
      <footer className="shrink-0 border-t border-border bg-surface/96 px-5 pb-[max(.75rem,env(safe-area-inset-bottom))] pt-3 backdrop-blur-xl">
        <PrimaryButton onClick={onBuy} disabled={box.quantity < 1}>{t('buy')}<ShoppingBag size={19} /></PrimaryButton>
      </footer>
      {routePickerOpen && <RoutePicker lat={store.lat} lng={store.lng} t={t} onClose={() => setRoutePickerOpen(false)} />}
    </section>
  );
}

const routeProviderLogo: Record<RouteProvider, string> = {
  '2gis': '/images/map-providers/2gis.jpg',
  yandex: '/images/map-providers/yandex-maps.jpg',
  google: '/images/map-providers/google-maps.jpg',
  apple: '/images/map-providers/apple-maps.jpg',
};

function RoutePicker({ lat, lng, t, onClose }: {
  lat: number; lng: number; t: Translator; onClose: () => void;
}) {
  const options = getRouteOptions(lat, lng);
  return (
    <div className="absolute inset-0 z-[1200] flex items-end bg-brand-deep/45 backdrop-blur-[2px]" role="dialog" aria-modal="true" aria-label={t('chooseMap')}>
      <button type="button" onClick={onClose} className="absolute inset-0" aria-label={t('close')} />
      <section className="relative z-10 w-full rounded-t-sheet bg-surface px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-4 shadow-sheet">
        <SheetHandle />
        <div className="mt-4"><ModalHeader title={t('chooseMap')} onClose={onClose} closeLabel={t('close')} /></div>
        <div className="mt-4 space-y-2">
          {options.map((option) => (
            <button key={option.id} type="button" onClick={() => { openExternalLink(option.url); haptic('tap'); }} className="flex min-h-14 w-full items-center gap-3 rounded-control border border-border bg-panel px-3.5 text-left">
              <img src={routeProviderLogo[option.id]} alt={`${option.label} logo`} className="h-10 w-10 shrink-0 rounded-xl object-cover" />
              <span className="flex-1 text-sm font-black">{option.label}</span>
              <ChevronRight size={17} className="text-ink-subtle" />
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}

function Checkout({ box, quantity, setQuantity, locale, t, onClose, onPay }: {
  box: Box; quantity: number; setQuantity: (value: number) => void; locale: Locale; t: Translator; onClose: () => void; onPay: () => void;
}) {
  return (
    <Overlay onClose={onClose}>
      <div className="modal-body">
        <SheetHandle />
        <div className="mt-5"><ModalHeader title={t('demoPayment')} onClose={onClose} closeLabel={t('close')} /></div>
        <div className="mt-5 flex gap-4 rounded-control bg-surface-soft p-3">
          <img src={box.image} alt="" className="h-20 w-20 rounded-xl object-cover" />
          <div className="min-w-0 flex-1 py-1"><p className="truncate text-base font-black">{box.name}</p><p className="mt-1 text-xs text-ink-muted">{storeById(box.storeId).name}</p><p className="mt-2 text-sm font-black text-brand">{formatPrice(box.salePrice, locale)}</p></div>
        </div>
        <div className="mt-5 flex items-center justify-between">
          <span className="text-sm font-black">{t('quantity')}</span>
          <div className="flex items-center gap-3">
            <IconButton onClick={() => setQuantity(Math.max(1, quantity - 1))} label={`${t('quantity')} −`} disabled={quantity <= 1}><Minus size={17} /></IconButton>
            <span className="w-5 text-center text-lg font-black">{quantity}</span>
            <IconButton onClick={() => setQuantity(Math.min(box.quantity, quantity + 1))} label={`${t('quantity')} +`} tone="brand" disabled={quantity >= box.quantity}><Plus size={17} /></IconButton>
          </div>
        </div>
        <div className="my-5 h-px bg-border" />
        <div className="flex items-end justify-between"><span className="text-sm font-bold text-ink-secondary">{t('total')}</span><span className="text-2xl font-black">{formatPrice(box.salePrice * quantity, locale)}</span></div>
        <p className="mt-4 flex gap-2 rounded-control bg-warning-surface p-3 text-xs leading-5 text-warning-ink"><Info size={17} className="mt-0.5 shrink-0" />{t('paymentNote')}</p>
        <PrimaryButton onClick={onPay} className="mt-5">{t('pay')}<ChevronRight size={19} /></PrimaryButton>
      </div>
    </Overlay>
  );
}

function Success({ order, t, onDone }: { order: Order; t: Translator; onDone: () => void }) {
  return (
    <Overlay onClose={onDone} full>
      <div className="flex min-h-dvh flex-col items-center justify-center px-7 pb-[max(1.5rem,env(safe-area-inset-bottom))] text-center sm:min-h-[780px]">
        <div className="relative grid h-28 w-28 place-items-center rounded-full bg-highlight text-brand">
          <Check size={52} strokeWidth={3} />
          <Sparkles className="absolute -right-3 -top-2 text-accent" size={28} />
        </div>
        <h1 className="mt-8 text-[34px] font-black tracking-[-0.05em]">{t('success')}</h1>
        <p className="mt-3 max-w-[300px] text-sm leading-6 text-ink-secondary">{t('successText')}</p>
        <div className="mt-8 w-full rounded-card bg-brand p-6 text-white">
          <p className="text-xs font-bold text-white/60">{t('pickupCode')}</p>
          <p className="mt-2 text-5xl font-black tracking-[0.16em]">{order.pickupCode}</p>
        </div>
        <PrimaryButton onClick={onDone} className="mt-8">{t('toOrders')}<ChevronRight size={19} /></PrimaryButton>
      </div>
    </Overlay>
  );
}

function DocumentsModal({ t, onClose }: { t: Translator; onClose: () => void }) {
  const [selectedDocument, setSelectedDocument] = useState<LegalDocument | null>(null);
  const documents: { type: LegalDocument; icon: React.ReactNode }[] = [
    { type: 'terms', icon: <Info size={18} /> },
    { type: 'privacy', icon: <PackageCheck size={18} /> },
    { type: 'orderRules', icon: <ShoppingBag size={18} /> },
    { type: 'publicOffer', icon: <Check size={18} /> },
  ];

  return (
    <Overlay onClose={onClose}>
      <div className="modal-body">
        <ModalHeader
          title={selectedDocument ? t(LEGAL_TITLE_KEYS[selectedDocument]) : t('legal')}
          onBack={selectedDocument ? () => setSelectedDocument(null) : undefined}
          backLabel={t('back')}
          onClose={onClose}
          closeLabel={t('close')}
        />
        {selectedDocument ? (
          <>
            <LegalDocumentNotice t={t} />
            <PrimaryButton onClick={() => setSelectedDocument(null)} className="mt-5">{t('back')}</PrimaryButton>
          </>
        ) : (
          <div className="mt-5 space-y-2">
            {documents.map((document) => (
              <ProfileRow key={document.type} icon={document.icon} label={t(LEGAL_TITLE_KEYS[document.type])} onClick={() => setSelectedDocument(document.type)} />
            ))}
          </div>
        )}
      </div>
    </Overlay>
  );
}

function HelpModal({ t, onClose }: { t: Translator; onClose: () => void }) {
  const [view, setView] = useState<'menu' | 'faq' | 'contacts'>('menu');
  const [openQuestion, setOpenQuestion] = useState<number | null>(null);
  const faqItems: { question: CopyKey; answer: CopyKey }[] = [
    { question: 'faqBuyQuestion', answer: 'faqBuyAnswer' },
    { question: 'faqPickupQuestion', answer: 'faqPickupAnswer' },
    { question: 'faqContentsQuestion', answer: 'faqContentsAnswer' },
    { question: 'faqOrdersQuestion', answer: 'faqOrdersAnswer' },
    { question: 'faqProblemQuestion', answer: 'faqProblemAnswer' },
  ];
  const title = view === 'faq' ? t('faq') : view === 'contacts' ? t('contacts') : t('support');

  return (
    <Overlay onClose={onClose}>
      <div className="max-h-[82dvh] overflow-y-auto px-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-5">
        <div className="sticky top-0 z-10 bg-surface pb-3">
          <ModalHeader
            title={title}
            onBack={view !== 'menu' ? () => setView('menu') : undefined}
            backLabel={t('back')}
            onClose={onClose}
            closeLabel={t('close')}
          />
        </div>

        {view === 'menu' && (
          <div className="mt-2 space-y-2">
            <ProfileRow icon={<CircleHelp size={18} />} label={t('faq')} onClick={() => setView('faq')} />
            <ProfileRow icon={<TelegramIcon />} label={t('contactSupport')} onClick={() => openTelegramLink(SUPPORT_TELEGRAM_URL)} />
            <ProfileRow icon={<Building2 size={18} />} label={t('contacts')} onClick={() => setView('contacts')} />
          </div>
        )}

        {view === 'faq' && (
          <div className="mt-2 space-y-2">
            {faqItems.map((item, index) => {
              const expanded = openQuestion === index;
              return (
                <div key={item.question} className="overflow-hidden rounded-control bg-surface-soft">
                  <button type="button" aria-expanded={expanded} onClick={() => setOpenQuestion(expanded ? null : index)} className="flex w-full items-center gap-3 p-4 text-left">
                    <span className="min-w-0 flex-1 text-sm font-black leading-5">{t(item.question)}</span>
                    <ChevronDown size={18} className={`shrink-0 text-ink-subtle transition ${expanded ? 'rotate-180' : ''}`} />
                  </button>
                  {expanded && <p className="px-4 pb-4 text-sm leading-6 text-ink-secondary">{t(item.answer)}</p>}
                </div>
              );
            })}
          </div>
        )}

        {view === 'contacts' && (
          <div className="mt-2 rounded-card bg-surface-soft p-5 text-sm">
            <h3 className="text-lg font-black">{t('companyName')}</h3>
            <p className="mt-1 font-bold text-ink-secondary">{t('companyId')}</p>
            <div className="mt-5 space-y-4">
              <div><p className="text-xs font-black text-ink-muted">{t('addressLabel')}</p><p className="mt-1 leading-6">{t('companyAddress')}</p></div>
              <a href="mailto:algansupport@gmail.com" className="flex items-center gap-3 rounded-control bg-panel p-3 text-brand"><Mail size={18} className="shrink-0" /><span><span className="block text-xs text-ink-muted">{t('emailLabel')}</span><span className="mt-0.5 block font-bold">algansupport@gmail.com</span></span></a>
              <a href="tel:+77059768000" className="flex items-center gap-3 rounded-control bg-panel p-3 text-brand"><Phone size={18} className="shrink-0" /><span><span className="block text-xs text-ink-muted">{t('contactPhoneLabel')}</span><span className="mt-0.5 block font-bold">+7 705 976 80 00</span></span></a>
            </div>
          </div>
        )}
      </div>
    </Overlay>
  );
}

function TelegramIcon() {
  return (
    <svg viewBox="0 0 24 24" width="19" height="19" aria-hidden="true" fill="currentColor">
      <path d="M21.7 3.4a1.2 1.2 0 0 0-1.25-.17L2.9 10.18c-1.2.48-1.18 1.17-.22 1.46l4.5 1.4 1.73 5.24c.22.62.11.87.76.87.5 0 .72-.23 1-.5l2.16-2.1 4.5 3.32c.83.46 1.43.22 1.64-.77l3-14.14c.31-1.23-.47-1.8-.27-1.56ZM8.36 12.72l9.8-6.18c.49-.3.94-.14.57.2l-8.1 7.3-.32 3.4-1.95-4.72Z" />
    </svg>
  );
}

function LegalDocumentNotice({ t }: { t: Translator }) {
  return <div className="mt-5 rounded-control bg-warning-surface p-4 text-sm leading-6 text-warning-ink"><Info size={20} className="mb-3" />{t('placeholderLegal')}</div>;
}
function LegalModal({ type, t, onClose }: { type: LegalDocument; t: Translator; onClose: () => void }) {
  return (
    <Overlay onClose={onClose}>
      <div className="modal-body">
        <ModalHeader title={t(LEGAL_TITLE_KEYS[type])} onClose={onClose} closeLabel={t('close')} />
        <LegalDocumentNotice t={t} />
        <PrimaryButton onClick={onClose} className="mt-5">{t('back')}</PrimaryButton>
      </div>
    </Overlay>
  );
}
