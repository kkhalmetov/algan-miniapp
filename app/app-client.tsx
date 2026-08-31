'use client';
/* eslint-disable @next/next/no-img-element */

import {
  AlertTriangle, Building2, Check, ChevronRight, CircleDollarSign, CircleHelp, Clock3, FileCheck2, Heart, Home, Image as ImageIcon, Info, Languages, Mail, Map as MapIcon,
  MapPin, Package, PackageCheck, Phone, QrCode, Route, Settings2, ShoppingBag, Sparkles, X,
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { AlganLogo } from '@/components/algan-logo';
import LocationMap from '@/components/location-map';
import {
  AccordionItem, BottomNavigation, BottomNavigationItem, BrandHeader, CardActionButton, CardPressable, ConfirmationDialog, DangerButton, DialogLayer,
  ContentTitle, DetailRow, DisclosureIndicator, EmptyState, FullScreenFeedback, IconButton, InsetSurface, LinkRow, ListRow,
  MediaBadge, ModalBody, ModalHeader, NoticeCard, PageSection, PageTitle, PillButton, PrimaryButton, QuantityControl, QuantityStepper, ScreenBody,
  SecondaryButton, SectionTitle, SegmentedControl, SheetHandle, StatusBadge, StickyActionFooter, SurfaceCard, TertiaryButton, TextField,
  TextLinkButton, TopAppBar,
} from '@/components/ui-kit';
import { authenticateTelegram } from '@/lib/api';
import { fetchKztToRubRate, formatCurrency } from '@/lib/currency';
import {
  createLegalAcceptance, getLegalDocument, hasCurrentLegalAcceptance, isPublishedLegalDocument,
  legalDocumentMeta, LEGAL_DOCUMENT_VERSION, LEGAL_EFFECTIVE_DATE,
} from '@/lib/legal-documents';
import { getRouteOptions, type RouteProvider } from '@/lib/maps';
import { boxes, demoPastOrder, storeById, stores } from '@/lib/mock-data';
import { createOrderId, createOrderQrPayload, createPickupCode, formatOrderId, formatPickupCode } from '@/lib/order-id';
import { processPayment } from '@/lib/payment';
import { formatKazakhstanPhoneInput, normalizeKazakhstanPhone } from '@/lib/phone';
import { formatBoxesLeft } from '@/lib/stock';
import { useAppStore } from '@/lib/store';
import { getCopy, type CopyKey } from '@/lib/translations';
import { haptic, openExternalLink, openTelegramLink, prepareTelegram, telegramProfile } from '@/lib/telegram';
import type { Box, CartItem, Currency, Locale, Order, Store, Tab, UserProfile } from '@/lib/types';

const SHYMKENT = { lat: 42.3155, lng: 69.5869 };
export const MINIMUM_SPLASH_MS = 900;
const TELEGRAM_SYNC_DELAYS_MS = [0, 250, 750, 1500, 3000] as const;
const SUPPORT_TELEGRAM_URL = 'https://t.me/kkhalmetov';
type LegalDocument = 'terms' | 'personalDataConsent' | 'privacy' | 'orderRules' | 'publicOffer';
type LegalInformationView = LegalDocument | 'contacts';
type LegalSubject = { fullName: string; telegramId?: number; phone?: string };
type PendingCartReplacement =
  | { kind: 'openStore'; storeId: string }
  | { kind: 'changeQuantity'; box: Box; quantity: number };
const LEGAL_TITLE_KEYS: Record<LegalDocument, CopyKey> = {
  terms: 'termsTitle', personalDataConsent: 'personalDataConsentTitle', privacy: 'privacyTitle',
  orderRules: 'orderRulesTitle', publicOffer: 'publicOfferTitle',
};

export const avatarRetryUrl = (url: string, attempt: number) =>
  `${url}${url.includes('?') ? '&' : '?'}algan_avatar_retry=${attempt}`;

const PriceContext = createContext<{ currency: Currency; kztToRubRate: number | null }>({ currency: 'KZT', kztToRubRate: null });

const usePriceFormatter = (locale: Locale) => {
  const { currency, kztToRubRate } = useContext(PriceContext);
  return useCallback((value: number) => formatCurrency(value, locale, currency, kztToRubRate), [currency, kztToRubRate, locale]);
};

const availableQuantity = (box: Box, purchasedBoxQuantities: Record<string, number>) =>
  Math.max(0, box.quantity - (purchasedBoxQuantities[box.id] ?? 0));

export default function AlganApp() {
  const {
    hydrated, onboardingDone, profile, legalAcceptance, locale, currency, tab, favoriteStoreIds, orders, cartStoreId, cartItems, purchasedBoxQuantities,
    completeOnboarding, acceptLegalDocuments, syncTelegramProfile, updatePhone, setLocale, setCurrency, setTab, toggleFavorite,
    setCartItemQuantity, clearCart, completePurchase, resetDemo,
  } = useAppStore();
  const t = useCallback((key: CopyKey) => getCopy(locale)(key), [locale]);
  const liveTelegramProfile = telegramProfile();
  const [phone, setPhone] = useState('+7');
  const [legal, setLegal] = useState<LegalDocument | null>(null);
  const [documentsOpen, setDocumentsOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [selectedStoreId, setSelectedStoreId] = useState<string | null>(null);
  const [selectedBox, setSelectedBox] = useState<Box | null>(null);
  const [cartOpen, setCartOpen] = useState(false);
  const [pendingCartReplacement, setPendingCartReplacement] = useState<PendingCartReplacement | null>(null);
  const [successOrder, setSuccessOrder] = useState<Order | null>(null);
  const [paymentFailed, setPaymentFailed] = useState(false);
  const [paymentPending, setPaymentPending] = useState(false);
  const paymentPendingRef = useRef(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [editingPhone, setEditingPhone] = useState(false);
  const [kztToRubRate, setKztToRubRate] = useState<number | null>(null);
  const [currencyRateError, setCurrencyRateError] = useState(false);
  const [minimumSplashElapsed, setMinimumSplashElapsed] = useState(false);
  const legalSubject: LegalSubject = {
    fullName: [
      liveTelegramProfile.firstName || profile.firstName,
      liveTelegramProfile.lastName || profile.lastName,
    ].filter(Boolean).join(' ').trim() || t('fallbackUser'),
    telegramId: liveTelegramProfile.telegramId ?? profile.telegramId,
    phone: onboardingDone ? profile.phone : normalizeKazakhstanPhone(phone) ?? (phone.length > 2 ? phone : undefined),
  };

  useEffect(() => {
    const splashTimer = window.setTimeout(() => setMinimumSplashElapsed(true), MINIMUM_SPLASH_MS);
    return () => window.clearTimeout(splashTimer);
  }, []);

  const syncFromTelegram = useCallback(() => {
    prepareTelegram();
    const tgProfile = telegramProfile();
    if (!tgProfile.isTelegram || !onboardingDone) return;
    syncTelegramProfile({
      telegramId: tgProfile.telegramId,
      firstName: tgProfile.firstName,
      lastName: tgProfile.lastName || undefined,
      photoUrl: tgProfile.photoUrl || undefined,
    });
  }, [onboardingDone, syncTelegramProfile]);

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

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  useEffect(() => {
    if (currency !== 'RUB') return;
    const controller = new AbortController();
    void fetchKztToRubRate(controller.signal)
      .then((rate) => setKztToRubRate(rate))
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === 'AbortError') return;
        setKztToRubRate(null);
        setCurrencyRateError(true);
        setCurrency('KZT');
      });
    return () => controller.abort();
  }, [currency, setCurrency]);

  const toggleCurrency = () => {
    setCurrencyRateError(false);
    if (currency === 'RUB') {
      setCurrency('KZT');
      return;
    }
    setKztToRubRate(null);
    setCurrency('RUB');
  };

  const finishOnboarding = () => {
    const normalizedPhone = normalizeKazakhstanPhone(phone);
    if (!normalizedPhone) return;
    const tgProfile = telegramProfile();
    haptic('success');
    const nextProfile = {
      telegramId: tgProfile.telegramId,
      firstName: tgProfile.firstName.trim() || t('fallbackUser'),
      lastName: tgProfile.lastName.trim() || undefined,
      phone: normalizedPhone,
      photoUrl: tgProfile.photoUrl || undefined,
    };
    completeOnboarding(nextProfile, createLegalAcceptance(locale, nextProfile.telegramId));
  };

  const showStore = useCallback((storeId: string) => {
    haptic('tap');
    setSelectedBox(null);
    setSelectedStoreId(storeId);
  }, []);

  const openStore = useCallback((storeId: string) => {
    if (cartItems.length > 0 && cartStoreId && cartStoreId !== storeId) {
      setPendingCartReplacement({ kind: 'openStore', storeId });
      return;
    }
    showStore(storeId);
  }, [cartItems.length, cartStoreId, showStore]);

  const openBox = (box: Box) => {
    haptic('tap');
    setSelectedStoreId(box.storeId);
    setSelectedBox(box);
  };

  const applyCartQuantity = (box: Box, nextQuantity: number) => {
    const quantity = Math.min(Math.max(0, nextQuantity), availableQuantity(box, purchasedBoxQuantities));
    setCartItemQuantity(box.id, box.storeId, quantity);
    haptic(quantity > 0 ? 'tap' : 'success');
  };

  const changeCartQuantity = (box: Box, nextQuantity: number) => {
    if (nextQuantity > 0 && cartStoreId && cartStoreId !== box.storeId) {
      setPendingCartReplacement({ kind: 'changeQuantity', box, quantity: nextQuantity });
      return;
    }
    applyCartQuantity(box, nextQuantity);
  };

  const confirmCartReplacement = () => {
    if (!pendingCartReplacement) return;
    const pending = pendingCartReplacement;
    setPendingCartReplacement(null);
    clearCart();
    if (pending.kind === 'openStore') {
      showStore(pending.storeId);
      return;
    }
    applyCartQuantity(pending.box, pending.quantity);
  };

  const payCart = async () => {
    if (paymentPendingRef.current) return;
    const createdAt = new Date().toISOString();
    const items = cartItems.flatMap((item) => {
      const box = boxes.find((candidate) => candidate.id === item.boxId);
      if (!box) return [];
      const quantity = Math.min(item.quantity, availableQuantity(box, purchasedBoxQuantities));
      if (quantity < 1) return [];
      return [{ boxId: box.id, quantity, unitPrice: box.salePrice }];
    });
    if (items.length === 0) return;
    const order: Order = {
      id: createOrderId(orders.map((item) => item.id)),
      storeId: cartStoreId ?? boxes.find((box) => box.id === items[0]?.boxId)?.storeId ?? '',
      items,
      total: items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0),
      pickupCode: createPickupCode(orders.map((item) => item.pickupCode)),
      createdAt,
      status: 'paid',
    };
    paymentPendingRef.current = true;
    setPaymentPending(true);
    try {
      const paymentResult = await processPayment();
      if (paymentResult === 'failed') {
        setCartOpen(false);
        setPaymentFailed(true);
        haptic('error');
        return;
      }
    } catch {
      setCartOpen(false);
      setPaymentFailed(true);
      haptic('error');
      return;
    } finally {
      paymentPendingRef.current = false;
      setPaymentPending(false);
    }
    setPaymentFailed(false);
    completePurchase(order);
    setCartOpen(false);
    setSelectedBox(null);
    setSelectedStoreId(null);
    setSuccessOrder(order);
    haptic('success');
  };

  if (!hydrated || !minimumSplashElapsed) return <Splash t={t} />;
  if (onboardingDone && !hasCurrentLegalAcceptance(legalAcceptance, legalSubject.telegramId)) {
    return (
      <PhoneShell>
        <LegalAcceptanceScreen
          t={t}
          locale={locale}
          setLocale={setLocale}
          openLegal={setLegal}
          onAccept={() => {
            acceptLegalDocuments(createLegalAcceptance(locale, legalSubject.telegramId));
            haptic('success');
          }}
        />
        {legal && <LegalModal type={legal} t={t} locale={locale} subject={legalSubject} onClose={() => setLegal(null)} />}
      </PhoneShell>
    );
  }
  if (!onboardingDone) {
    return (
      <PhoneShell>
        <Onboarding
          t={t} locale={locale} setLocale={setLocale}
          phone={phone} setPhone={setPhone}
          openLegal={setLegal} onContinue={finishOnboarding}
        />
        {legal && <LegalModal type={legal} t={t} locale={locale} subject={legalSubject} onClose={() => setLegal(null)} />}
      </PhoneShell>
    );
  }
  const displayCurrency: Currency = currency === 'RUB' && kztToRubRate ? 'RUB' : 'KZT';
  return (
    <PriceContext.Provider value={{ currency: displayCurrency, kztToRubRate }}>
    <PhoneShell>
      <div className="relative flex h-dvh min-h-0 flex-col overflow-hidden bg-surface sm:h-[780px]">
        <main className={`hide-scrollbar min-h-0 flex-1 overflow-x-hidden overscroll-contain ${tab === 'map' ? 'overflow-y-hidden' : 'overflow-y-auto'}`}>
          {tab === 'home' && (
            <HomeTab
              t={t} profile={profile} openProfile={() => { setTab('profile'); haptic('tap'); }}
              favoriteStoreIds={favoriteStoreIds} toggleFavorite={toggleFavorite} openStore={openStore}
            />
          )}
          {tab === 'map' && <MapTab openStore={openStore} />}
          {tab === 'favorites' && (
            <FavoritesTab t={t} favoriteStoreIds={favoriteStoreIds} toggleFavorite={toggleFavorite} openStore={openStore} />
          )}
          {tab === 'orders' && <OrdersTab t={t} locale={locale} orders={orders} />}
          {tab === 'profile' && (
            <ProfileTab t={t} profile={profile} currency={currency}
              currencyLoading={currency === 'RUB' && !kztToRubRate} currencyRateError={currencyRateError} onToggleCurrency={toggleCurrency}
              openSettings={() => setSettingsOpen(true)}
              openHelp={() => setHelpOpen(true)}
              openDocuments={() => setDocumentsOpen(true)}
              resetDemo={resetDemo} />
          )}
        </main>
        <BottomNav tab={tab} setTab={setTab} t={t} />
      </div>

      {selectedStoreId && (
        <StoreDetails store={storeById(selectedStoreId)} locale={locale} t={t}
          isFavorite={favoriteStoreIds.includes(selectedStoreId)} toggleFavorite={() => toggleFavorite(selectedStoreId)}
          cartItems={cartItems} purchasedBoxQuantities={purchasedBoxQuantities}
          onChangeQuantity={changeCartQuantity} onOpenBox={openBox} onOpenCart={() => setCartOpen(true)}
          onClose={() => { setSelectedBox(null); setSelectedStoreId(null); }} />
      )}
      {selectedBox && (
        <BoxDetails box={selectedBox} locale={locale} t={t}
          cartQuantity={cartItems.find((item) => item.boxId === selectedBox.id)?.quantity ?? 0}
          available={availableQuantity(selectedBox, purchasedBoxQuantities)}
          onChangeQuantity={(quantity) => changeCartQuantity(selectedBox, quantity)} onClose={() => setSelectedBox(null)} />
      )}
      {cartOpen && (
        <CartSheet items={cartItems} purchasedBoxQuantities={purchasedBoxQuantities} locale={locale} t={t}
          onChangeQuantity={changeCartQuantity} onClose={() => setCartOpen(false)} onPay={payCart} paymentPending={paymentPending}
          onOpenOffer={() => setLegal('publicOffer')} onOpenOrderRules={() => setLegal('orderRules')} />
      )}
      {paymentFailed && (
        <PaymentFailure
          t={t}
          onBackToCart={() => { setPaymentFailed(false); setCartOpen(true); }}
        />
      )}
      {successOrder && (
        <Success order={successOrder} t={t} onDone={() => { setSuccessOrder(null); setTab('orders'); }} />
      )}
      {settingsOpen && (
        <SettingsModal t={t} locale={locale} setLocale={setLocale} phone={profile.phone}
          onEditPhone={() => setEditingPhone(true)} onClose={() => setSettingsOpen(false)} />
      )}
      {editingPhone && (
        <PhoneEditor currentPhone={profile.phone} t={t} onClose={() => setEditingPhone(false)} onSave={(value) => {
          updatePhone(value);
          setEditingPhone(false);
          haptic('success');
        }} />
      )}
      {documentsOpen && <DocumentsModal t={t} locale={locale} subject={legalSubject} onClose={() => setDocumentsOpen(false)} />}
      {helpOpen && <HelpModal t={t} onClose={() => setHelpOpen(false)} />}
      {legal && <LegalModal type={legal} t={t} locale={locale} subject={legalSubject} onClose={() => setLegal(null)} />}
      {pendingCartReplacement && (
        <CartReplacementDialog
          t={t}
          onCancel={() => setPendingCartReplacement(null)}
          onConfirm={confirmCartReplacement}
        />
      )}
    </PhoneShell>
    </PriceContext.Provider>
  );
}

function CartReplacementDialog({ t, onCancel, onConfirm }: {
  t: Translator;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <ConfirmationDialog
      className="z-[1400]"
      title={t('cart')}
      description={t('replaceCartConfirm')}
      confirmLabel={t('replaceCartAction')}
      cancelLabel={t('cancel')}
      closeLabel={t('close')}
      showClose={false}
      onConfirm={onConfirm}
      onCancel={onCancel}
    />
  );
}

function Splash({ t }: { t: Translator }) {
  return (
    <main className="grid min-h-dvh place-items-center overflow-hidden bg-brand px-6 text-white" aria-label={`Algan — ${t('loading')}`}>
      <div className="flex flex-col items-center">
        <AlganLogo
          light
          className="flex-col gap-3"
          markClassName="h-20 w-20"
          wordmarkClassName="h-9 w-[110px]"
        />
        <span className="algan-loader mt-10" role="status">
          <span className="sr-only">{t('loading')}</span>
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
  openLegal: (type: LegalDocument) => void; onContinue: () => void;
}

function Onboarding(props: OnboardingProps) {
  const { t, locale, setLocale, phone, setPhone, openLegal, onContinue } = props;
  const canContinue = Boolean(normalizeKazakhstanPhone(phone));
  return (
    <div className="flex min-h-dvh flex-col sm:min-h-[780px]">
      <div className="relative overflow-hidden bg-brand px-page-wide pb-9 pt-[max(1.5rem,env(safe-area-inset-top))] text-white">
        <div className="absolute -right-8 -top-6 h-40 w-40 rounded-full bg-warning-ink/20" />
        <div className="absolute -bottom-14 -left-8 h-36 w-36 rounded-full border-[28px] border-highlight/20" />
        <div className="relative flex items-start justify-between">
          <AlganLogo light />
          <LanguagePill locale={locale} setLocale={setLocale} dark />
        </div>
        <div className="relative mt-12">
          <p className="text-sm font-bold text-highlight">{t('slogan')}</p>
          <h1 className="mt-2 max-w-[340px] text-display">{t('hero')}</h1>
        </div>
      </div>

      <form className="flex flex-1 flex-col px-page-wide pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-7" onSubmit={(event) => { event.preventDefault(); onContinue(); }}>
        <p className="text-sm font-bold text-accent">{t('intro')}</p>
        <ContentTitle className="mt-1">{t('askName')}</ContentTitle>
        <p className="mt-2 text-sm leading-6 text-ink-secondary">{t('nameHelp')}</p>

        <TextField label={t('phone')} required value={phone} onValueChange={(value) => setPhone(formatKazakhstanPhoneInput(value))} placeholder="+7 700 000 00 00" autoComplete="tel" type="tel" />

        <PrimaryButton type="submit" disabled={!canContinue} className="mt-7">{t('continue')}<ChevronRight size={19} /></PrimaryButton>
        <LegalAcceptanceSentence t={t} openLegal={openLegal} className="mt-4" />
      </form>
    </div>
  );
}

function LegalAcceptanceSentence({ t, openLegal, className = '', prefix }: {
  t: Translator;
  openLegal: (type: LegalDocument) => void;
  className?: string;
  prefix?: string;
}) {
  return (
    <p className={`${className} text-center text-xs leading-5 text-ink-muted`}>
      {prefix ?? t('onboardingLegalPrefix')}
      <TextLinkButton onClick={() => openLegal('terms')}>{t('onboardingTermsLink')}</TextLinkButton>
      {t('onboardingLegalAfterTerms')}
      <TextLinkButton onClick={() => openLegal('personalDataConsent')}>{t('onboardingConsentLink')}</TextLinkButton>
      {t('onboardingLegalAfterConsent')}
      <TextLinkButton onClick={() => openLegal('privacy')}>{t('onboardingPrivacyLink')}</TextLinkButton>
      {t('onboardingLegalSuffix')}
    </p>
  );
}

function LegalAcceptanceScreen({ t, locale, setLocale, openLegal, onAccept }: {
  t: Translator;
  locale: Locale;
  setLocale: (locale: Locale) => void;
  openLegal: (type: LegalDocument) => void;
  onAccept: () => void;
}) {
  return (
    <div className="flex min-h-dvh flex-col sm:min-h-[780px]">
      <div className="bg-brand px-page-wide pb-6 pt-[max(1.5rem,env(safe-area-inset-top))] text-white">
        <div className="flex items-start justify-between gap-4">
          <AlganLogo light />
          <LanguagePill locale={locale} setLocale={setLocale} dark />
        </div>
      </div>
      <div className="flex flex-1 flex-col px-page-wide pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-8">
        <div className="grid h-14 w-14 place-items-center rounded-full bg-brand-soft text-brand"><FileCheck2 size={25} /></div>
        <PageTitle className="mt-5">{t('legalUpdateTitle')}</PageTitle>
        <p className="mt-3 text-sm leading-6 text-ink-secondary">{t('legalUpdateText')}</p>
        <PrimaryButton onClick={onAccept} className="mt-auto">{t('acceptAndContinue')}<ChevronRight size={19} /></PrimaryButton>
        <LegalAcceptanceSentence t={t} openLegal={openLegal} className="mt-4" prefix={t('legalUpdateAcceptancePrefix')} />
      </div>
    </div>
  );
}

function LanguagePill({ locale, setLocale, dark = false }: { locale: Locale; setLocale: (locale: Locale) => void; dark?: boolean }) {
  return (
    <PillButton tone={dark ? 'dark' : 'soft'} onClick={() => setLocale(locale === 'ru' ? 'kk' : 'ru')} className="uppercase" aria-label="Русский / Қазақша">
      <Languages size={15} /> {locale === 'ru' ? 'Қаз' : 'Рус'}
    </PillButton>
  );
}

function HomeTab({ t, profile, openProfile, favoriteStoreIds, toggleFavorite, openStore }: {
  t: Translator; profile: UserProfile; openProfile: () => void; favoriteStoreIds: string[];
  toggleFavorite: (id: string) => void; openStore: (storeId: string) => void;
}) {
  return (
    <>
      <BrandHeader>
        <div className="mt-2 flex items-center justify-between gap-4">
          <div className="min-w-0"><p className="text-sm text-white/70">{t('greeting')},</p><PageTitle className="mt-0.5 truncate text-white">{profile.firstName}!</PageTitle></div>
          <button type="button" onClick={openProfile} aria-label={t('profile')} className="shrink-0 rounded-full outline-none transition active:scale-95 focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-brand">
            <ProfileAvatar key={profile.photoUrl ?? 'fallback-avatar'} profile={profile} compact />
          </button>
        </div>
      </BrandHeader>

      <ScreenBody>
        <div className="space-y-4 pb-6">
          {stores.map((store) => {
            const storeBoxes = boxes.filter((item) => item.storeId === store.id);
            const box = storeBoxes[0];
            const isHalal = storeBoxes.length > 0 && storeBoxes.every((item) => item.isHalal);
            return box ? <StoreCard key={store.id} store={store} fallbackImage={box.image} isHalal={isHalal} t={t} favorite={favoriteStoreIds.includes(store.id)} toggleFavorite={() => toggleFavorite(store.id)} onOpen={() => openStore(store.id)} /> : null;
          })}
        </div>
      </ScreenBody>
    </>
  );
}

function StoreCard({ store, fallbackImage, isHalal, t, favorite, toggleFavorite, onOpen }: { store: Store; fallbackImage: string; isHalal: boolean; t: Translator; favorite: boolean; toggleFavorite: () => void; onOpen: () => void }) {
  return (
    <SurfaceCard className="overflow-hidden">
      <CardPressable onClick={onOpen} className="relative h-44 overflow-hidden" aria-label={`${t('details')}: ${store.name}`}>
        <img src={store.coverImage ?? fallbackImage} alt="" className="h-full w-full object-cover transition duration-500 hover:scale-105" />
        <MediaBadge className="absolute bottom-3 left-3 border-3 border-panel">
          <img src={store.logo} alt={`${store.name} logo`} className="h-9 w-9 object-contain" />
        </MediaBadge>
      </CardPressable>
      <div className="p-4">
        <div className="flex items-start gap-3">
          <CardPressable onClick={onOpen} className="min-w-0 flex-1 rounded-control" aria-label={`${store.name} ${store.address}`}>
            <span className="flex min-w-0 items-center gap-2">
              <h3 className="truncate text-lg font-black tracking-[-0.03em]">{store.name}</h3>
              {isHalal && <img src="/images/halal-logo.svg" alt={t('halal')} className="h-6 w-6 shrink-0 object-contain" />}
            </span>
            <p className="mt-1 flex items-center gap-1.5 text-xs font-semibold text-ink-muted"><MapPin size={14} />{store.address}</p>
          </CardPressable>
          <IconButton onClick={toggleFavorite} label={t('favorites')} aria-pressed={favorite} tone={favorite ? 'accent' : 'muted'}><Heart size={19} fill={favorite ? 'currentColor' : 'none'} /></IconButton>
        </div>
      </div>
    </SurfaceCard>
  );
}

function SurpriseBadge({ compact = false }: { compact?: boolean }) {
  return (
    <StatusBadge tone="dark" size={compact ? 'sm' : 'md'} icon={<Sparkles size={12} aria-hidden="true" />} className="shrink-0 tracking-[0.08em] shadow-card backdrop-blur-sm">
      SURPRISE
    </StatusBadge>
  );
}

function MapTab({ openStore }: { openStore: (storeId: string) => void }) {
  const selectStore = useCallback((id: string) => {
    openStore(id);
  }, [openStore]);
  return (
    <div className="relative h-full min-h-0">
      <LocationMap lat={SHYMKENT.lat} lng={SHYMKENT.lng} stores={stores} onSelectStore={selectStore} className="absolute inset-0" />
    </div>
  );
}

function FavoritesTab({ t, favoriteStoreIds, toggleFavorite, openStore }: { t: Translator; favoriteStoreIds: string[]; toggleFavorite: (id: string) => void; openStore: (storeId: string) => void }) {
  const favoriteStores = stores.filter((store) => favoriteStoreIds.includes(store.id));
  return (
    <PageSection title={t('favorites')}>
      {favoriteStores.length === 0 ? (
        <EmptyState icon={<Heart size={34} />} title={t('noFavorites')} description={t('noFavoritesText')} tone="accent" />
      ) : (
        <div className="mt-6 space-y-4">
          {favoriteStores.map((store) => {
            const storeBoxes = boxes.filter((item) => item.storeId === store.id);
            const box = storeBoxes[0];
            const isHalal = storeBoxes.length > 0 && storeBoxes.every((item) => item.isHalal);
            return box ? <StoreCard key={store.id} store={store} fallbackImage={box.image} isHalal={isHalal} t={t} favorite toggleFavorite={() => toggleFavorite(store.id)} onOpen={() => openStore(store.id)} /> : null;
          })}
        </div>
      )}
    </PageSection>
  );
}

function orderPickupWindow(order: Order) {
  const orderBoxes = order.items.flatMap((item) => {
    const box = boxes.find((candidate) => candidate.id === item.boxId);
    return box ? [box] : [];
  });
  const from = orderBoxes.map((box) => box.pickupFrom).sort()[0];
  const to = orderBoxes.map((box) => box.pickupTo).sort().at(-1);
  return from && to ? `${from}–${to}` : undefined;
}

function OrdersTab({ t, locale, orders }: { t: Translator; locale: Locale; orders: Order[] }) {
  const formatPrice = usePriceFormatter(locale);
  const [view, setView] = useState<'active' | 'past'>('active');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [routeStore, setRouteStore] = useState<Store | null>(null);
  const ordersWithDemoHistory = orders.some((order) => order.id === demoPastOrder.id)
    ? orders
    : [...orders, demoPastOrder];
  const visibleOrders = ordersWithDemoHistory.filter((order) => view === 'active' ? order.status === 'paid' : order.status === 'collected');
  const emptyTitle = view === 'active' ? t('noActiveOrders') : t('noPastOrders');
  const emptyText = view === 'active' ? t('noActiveOrdersText') : t('noPastOrdersText');

  return (
    <PageSection title={t('orders')}>
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
            const store = stores.find((item) => item.id === order.storeId);
            const orderDate = new Intl.DateTimeFormat(locale === 'kk' ? 'kk-KZ' : 'ru-KZ', {
              day: 'numeric', month: 'long', year: 'numeric',
            }).format(new Date(order.createdAt));
            const pickupWindow = orderPickupWindow(order);
            const summary = (
              <>
                <span className="flex gap-3">
                  {store && <MediaBadge><img src={store.logo} alt="" className="h-9 w-9 object-contain" /></MediaBadge>}
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-xs font-bold text-ink-muted">{store?.name}</span>
                    <span className="mt-1 block truncate text-[11px] font-semibold text-ink-subtle">{t('orderId')}: {formatOrderId(order.id)}</span>
                    <span className="mt-2 block space-y-1">{order.items.map((item) => {
                      const box = boxes.find((candidate) => candidate.id === item.boxId);
                      return (
                        <span key={item.boxId} className="flex items-center justify-between gap-3 text-xs">
                          <span className="truncate font-bold">{box?.name}</span>
                          <span className="shrink-0 text-right">
                            <span className="font-black text-ink-secondary">{formatPrice(item.unitPrice)}</span>
                            <span className="ml-1 font-semibold text-ink-muted">× {item.quantity}</span>
                          </span>
                        </span>
                      );
                    })}</span>
                  </span>
                </span>
                <span className="mt-3 flex items-center justify-between gap-3 border-t border-border pt-3 text-xs">
                  {view === 'active' ? (
                    <>
                      <span className="min-w-0">
                        <span className="block font-bold text-ink-secondary">{t('pickupTime')}: {pickupWindow}</span>
                        <span className="mt-1 block font-bold text-ink-muted">{orderDate}</span>
                      </span>
                      <span className="shrink-0 text-sm font-black text-brand">{formatPrice(order.total)}</span>
                    </>
                  ) : (
                    <><span className="font-bold text-ink-muted">{orderDate}</span><span className="shrink-0 text-sm font-black text-brand">{formatPrice(order.total)}</span></>
                  )}
                </span>
              </>
            );
            return (
              <SurfaceCard key={order.id} className="overflow-hidden">
                <div className="w-full p-4 text-left">{summary}</div>
                {view === 'active' && (
                  <CardActionButton onClick={() => { setSelectedOrder(order); haptic('tap'); }}>
                    <QrCode size={18} />{t('showQr')}
                  </CardActionButton>
                )}
                {view === 'active' && store && (
                  <CardActionButton onClick={() => { setRouteStore(store); haptic('tap'); }}>
                    <Route size={18} />{t('buildRoute')}
                  </CardActionButton>
                )}
              </SurfaceCard>
            );
          })}
        </div>
      )}
      {selectedOrder && <OrderDetails order={selectedOrder} locale={locale} t={t} onClose={() => setSelectedOrder(null)} />}
      {routeStore && <RoutePicker lat={routeStore.lat} lng={routeStore.lng} t={t} onClose={() => setRouteStore(null)} />}
    </PageSection>
  );
}

function OrderQr({ order, t }: { order: Order; t: Translator }) {
  return (
    <div className="mx-auto w-fit rounded-card border border-border bg-white p-4 text-brand shadow-card">
      <QRCodeSVG
        value={createOrderQrPayload(order.id, order.pickupCode)}
        size={184}
        level="M"
        marginSize={1}
        bgColor="white"
        fgColor="currentColor"
        title={t('qrCode')}
      />
    </div>
  );
}

function PickupCodePanel({ pickupCode, label, className }: { pickupCode: string; label: string; className?: string }) {
  return (
    <InsetSurface tone="brandSolid" className={`p-4 text-center ${className ?? ''}`}>
      <p className="text-xs font-bold text-white/65">{label}</p>
      <p className="mt-1 text-3xl font-black tracking-[0.12em]">{formatPickupCode(pickupCode)}</p>
    </InsetSurface>
  );
}

function OrderItemsList({ order, locale }: { order: Order; locale: Locale }) {
  const formatPrice = usePriceFormatter(locale);
  return (
    <div className="space-y-2">
      {order.items.map((item) => {
        const box = boxes.find((candidate) => candidate.id === item.boxId);
        return (
          <InsetSurface key={item.boxId} className="flex items-start justify-between gap-4 px-4 py-3">
            <div className="min-w-0"><p className="text-sm font-black">{box?.name}</p><p className="mt-1 text-xs text-ink-muted">{formatPrice(item.unitPrice)} × {item.quantity}</p></div>
            <b className="shrink-0 text-sm text-brand">{formatPrice(item.unitPrice * item.quantity)}</b>
          </InsetSurface>
        );
      })}
    </div>
  );
}

function OrderDetails({ order, locale, t, onClose }: { order: Order; locale: Locale; t: Translator; onClose: () => void }) {
  const formatPrice = usePriceFormatter(locale);
  const store = stores.find((item) => item.id === order.storeId);
  const orderDate = new Intl.DateTimeFormat(locale === 'kk' ? 'kk-KZ' : 'ru-KZ', {
    day: 'numeric', month: 'long', year: 'numeric',
  }).format(new Date(order.createdAt));
  return (
    <DialogLayer onClose={onClose} closeLabel={t('close')} ariaLabel={t('orders')}>
      <ModalBody className="max-h-[90dvh] overflow-y-auto">
        <SheetHandle />
        {order.status === 'paid' ? (
          <div className="mt-3 flex justify-end"><IconButton onClick={onClose} label={t('close')}><X size={18} /></IconButton></div>
        ) : (
          <div className="mt-5"><ModalHeader title={store?.name ?? t('orders')} onClose={onClose} closeLabel={t('close')} /></div>
        )}
        {order.status === 'paid' && (
          <>
            <div className="mt-4"><OrderQr order={order} t={t} /></div>
            <p className="mx-auto mt-4 max-w-[300px] text-center text-xs leading-5 text-ink-secondary">{t('successText')}</p>
            <PickupCodePanel pickupCode={order.pickupCode} label={t('pickupCode')} className="mt-4" />
          </>
        )}
        {order.status === 'collected' && (
          <>
            <p className="mt-5 text-center text-xs font-bold text-ink-muted">{t('orderId')}: {formatOrderId(order.id)}</p>
            <SectionTitle className="mt-6 text-base">{t('orderContents')}</SectionTitle>
            <div className="mt-3"><OrderItemsList order={order} locale={locale} /></div>
            <div className="mt-4 flex items-center justify-between border-t border-border pt-4"><span className="text-sm font-bold text-ink-muted">{t('total')}</span><b className="text-xl text-brand">{formatPrice(order.total)}</b></div>
            <p className="mt-3 text-sm font-bold text-ink-secondary">{orderDate}</p>
          </>
        )}
      </ModalBody>
    </DialogLayer>
  );
}

function ProfileTab({ t, profile, currency, currencyLoading, currencyRateError, onToggleCurrency, openSettings, openHelp, openDocuments, resetDemo }: {
  t: Translator; profile: UserProfile; currency: Currency; currencyLoading: boolean; currencyRateError: boolean;
  onToggleCurrency: () => void; openSettings: () => void; openHelp: () => void; openDocuments: () => void; resetDemo: () => void;
}) {
  const telegramUsername = telegramProfile().username.trim().replace(/^@/, '');
  const [resetConfirmationOpen, setResetConfirmationOpen] = useState(false);
  return (
    <section className="pb-8">
      <BrandHeader>
        <div className="mt-2 flex items-center gap-4">
          <ProfileAvatar key={profile.photoUrl ?? 'fallback-avatar'} profile={profile} />
          <div><ContentTitle className="text-white">{profile.firstName} {profile.lastName}</ContentTitle><p className="mt-1 text-sm text-white/65">{telegramUsername ? `@${telegramUsername}` : 'Telegram'}</p></div>
        </div>
      </BrandHeader>

      <ScreenBody>
        <div className="space-y-2">
          <ProfileRow icon={<Settings2 size={18} />} label={t('settings')} onClick={openSettings} />
          <ProfileRow icon={<CircleHelp size={18} />} label={t('support')} onClick={openHelp} />
          <ProfileRow icon={<PackageCheck size={18} />} label={t('legal')} onClick={openDocuments} />
        </div>
        <DangerButton onClick={() => setResetConfirmationOpen(true)} className="mt-6">{t('signOutDemo')}</DangerButton>
        <SecondaryButton onClick={onToggleCurrency} disabled={currencyLoading} aria-busy={currencyLoading} className="mt-2">
          <CircleDollarSign size={19} />{currencyLoading ? t('currencyLoading') : currency === 'KZT' ? t('showRubles') : t('showTenge')}
        </SecondaryButton>
        {currencyRateError && <p role="alert" className="mt-2 text-center text-xs font-bold text-danger">{t('currencyRateError')}</p>}
      </ScreenBody>
      {resetConfirmationOpen && (
        <ConfirmationDialog
          title={t('signOutDemo')}
          description={t('resetDemoConfirm')}
          confirmLabel={t('signOutDemo')}
          cancelLabel={t('cancel')}
          closeLabel={t('close')}
          tone="danger"
          onCancel={() => setResetConfirmationOpen(false)}
          onConfirm={resetDemo}
        />
      )}
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
    <DialogLayer className="z-[1200]" onClose={onClose} closeLabel={t('close')} ariaLabel={t('changePhone')}>
      <ModalBody>
        <form onSubmit={(event) => {
          event.preventDefault();
          if (normalizedPhone) onSave(normalizedPhone);
        }}>
          <ModalHeader title={t('changePhone')} onClose={onClose} closeLabel={t('close')} />
          <TextField label={t('phone')} required value={value} onValueChange={(phone) => setValue(formatKazakhstanPhoneInput(phone))}
            placeholder="+7 700 000 00 00" autoComplete="tel" type="tel" />
          <PrimaryButton type="submit" disabled={!normalizedPhone} className="mt-6">{t('savePhone')}<Check size={19} /></PrimaryButton>
        </form>
      </ModalBody>
    </DialogLayer>
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
    { id: 'favorites', icon: <Heart size={21} />, label: 'favoritesNav' },
    { id: 'orders', icon: <ShoppingBag size={21} />, label: 'ordersNav' },
  ];
  return (
    <BottomNavigation>
      {items.map((item) => (
        <BottomNavigationItem
          key={item.id}
          active={tab === item.id}
          icon={item.icon}
          label={t(item.label)}
          onClick={() => { setTab(item.id); haptic('tap'); }}
        />
      ))}
    </BottomNavigation>
  );
}

function SettingsModal({ t, locale, setLocale, phone, onEditPhone, onClose }: {
  t: Translator; locale: Locale; setLocale: (locale: Locale) => void; phone?: string;
  onEditPhone: () => void; onClose: () => void;
}) {
  return (
    <DialogLayer onClose={onClose} closeLabel={t('close')} ariaLabel={t('settings')}>
      <ModalBody>
        <ModalHeader title={t('settings')} onClose={onClose} closeLabel={t('close')} />
        <div className="mt-5 space-y-2">
          <ProfileRow icon={<Phone size={18} />} label={t('phoneNumber')} value={phone ? formatKazakhstanPhoneInput(phone) : undefined} onClick={onEditPhone} />
          <ProfileRow icon={<Languages size={18} />} label={t('language')} value={locale === 'ru' ? 'Русский' : 'Қазақша'} onClick={() => setLocale(locale === 'ru' ? 'kk' : 'ru')} />
        </div>
      </ModalBody>
    </DialogLayer>
  );
}

function StoreDetails({ store, locale, t, isFavorite, toggleFavorite, cartItems, purchasedBoxQuantities, onChangeQuantity, onOpenBox, onOpenCart, onClose }: {
  store: Store; locale: Locale; t: Translator; isFavorite: boolean; toggleFavorite: () => void;
  cartItems: CartItem[]; purchasedBoxQuantities: Record<string, number>;
  onChangeQuantity: (box: Box, quantity: number) => void; onOpenBox: (box: Box) => void;
  onOpenCart: () => void; onClose: () => void;
}) {
  const formatPrice = usePriceFormatter(locale);
  const storeBoxes = boxes.filter((box) => box.storeId === store.id);
  const isHalal = storeBoxes.length > 0 && storeBoxes.every((box) => box.isHalal);
  const fallbackImage = storeBoxes[0]?.image ?? '/images/bakery.jpg';
  const cartLines = cartItems.flatMap((item) => {
    const box = storeBoxes.find((candidate) => candidate.id === item.boxId);
    return box ? [{ box, quantity: item.quantity }] : [];
  });
  const cartQuantity = cartLines.reduce((sum, line) => sum + line.quantity, 0);
  const cartTotal = cartLines.reduce((sum, line) => sum + line.box.salePrice * line.quantity, 0);
  const [routePickerOpen, setRoutePickerOpen] = useState(false);

  return (
    <DialogLayer variant="full" onClose={onClose} closeLabel={t('close')} ariaLabel={store.name}>
      <div className="flex h-full min-h-0 flex-col overflow-hidden bg-surface">
      <TopAppBar
        data-testid="store-details-header"
        leading={<IconButton onClick={onClose} label={t('back')} tone="dark"><ChevronRight className="rotate-180" size={20} /></IconButton>}
        title={store.name}
        trailing={<IconButton onClick={toggleFavorite} label={t('favorites')} aria-pressed={isFavorite} tone={isFavorite ? 'accent' : 'dark'}><Heart size={20} fill={isFavorite ? 'currentColor' : 'none'} /></IconButton>}
      />

      <div data-testid="store-details-scroll" className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
        <div data-testid="store-details-cover" className="relative h-[240px] bg-canvas">
          <img src={store.coverImage ?? fallbackImage} alt="" className="h-full w-full object-cover object-center" />
          <MediaBadge size="lg" className="absolute -bottom-8 left-page">
            <img src={store.logo} alt={`${store.name} logo`} className="h-13 w-13 object-contain" />
          </MediaBadge>
        </div>
        <div className="px-page-wide pb-6 pt-11">
          <div className="flex min-w-0 items-center gap-3">
            <PageTitle className="min-w-0 truncate">{store.name}</PageTitle>
            {isHalal && <img src="/images/halal-logo.svg" alt={t('halal')} className="h-8 w-8 shrink-0 object-contain" />}
          </div>
          <SurfaceCard className="mt-5 p-4">
            <DetailRow icon={<MapPin size={19} />} label={t('addressLabel')} value={store.address} />
            <SecondaryButton onClick={() => { setRoutePickerOpen(true); haptic('tap'); }} className="mt-4">
              <Route size={18} />{t('buildRoute')}
            </SecondaryButton>
          </SurfaceCard>
          <NoticeCard data-testid="store-appearance-notice" className="mt-4" icon={<ImageIcon size={18} />} title={t('appearanceMayDifferTitle')}>
            {t('appearanceMayDifferText')}
          </NoticeCard>

          <div className="mt-6 space-y-3">
            {storeBoxes.map((box) => (
              <BoxOfferCard key={box.id} box={box} locale={locale} t={t}
                available={availableQuantity(box, purchasedBoxQuantities)}
                cartQuantity={cartItems.find((item) => item.boxId === box.id)?.quantity ?? 0}
                onChangeQuantity={(quantity) => onChangeQuantity(box, quantity)} onOpen={() => onOpenBox(box)} />
            ))}
          </div>
        </div>
      </div>
      {cartQuantity > 0 && (
        <StickyActionFooter>
          <PrimaryButton onClick={onOpenCart}><ShoppingBag size={19} />{t('cart')} · {cartQuantity}<span className="ml-auto">{formatPrice(cartTotal)}</span></PrimaryButton>
        </StickyActionFooter>
      )}
        {routePickerOpen && <RoutePicker lat={store.lat} lng={store.lng} t={t} onClose={() => setRoutePickerOpen(false)} />}
      </div>
    </DialogLayer>
  );
}

function BoxOfferCard({ box, locale, t, available, cartQuantity, onChangeQuantity, onOpen }: {
  box: Box; locale: Locale; t: Translator; available: number; cartQuantity: number;
  onChangeQuantity: (quantity: number) => void; onOpen: () => void;
}) {
  const formatPrice = usePriceFormatter(locale);
  const discount = Math.round((1 - box.salePrice / box.originalPrice) * 100);
  return (
    <SurfaceCard className={`overflow-hidden ${available > 0 ? '' : 'border-danger/25'}`}>
      <CardPressable onClick={onOpen} className="relative flex items-stretch gap-3 p-3" aria-label={`${t('details')} ${box.name}`}>
        <img src={box.image} alt={box.name} className="h-28 w-24 shrink-0 rounded-media object-cover" />
        <span className="min-w-0 flex-1">
          <span className="flex flex-wrap items-center gap-2 pr-10">
            <span className="text-base font-black leading-5">{box.name}</span>
            {box.type === 'SURPRISE' && <SurpriseBadge compact />}
          </span>
          <StatusBadge tone={available > 0 ? 'accent' : 'danger'} icon={<Package size={14} />} className="mt-2">{formatBoxesLeft(available, locale)}</StatusBadge>
          <span className="mt-2 flex items-center gap-1.5 text-[11px] font-bold tracking-[-0.02em] text-ink-secondary">
            <Clock3 size={14} className="shrink-0 text-brand" />
            <span className="whitespace-nowrap">{t('pickupTime')}: {box.pickupFrom}–{box.pickupTo}</span>
          </span>
          <span className="mt-2 flex flex-wrap items-center gap-2">
            <b className="text-base text-brand">{formatPrice(box.salePrice)}</b>
            <span className="text-[11px] text-ink-muted line-through">{formatPrice(box.originalPrice)}</span>
            <StatusBadge tone="accentSolid" size="sm">−{discount}%</StatusBadge>
          </span>
        </span>
        <DisclosureIndicator className="absolute right-3 top-3" />
      </CardPressable>
      {(available > 0 || cartQuantity > 0) && (
        <div className="border-t border-border px-3 py-3">
          <QuantityControl quantity={cartQuantity} max={available} label={t('quantity')}
            addLabel={`${t('addToCart')} ${box.name}`} addText={t('addToCart')} onChange={onChangeQuantity} />
        </div>
      )}
    </SurfaceCard>
  );
}

function BoxDetails({ box, locale, t, cartQuantity, available, onChangeQuantity, onClose }: {
  box: Box; locale: Locale; t: Translator; cartQuantity: number; available: number;
  onChangeQuantity: (quantity: number) => void; onClose: () => void;
}) {
  const formatPrice = usePriceFormatter(locale);
  const discount = Math.round((1 - box.salePrice / box.originalPrice) * 100);
  const [selectedQuantity, setSelectedQuantity] = useState(() =>
    Math.min(Math.max(cartQuantity, 1), Math.max(available, 1)),
  );
  return (
    <DialogLayer onClose={onClose} closeLabel={t('close')} ariaLabel={box.name}>
      <div data-testid="box-details-sheet" className="flex h-[80dvh] min-h-0 flex-col sm:h-[624px]">
        <div className="shrink-0 px-page pt-4">
          <SheetHandle />
          <div className="mt-2 flex justify-end"><IconButton onClick={onClose} label={t('close')}><X size={18} /></IconButton></div>
        </div>

        <div data-testid="box-details-scroll" className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
          <div className="px-page-wide pb-6 pt-4">
          <PageTitle>{box.name}</PageTitle>
          {box.type === 'SURPRISE' && <div className="mt-3"><SurpriseBadge /></div>}
          <div className="mt-2">
            <StatusBadge data-testid="box-stock" tone={available > 0 ? 'accent' : 'danger'} size="lg" icon={<Package size={15} />}>{formatBoxesLeft(available, locale)}</StatusBadge>
          </div>
          <div className="mt-4">
            <InsetSurface data-testid="box-price-card" tone="brand" className="p-4">
              <p className="text-[11px] font-black uppercase tracking-[0.08em] text-ink-secondary">{t('boxPrice')}</p>
              <p className="mt-2 text-[25px] font-black tracking-[-0.04em] text-brand">{formatPrice(box.salePrice)}</p>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <span className="text-xs font-semibold text-ink-muted line-through">{formatPrice(box.originalPrice)}</span>
                <StatusBadge tone="accentSolid">−{discount}%</StatusBadge>
              </div>
            </InsetSurface>
          </div>
          <DetailRow data-testid="box-pickup-time" className="mt-4" icon={<Clock3 size={18} />} label={t('pickupTime')} value={`${box.pickupFrom}–${box.pickupTo}`} />
          {box.type === 'SURPRISE' ? (
            <>
              <SectionTitle className="mt-6">{t('surprisePossibleTitle')}</SectionTitle>
              <p className="mt-2 text-sm leading-6 text-ink-secondary">{t('surprisePossibleContents')}</p>
              <NoticeCard data-testid="surprise-composition-notice" className="mt-4" icon={<Sparkles size={18} />} title={t('surpriseNoticeTitle')}>
                {t('surprise')}
              </NoticeCard>
            </>
          ) : (
            <>
              <SectionTitle className="mt-6">{t('composition')}</SectionTitle>
              <ul className="mt-3 space-y-2" data-testid="box-contents">
                {box.contents?.map((item) => (
                  <li key={item.contentName}>
                    <InsetSurface className="flex items-center justify-between gap-4 px-4 py-3 text-sm">
                      <span className="font-bold text-ink">{item.contentName}</span>
                      <span className="shrink-0 font-black text-brand">× {item.quantity}</span>
                    </InsetSurface>
                  </li>
                ))}
              </ul>
            </>
          )}
          <NoticeCard className="mt-4" tone="allergen" icon={<AlertTriangle size={19} />} title={box.allergens ? t('containsAllergens') : t('allergens')}>
            {box.allergens ?? t('allergensUnknown')}
          </NoticeCard>
          </div>
        </div>
        {(available > 0 || cartQuantity > 0) && (
          <StickyActionFooter>
            <div className="grid grid-cols-[7.5rem_minmax(0,1fr)] items-center gap-3">
              <QuantityStepper quantity={selectedQuantity} min={1} max={Math.max(available, cartQuantity)}
                label={t('quantity')} onChange={setSelectedQuantity} />
              <PrimaryButton size="md" className="whitespace-nowrap" style={{ paddingInline: 6, fontSize: 12 }} onClick={() => {
                onChangeQuantity(selectedQuantity);
                onClose();
              }}
                aria-label={`${t('addToCartFull')} ${box.name}`}>
                {t('addToCartFull')}
              </PrimaryButton>
            </div>
          </StickyActionFooter>
        )}
      </div>
    </DialogLayer>
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
    <DialogLayer onClose={onClose} closeLabel={t('close')} ariaLabel={t('chooseMap')} className="z-[1200]">
      <div className="px-page pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-4">
        <SheetHandle />
        <div className="mt-4"><ModalHeader title={t('chooseMap')} onClose={onClose} closeLabel={t('close')} /></div>
        <div className="mt-4 space-y-2">
          {options.map((option) => (
            <ListRow
              key={option.id}
              icon={<img src={routeProviderLogo[option.id]} alt={`${option.label} logo`} className="h-9 w-9 rounded-xl object-cover" />}
              title={option.label}
              tone="panel"
              trailing={<ChevronRight size={17} className="text-ink-subtle" />}
              onClick={() => { openExternalLink(option.url); haptic('tap'); }}
            />
          ))}
        </div>
      </div>
    </DialogLayer>
  );
}

function CartSheet({ items, purchasedBoxQuantities, locale, t, onChangeQuantity, onClose, onPay, paymentPending, onOpenOffer, onOpenOrderRules }: {
  items: CartItem[]; purchasedBoxQuantities: Record<string, number>; locale: Locale; t: Translator;
  onChangeQuantity: (box: Box, quantity: number) => void; onClose: () => void; onPay: () => Promise<void>; paymentPending: boolean;
  onOpenOffer: () => void; onOpenOrderRules: () => void;
}) {
  const formatPrice = usePriceFormatter(locale);
  const lines = items.flatMap((item) => {
    const box = boxes.find((candidate) => candidate.id === item.boxId);
    return box ? [{ box, quantity: item.quantity }] : [];
  });
  const total = lines.reduce((sum, line) => sum + line.box.salePrice * line.quantity, 0);
  return (
    <DialogLayer onClose={onClose} closeLabel={t('close')} ariaLabel={t('cart')}>
      <ModalBody>
        <SheetHandle />
        <div className="mt-5"><ModalHeader title={t('cart')} onClose={onClose} closeLabel={t('close')} /></div>
        {lines.length === 0 ? (
          <EmptyState icon={<ShoppingBag size={32} />} title={t('cartEmpty')} />
        ) : (
          <div className="mt-5 max-h-[48vh] space-y-3 overflow-y-auto pr-1">
            {lines.map(({ box, quantity }) => (
              <InsetSurface key={box.id} tone="panel" className="p-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-black">{box.name}</p>
                  <p className="mt-1 text-xs font-bold text-ink-muted">{formatPrice(box.salePrice)} × {quantity}</p>
                  <p className="mt-1 text-sm font-black text-brand">{formatPrice(box.salePrice * quantity)}</p>
                </div>
                <div className="mt-3 grid grid-cols-[1fr_auto] items-center gap-3">
                  <QuantityControl quantity={quantity} max={availableQuantity(box, purchasedBoxQuantities)} label={t('quantity')}
                    addLabel={`${t('addToCart')} ${box.name}`} addText={t('addToCart')} onChange={(next) => onChangeQuantity(box, next)} />
                  <TertiaryButton tone="danger" onClick={() => onChangeQuantity(box, 0)}>{t('removeFromCart')}</TertiaryButton>
                </div>
              </InsetSurface>
            ))}
          </div>
        )}
        <div className="my-5 h-px bg-border" />
        <div className="flex items-end justify-between"><span className="text-sm font-bold text-ink-secondary">{t('total')}</span><span className="text-2xl font-black" aria-live="polite">{formatPrice(total)}</span></div>
        <PrimaryButton onClick={() => void onPay()} disabled={lines.length === 0 || paymentPending} aria-busy={paymentPending} className="mt-5">
          {paymentPending ? t('paymentProcessing') : t('checkoutCart')}<ChevronRight size={19} />
        </PrimaryButton>
        <p className="mt-3 text-center text-xs leading-5 text-ink-muted">
          {t('checkoutOfferPrefix')}{' '}
          <TextLinkButton onClick={onOpenOffer}>{t('checkoutOfferLink')}</TextLinkButton>
          {' '}{t('checkoutOfferBetween')}{' '}
          <TextLinkButton onClick={onOpenOrderRules}>{t('checkoutRulesLink')}</TextLinkButton>
          {t('checkoutOfferSuffix') ? ` ${t('checkoutOfferSuffix')}` : ''}
        </p>
      </ModalBody>
    </DialogLayer>
  );
}

function PaymentFailure({ t, onBackToCart }: {
  t: Translator; onBackToCart: () => void;
}) {
  return (
    <DialogLayer onClose={onBackToCart} closeLabel={t('close')} ariaLabel={t('paymentFailedTitle')} variant="full">
      <FullScreenFeedback
        centered
        tone="danger"
        icon={<AlertTriangle size={32} strokeWidth={2.5} />}
        title={t('paymentFailedTitle')}
        description={t('paymentFailedText')}
      >
        <PrimaryButton onClick={onBackToCart} className="mt-8">{t('backToCart')}</PrimaryButton>
      </FullScreenFeedback>
    </DialogLayer>
  );
}

function Success({ order, t, onDone }: { order: Order; t: Translator; onDone: () => void }) {
  return (
    <DialogLayer onClose={onDone} closeLabel={t('close')} ariaLabel={t('ordersCreated')} variant="full">
      <FullScreenFeedback
        icon={<><Check size={32} strokeWidth={3} /><Sparkles className="absolute -right-2 -top-1 text-accent" size={20} /></>}
        title={t('ordersCreated')}
        description={t('successText')}
      >
        <div className="mt-5"><OrderQr order={order} t={t} /></div>
        <PickupCodePanel pickupCode={order.pickupCode} label={t('pickupCode')} className="mx-auto mt-4 w-full max-w-[320px] p-3" />
        <p className="mt-4 text-xs font-bold text-ink-muted">{t('orderId')}: {formatOrderId(order.id)}</p>
        <PrimaryButton onClick={onDone} className="mt-6 shrink-0">{t('toOrders')}<ChevronRight size={19} /></PrimaryButton>
      </FullScreenFeedback>
    </DialogLayer>
  );
}

function DocumentsModal({ t, locale, subject, onClose }: { t: Translator; locale: Locale; subject: LegalSubject; onClose: () => void }) {
  const [selectedView, setSelectedView] = useState<LegalInformationView | null>(null);
  const documents: { type: LegalDocument; icon: React.ReactNode }[] = [
    { type: 'terms', icon: <Info size={18} /> },
    { type: 'personalDataConsent', icon: <FileCheck2 size={18} /> },
    { type: 'privacy', icon: <PackageCheck size={18} /> },
    { type: 'orderRules', icon: <ShoppingBag size={18} /> },
    { type: 'publicOffer', icon: <Check size={18} /> },
  ];
  const title = selectedView === 'contacts'
    ? t('contacts')
    : selectedView ? t(LEGAL_TITLE_KEYS[selectedView]) : t('legal');

  return (
    <DialogLayer onClose={onClose} closeLabel={t('close')} ariaLabel={t('legal')}>
      <ModalBody className="flex max-h-[82dvh] min-h-0 flex-col overflow-hidden">
        <div data-testid="documents-modal-header" className="shrink-0 bg-surface pb-3">
          <ModalHeader
            title={title}
            onBack={selectedView ? () => setSelectedView(null) : undefined}
            backLabel={t('back')}
            onClose={onClose}
            closeLabel={t('close')}
          />
        </div>
        <div data-testid="documents-modal-scroll" className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
          {selectedView === 'contacts' ? (
            <>
              <CompanyContacts t={t} />
              <PrimaryButton onClick={() => setSelectedView(null)} className="mt-5">{t('back')}</PrimaryButton>
            </>
          ) : selectedView ? (
            <>
              <LegalDocumentView type={selectedView} t={t} locale={locale} subject={subject} />
              {!isPublishedLegalDocument(selectedView) && (
                <PrimaryButton onClick={() => setSelectedView(null)} className="mt-5">{t('back')}</PrimaryButton>
              )}
            </>
          ) : (
            <div className="mt-5 space-y-2">
              {documents.map((document) => (
                <ProfileRow key={document.type} icon={document.icon} label={t(LEGAL_TITLE_KEYS[document.type])} onClick={() => setSelectedView(document.type)} />
              ))}
              <ProfileRow icon={<Building2 size={18} />} label={t('contacts')} onClick={() => setSelectedView('contacts')} />
            </div>
          )}
        </div>
      </ModalBody>
    </DialogLayer>
  );
}

function CompanyContacts({ t }: { t: Translator }) {
  return (
    <InsetSurface radius="card" className="mt-5 p-5 text-sm">
      <SectionTitle>{t('companyName')}</SectionTitle>
      <p className="mt-1 font-bold text-ink-secondary">{t('companyId')}</p>
      <div className="mt-5 space-y-4">
        <div><p className="text-xs font-black text-ink-muted">{t('contactLegalAddressLabel')}</p><p className="mt-1 leading-6">{t('companyAddress')}</p></div>
        <LinkRow tone="panel" href="mailto:algansupport@gmail.com" icon={<Mail size={18} />} title={t('emailLabel')} subtitle="algansupport@gmail.com" />
        <LinkRow tone="panel" href="tel:+77059768000" icon={<Phone size={18} />} title={t('contactPhoneLabel')} subtitle="+7 705 976 80 00" />
      </div>
    </InsetSurface>
  );
}

function HelpModal({ t, onClose }: { t: Translator; onClose: () => void }) {
  const [view, setView] = useState<'menu' | 'faq'>('menu');
  const [openQuestion, setOpenQuestion] = useState<number | null>(null);
  const faqItems: { question: CopyKey; answer: CopyKey }[] = [
    { question: 'faqBuyQuestion', answer: 'faqBuyAnswer' },
    { question: 'faqPickupQuestion', answer: 'faqPickupAnswer' },
    { question: 'faqContentsQuestion', answer: 'faqContentsAnswer' },
    { question: 'faqOrdersQuestion', answer: 'faqOrdersAnswer' },
    { question: 'faqProblemQuestion', answer: 'faqProblemAnswer' },
  ];
  const title = view === 'faq' ? t('faq') : t('support');

  return (
    <DialogLayer onClose={onClose} closeLabel={t('close')} ariaLabel={t('support')}>
      <ModalBody className="max-h-[82dvh] overflow-y-auto">
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
            <ProfileRow icon={<TelegramIcon />} label={t('contactSupport')} value={t('workingHours')} onClick={() => openTelegramLink(SUPPORT_TELEGRAM_URL)} />
          </div>
        )}

        {view === 'faq' && (
          <div className="mt-2 space-y-2">
            {faqItems.map((item, index) => {
              const expanded = openQuestion === index;
              return (
                <AccordionItem key={item.question} title={t(item.question)} expanded={expanded} onToggle={() => setOpenQuestion(expanded ? null : index)}>
                  {t(item.answer)}
                </AccordionItem>
              );
            })}
          </div>
        )}

      </ModalBody>
    </DialogLayer>
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
  return <NoticeCard className="mt-5" tone="warning" icon={<Info size={20} />}>{t('placeholderLegal')}</NoticeCard>;
}

function LegalDocumentView({ type, t, locale, subject }: {
  type: LegalDocument;
  t: Translator;
  locale: Locale;
  subject: LegalSubject;
}) {
  if (!isPublishedLegalDocument(type)) return <LegalDocumentNotice t={t} />;
  const document = getLegalDocument(locale, type);
  const meta = legalDocumentMeta[locale];
  return (
    <article className="mt-4 text-sm leading-6 text-ink-secondary" data-legal-document={type}>
      <InsetSurface className="p-4">
        <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-xs">
          <dt className="font-black text-ink-muted">{meta.version}</dt><dd className="text-right font-bold text-ink">{LEGAL_DOCUMENT_VERSION}</dd>
          <dt className="font-black text-ink-muted">{meta.effectiveDate}</dt><dd className="text-right font-bold text-ink">{LEGAL_EFFECTIVE_DATE}</dd>
          <dt className="font-black text-ink-muted">{meta.operator}</dt><dd className="text-right font-bold text-ink">{t('companyName')}</dd>
        </dl>
      </InsetSurface>

      {type === 'personalDataConsent' && (
        <InsetSurface tone="brand" className="mt-3 p-4">
          <h3 className="font-black text-brand">{meta.subject}</h3>
          <dl className="mt-3 space-y-2 text-xs">
            <div className="flex items-start justify-between gap-4"><dt className="font-bold text-ink-muted">{meta.fullName}</dt><dd className="text-right font-black text-ink">{subject.fullName}</dd></div>
            <div className="flex items-start justify-between gap-4"><dt className="font-bold text-ink-muted">{meta.telegramId}</dt><dd className="text-right font-black text-ink">{subject.telegramId ?? meta.notProvided}</dd></div>
            <div className="flex items-start justify-between gap-4"><dt className="font-bold text-ink-muted">{meta.phone}</dt><dd className="text-right font-black text-ink">{subject.phone ?? meta.notProvided}</dd></div>
          </dl>
        </InsetSurface>
      )}

      <div className="mt-5 space-y-3">
        {document.introduction.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
      </div>
      <div className="mt-6 space-y-7">
        {document.sections.map((section) => (
          <section key={section.heading}>
            <h3 className="text-base font-black leading-6 text-ink">{section.heading}</h3>
            {section.paragraphs && (
              <div className="mt-3 space-y-3">{section.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}</div>
            )}
            {section.items && (
              <ul className="mt-3 list-disc space-y-2 pl-5">{section.items.map((item) => <li key={item}>{item}</li>)}</ul>
            )}
          </section>
        ))}
      </div>
    </article>
  );
}

function LegalModal({ type, t, locale, subject, onClose }: {
  type: LegalDocument;
  t: Translator;
  locale: Locale;
  subject: LegalSubject;
  onClose: () => void;
}) {
  return (
    <DialogLayer onClose={onClose} closeLabel={t('close')} ariaLabel={t(LEGAL_TITLE_KEYS[type])}>
      <ModalBody className="flex max-h-[90dvh] min-h-0 flex-col overflow-hidden">
        <div data-testid="legal-modal-header" className="shrink-0 bg-surface pb-3">
          <ModalHeader title={t(LEGAL_TITLE_KEYS[type])} onClose={onClose} closeLabel={t('close')} />
        </div>
        <div data-testid="legal-modal-scroll" className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
          <LegalDocumentView type={type} t={t} locale={locale} subject={subject} />
          {!isPublishedLegalDocument(type) && <PrimaryButton onClick={onClose} className="mt-5">{t('back')}</PrimaryButton>}
        </div>
      </ModalBody>
    </DialogLayer>
  );
}
