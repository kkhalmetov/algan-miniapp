'use client';
/* eslint-disable @next/next/no-img-element */

import {
  AlertTriangle, ArrowUpRight, Building2, CalendarDays, Check, CheckCircle2, ChevronRight, CircleDollarSign, CircleHelp, Clock3, FileCheck2, FileText, Headphones, Heart, Home, Image as ImageIcon, Info, Languages, Mail,
  MapPin, Package, PackageCheck, Phone, ReceiptText, RotateCcw, Settings2, ShieldCheck, ShoppingBag, Sparkles, UserRound,
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { AlganLogo, AlganMark } from '@/components/algan-logo';
import {
  AccordionItem, AvatarFrame, BottomNavigation, BottomNavigationItem, BrandHeader, CardActionButton, CardPressable, CardTitle, ConfirmationDialog, DangerButton, DialogLayer,
  ContentTitle, EmptyState, FullScreenFeedback, IconButton, InsetSurface, LinkRow, ListRow,
  MediaBadge, MediaSheetHeader, ModalBody, NoticeCard, PageSection, PageTitle, PillButton, PrimaryButton, QuantityControl, QuantityStepper, ScreenBody,
  ScrollArea, SecondaryButton, SectionTitle, SegmentedControl, SheetHeader, StatusBadge, StickyActionFooter, SurfaceCard, TertiaryButton, TextField,
  TextLinkButton,
} from '@/components/ui-kit';
import { authenticateTelegram } from '@/lib/api';
import { boxAllergens, boxContentName, boxName, storeAddress } from '@/lib/catalog-localization';
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
import { formatOrderDate } from '@/lib/date';
import { formatBoxesLeft } from '@/lib/stock';
import { useAppStore } from '@/lib/store';
import { getCopy, type CopyKey } from '@/lib/translations';
import { haptic, openExternalLink, openTelegramLink, prepareTelegram, telegramProfile } from '@/lib/telegram';
import type { Box, CartItem, Currency, Locale, Order, Store, Tab, UserProfile } from '@/lib/types';

export const MINIMUM_SPLASH_MS = 900;
const TELEGRAM_SYNC_DELAYS_MS = [0, 250, 750, 1500, 3000] as const;
const SUPPORT_TELEGRAM_URL = 'https://t.me/kkhalmetov';
type LegalDocument = 'terms' | 'personalDataConsent' | 'privacy' | 'orderRules' | 'publicOffer';
type LegalInformationView = LegalDocument | 'contacts';
type LegalSubject = { fullName: string; telegramId?: number; phone?: string };
type PendingCartReplacement =
  { kind: 'changeQuantity'; box: Box; quantity: number };
const LEGAL_TITLE_KEYS: Record<LegalDocument, CopyKey> = {
  terms: 'termsTitle', personalDataConsent: 'personalDataConsentTitle', privacy: 'privacyTitle',
  orderRules: 'orderRulesTitle', publicOffer: 'publicOfferTitle',
};
const DEMO_FALLBACK_NAMES = new Set(['Пользователь', 'Қолданушы']);

const localizedFirstName = (profile: UserProfile, t: Translator) => {
  const firstName = profile.firstName.trim();
  return !firstName || DEMO_FALLBACK_NAMES.has(firstName) ? t('fallbackUser') : firstName;
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
    hydrated, onboardingDone, profile, legalAcceptance, locale, currency, tab, favoriteBoxIds, orders, cartStoreId, cartItems, purchasedBoxQuantities,
    completeOnboarding, acceptLegalDocuments, syncTelegramProfile, updatePhone, setLocale, setCurrency, setTab, toggleFavoriteBox,
    setCartItemQuantity, clearCart, completePurchase, resetDemo,
  } = useAppStore();
  const t = useCallback((key: CopyKey) => getCopy(locale)(key), [locale]);
  const liveTelegramProfile = telegramProfile();
  const [phone, setPhone] = useState('+7');
  const [legal, setLegal] = useState<LegalDocument | null>(null);
  const [documentsOpen, setDocumentsOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
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

  const openBox = (box: Box) => {
    if (availableQuantity(box, purchasedBoxQuantities) < 1) return;
    haptic('tap');
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
    applyCartQuantity(pending.box, pending.quantity);
    setCartOpen(true);
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
        <main className="hide-scrollbar min-h-0 flex-1 overflow-x-hidden overflow-y-auto overscroll-contain">
          {tab === 'home' && (
            <HomeTab
              t={t} locale={locale} profile={profile}
              favoriteBoxIds={favoriteBoxIds} toggleFavoriteBox={toggleFavoriteBox} openBox={openBox}
              purchasedBoxQuantities={purchasedBoxQuantities}
            />
          )}
          {tab === 'favorites' && (
            <FavoritesTab t={t} locale={locale} favoriteBoxIds={favoriteBoxIds} toggleFavoriteBox={toggleFavoriteBox} openBox={openBox} purchasedBoxQuantities={purchasedBoxQuantities} />
          )}
          {tab === 'orders' && <OrdersTab t={t} locale={locale} orders={orders} onBrowseOffers={() => { setTab('home'); haptic('tap'); }} />}
          {tab === 'profile' && (
            <ProfileTab t={t} profile={profile} currency={currency}
              currencyLoading={currency === 'RUB' && !kztToRubRate} currencyRateError={currencyRateError} onToggleCurrency={toggleCurrency}
              openSettings={() => setSettingsOpen(true)}
              openHelp={() => setHelpOpen(true)}
              openDocuments={() => setDocumentsOpen(true)}
              resetDemo={resetDemo} />
          )}
        </main>
        {tab === 'home' && cartItems.length > 0 && !selectedBox && !cartOpen && (
          <CartDock items={cartItems} locale={locale} t={t} onOpen={() => setCartOpen(true)} />
        )}
        <BottomNav tab={tab} setTab={setTab} t={t} />
      </div>

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
      title={t('cartRuleTitle')}
      description={<><span className="block">{t('cartRuleText')}</span><span className="mt-2 block font-bold text-ink">{t('replaceCartConfirm')}</span></>}
      confirmLabel={t('replaceCartAction')}
      cancelLabel={t('keepCart')}
      closeLabel={t('close')}
      icon={<ShoppingBag size={24} />}
      tone="danger"
      showClose={false}
      onConfirm={onConfirm}
      onCancel={onCancel}
    />
  );
}

function Splash({ t }: { t: Translator }) {
  return (
    <main className="relative grid min-h-dvh place-items-center overflow-hidden bg-canvas px-page text-brand sm:px-page-wide" aria-label={`Algan — ${t('loading')}`}>
      <div aria-hidden="true" className="absolute -right-18 top-14 h-48 w-48 rounded-full bg-brand-soft/55 blur-[1px]" />
      <div aria-hidden="true" className="absolute -bottom-24 -left-20 h-64 w-64 rounded-full border-[46px] border-accent/12" />
      <div className="relative flex flex-col items-center text-center">
        <AlganLogo
          className="algan-logo-float flex-col gap-4"
          markClassName="h-24 w-24"
          wordmarkClassName="h-10 w-[122px]"
        />
        <span className="algan-loader mt-8" role="status">
          <span className="sr-only">{t('loading')}</span>
        </span>
      </div>
    </main>
  );
}

function PhoneShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh bg-canvas text-ink sm:grid sm:place-items-center sm:px-8 sm:py-6">
      <div className="relative mx-auto min-h-dvh w-full max-w-[460px] overflow-hidden bg-surface sm:min-h-[780px] sm:rounded-shell sm:shadow-shell">
        {children}
      </div>
    </div>
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
    <main className="flex min-h-dvh flex-col bg-canvas sm:min-h-[780px]">
      <div className="relative overflow-hidden bg-brand px-page pb-10 pt-[max(1.25rem,env(safe-area-inset-top))] text-white sm:px-page-wide">
        <div className="absolute -right-14 -top-10 h-48 w-48 rounded-full bg-brand-hover" />
        <div className="absolute -bottom-18 -left-10 h-40 w-40 rounded-full border-[32px] border-highlight/25" />
        <div className="relative flex items-start justify-between">
          <AlganLogo light />
          <LanguagePill locale={locale} setLocale={setLocale} dark />
        </div>
        <div className="relative mt-14">
          <p className="inline-flex rounded-full bg-highlight px-3 py-1.5 text-xs font-extrabold text-brand">{t('slogan')}</p>
          <h1 className="mt-4 max-w-[360px] text-display">{t('hero')}</h1>
        </div>
      </div>

      <form className="relative -mt-4 flex flex-1 flex-col rounded-t-sheet bg-surface px-page pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-8 sm:px-page-wide" onSubmit={(event) => { event.preventDefault(); onContinue(); }}>
        <p className="text-xs font-extrabold uppercase tracking-[.08em] text-accent-strong">{t('intro')}</p>
        <ContentTitle className="mt-2">{t('askName')}</ContentTitle>
        <p className="mt-2 text-sm leading-6 text-ink-secondary">{t('nameHelp')}</p>

        <TextField label={t('phone')} required value={phone} onValueChange={(value) => setPhone(formatKazakhstanPhoneInput(value))} placeholder="+7 700 000 00 00" autoComplete="tel" type="tel" />

        <PrimaryButton type="submit" disabled={!canContinue} className="mt-7">{t('continue')}</PrimaryButton>
        <LegalAcceptanceSentence t={t} openLegal={openLegal} className="mt-auto pt-4" />
      </form>
    </main>
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
    <main className="flex min-h-dvh flex-col overflow-hidden bg-canvas sm:min-h-[780px]">
      <div className="relative overflow-hidden bg-brand px-page pb-8 pt-[max(1.5rem,env(safe-area-inset-top))] text-white sm:px-page-wide">
        <div aria-hidden="true" className="absolute -right-14 -top-16 h-48 w-48 rounded-full bg-brand-hover" />
        <div aria-hidden="true" className="absolute -bottom-20 -left-12 h-44 w-44 rounded-full border-[34px] border-highlight/20" />
        <div className="relative flex items-start justify-between gap-4">
          <AlganLogo light />
          <LanguagePill locale={locale} setLocale={setLocale} dark />
        </div>
        <div className="relative mt-10 grid h-16 w-16 place-items-center rounded-[20px] bg-highlight text-brand shadow-action"><ShieldCheck size={30} /></div>
      </div>
      <div className="-mt-4 flex flex-1 flex-col rounded-t-sheet bg-surface px-page pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-8 sm:px-page-wide">
        <PageTitle>{t('legalUpdateTitle')}</PageTitle>
        <p className="mt-3 text-sm leading-6 text-ink-secondary">{t('legalUpdateText')}</p>
        <div className="mt-6 space-y-3">
          <ProfileRow icon={<FileText size={18} />} label={t('termsTitle')} onClick={() => openLegal('terms')} />
          <ProfileRow icon={<FileCheck2 size={18} />} label={t('personalDataConsentTitle')} onClick={() => openLegal('personalDataConsent')} />
          <ProfileRow icon={<ShieldCheck size={18} />} label={t('privacyTitle')} onClick={() => openLegal('privacy')} />
        </div>
        <PrimaryButton onClick={onAccept} className="mt-auto">{t('acceptAndContinue')}</PrimaryButton>
      </div>
    </main>
  );
}

function LanguagePill({ locale, setLocale, dark = false }: { locale: Locale; setLocale: (locale: Locale) => void; dark?: boolean }) {
  return (
    <PillButton tone={dark ? 'dark' : 'soft'} onClick={() => setLocale(locale === 'ru' ? 'kk' : 'ru')} className="uppercase" aria-label="Русский / Қазақша">
      <Languages size={15} /> {locale === 'ru' ? 'Қаз' : 'Рус'}
    </PillButton>
  );
}

function HomeTab({ t, locale, profile, favoriteBoxIds, toggleFavoriteBox, openBox, purchasedBoxQuantities }: {
  t: Translator; locale: Locale; profile: UserProfile; favoriteBoxIds: string[];
  toggleFavoriteBox: (id: string) => void; openBox: (box: Box) => void; purchasedBoxQuantities: Record<string, number>;
}) {
  const firstName = localizedFirstName(profile, t);
  return (
    <>
      <BrandHeader>
        <div aria-hidden="true" className="absolute -right-10 -top-14 h-44 w-44 rounded-full bg-brand-hover" />
        <div className="relative">
          <AlganLogo light markClassName="h-8 w-8" wordmarkClassName="h-6 w-[73px]" />
        </div>
        <div className="relative mt-7 min-w-0">
          <p className="text-sm font-medium text-white/75">{t('greeting')},</p>
          <PageTitle tone="inverse" className="mt-0.5 truncate">{firstName}!</PageTitle>
        </div>
      </BrandHeader>

      <ScreenBody>
        <div className="space-y-4 pb-7">
          {boxes.map((box) => (
            <MarketplaceBoxCard
              key={box.id}
              box={box}
              store={storeById(box.storeId)}
              t={t}
              locale={locale}
              favorite={favoriteBoxIds.includes(box.id)}
              toggleFavorite={() => toggleFavoriteBox(box.id)}
              onOpen={() => openBox(box)}
              available={availableQuantity(box, purchasedBoxQuantities)}
            />
          ))}
        </div>
      </ScreenBody>
    </>
  );
}

function MarketplaceBoxCard({ box, store, t, locale, favorite, toggleFavorite, onOpen, available }: {
  box: Box; store: Store; t: Translator; locale: Locale; favorite: boolean;
  toggleFavorite: () => void; onOpen: () => void; available: number;
}) {
  const formatPrice = usePriceFormatter(locale);
  const discount = Math.round((1 - box.salePrice / box.originalPrice) * 100);
  const name = boxName(box, locale);
  const address = storeAddress(store, locale);
  const soldOut = available < 1;
  return (
    <SurfaceCard data-testid="marketplace-box-card" tone={soldOut ? 'muted' : 'panel'} className="relative overflow-hidden transition" data-sold-out={soldOut || undefined}>
      <CardPressable
        onClick={onOpen}
        disabled={soldOut}
        aria-label={`${t('details')}: ${name}, ${store.name}`}
        className="group overflow-hidden rounded-card disabled:cursor-default"
      >
        <span className={`relative block h-44 overflow-hidden bg-canvas ${soldOut ? 'opacity-55 grayscale' : ''}`}>
          <img src={box.image} alt={name} className="h-full w-full object-cover transition duration-[var(--motion-slow)] group-hover:scale-[1.03] group-disabled:scale-100" />
          <span aria-hidden="true" className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-brand-deep/55 to-transparent" />
          <MediaBadge className="absolute bottom-3 left-3 border-3 border-panel">
            <img src={store.logo} alt="" className="h-9 w-9 object-contain" />
          </MediaBadge>
          {box.type === 'SURPRISE' && <span className="absolute bottom-3 right-3"><SurpriseBadge compact /></span>}
        </span>
        <span className={`block p-4 ${soldOut ? 'text-ink-muted' : ''}`}>
          <span className="block pr-1 text-xs font-extrabold text-brand">{store.name}</span>
          <CardTitle tone={soldOut ? 'muted' : 'default'} className="mt-1 min-w-0">{name}</CardTitle>
          <span className="mt-2 flex items-start gap-1.5 text-xs font-medium text-ink-muted"><MapPin size={14} className="mt-0.5 shrink-0 text-brand-hover" /><span>{address}</span></span>
          <span className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-bold text-ink-secondary">
            <span className="flex items-center gap-1.5"><Clock3 size={14} className="shrink-0 text-brand" />{box.pickupFrom}–{box.pickupTo}</span>
            <span className={`flex items-center gap-1.5 ${soldOut ? 'font-extrabold text-danger' : 'text-brand'}`}><Package size={14} className="shrink-0" />{soldOut ? t('boxesSoldOut') : formatBoxesLeft(available, locale)}</span>
          </span>
          <span className="mt-4 flex flex-wrap items-center gap-2 border-t border-border/80 pt-3">
            <b className={`text-xl leading-none ${soldOut ? 'text-ink-muted' : 'text-brand-hover'}`}>{formatPrice(box.salePrice)}</b>
            <span className="text-xs text-ink-muted line-through">{formatPrice(box.originalPrice)}</span>
            <StatusBadge tone={soldOut ? 'neutral' : 'accentSolid'} size="sm">−{discount}%</StatusBadge>
          </span>
        </span>
      </CardPressable>
      {!soldOut && (
        <IconButton
          onClick={toggleFavorite}
          label={`${t('favorites')}: ${name}`}
          aria-pressed={favorite}
          tone={favorite ? 'floatingAccent' : 'floating'}
          className="absolute right-3 top-3 z-20"
        ><Heart size={19} fill={favorite ? 'currentColor' : 'none'} /></IconButton>
      )}
    </SurfaceCard>
  );
}

function SurpriseBadge({ compact = false }: { compact?: boolean }) {
  return (
    <span
      data-surprise-variant={compact ? 'compact' : 'default'}
      className={`inline-flex shrink-0 items-center rounded-full border border-brand/20 bg-highlight font-black tracking-[0.08em] text-brand-deep shadow-card ${compact ? 'min-h-6 gap-1 px-2 py-1 text-[9px]' : 'min-h-8 gap-1.5 px-2.5 py-1.5 text-[10px]'}`}
    >
      <SurpriseBoxIcon compact={compact} />
      SURPRISE
    </span>
  );
}

function SurpriseBoxIcon({ compact }: { compact: boolean }) {
  return (
    <svg
      data-testid="surprise-box-icon"
      aria-hidden="true"
      viewBox="0 0 18 18"
      fill="none"
      className={compact ? 'h-3.5 w-3.5' : 'h-4 w-4'}
    >
      <path d="M3.25 7.5 9 10.5l5.75-3M3.75 8.75v4.75L9 16l5.25-2.5V8.75M9 10.5V16" stroke="currentColor" strokeWidth="1.55" strokeLinecap="round" strokeLinejoin="round" />
      <path d="m3.25 7.5 2.5-2.25L9 7l3.25-1.75 2.5 2.25L9 10.5 3.25 7.5Z" fill="currentColor" fillOpacity=".12" stroke="currentColor" strokeWidth="1.55" strokeLinejoin="round" />
      <path d="M14.25 1.5v3M12.75 3h3" stroke="currentColor" strokeWidth="1.55" strokeLinecap="round" />
    </svg>
  );
}

function FavoritesTab({ t, locale, favoriteBoxIds, toggleFavoriteBox, openBox, purchasedBoxQuantities }: { t: Translator; locale: Locale; favoriteBoxIds: string[]; toggleFavoriteBox: (id: string) => void; openBox: (box: Box) => void; purchasedBoxQuantities: Record<string, number> }) {
  const favoriteBoxes = boxes.filter((box) => favoriteBoxIds.includes(box.id));
  return (
    <PageSection title={t('favorites')}>
      {favoriteBoxes.length === 0 ? (
        <EmptyState icon={<Heart size={34} />} title={t('noFavorites')} description={t('noFavoritesText')} tone="accent" />
      ) : (
        <div className="mt-6 space-y-4">
          {favoriteBoxes.map((box) => (
            <MarketplaceBoxCard
              key={box.id}
              box={box}
              store={storeById(box.storeId)}
              t={t}
              locale={locale}
              favorite
              toggleFavorite={() => toggleFavoriteBox(box.id)}
              onOpen={() => openBox(box)}
              available={availableQuantity(box, purchasedBoxQuantities)}
            />
          ))}
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

function OrdersTab({ t, locale, orders, onBrowseOffers }: { t: Translator; locale: Locale; orders: Order[]; onBrowseOffers: () => void }) {
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
        >
          <PrimaryButton onClick={onBrowseOffers}>{t('browseOffers')}</PrimaryButton>
        </EmptyState>
      ) : (
        <div className="mt-5 space-y-3">
          {visibleOrders.map((order) => {
            const store = stores.find((item) => item.id === order.storeId);
            const orderDate = formatOrderDate(order.createdAt, locale);
            const pickupWindow = orderPickupWindow(order);
            const isActive = view === 'active';
            return (
              <SurfaceCard key={order.id} data-order-status={order.status} className="overflow-hidden">
                <div className="p-4">
                  <div className="flex items-start gap-3">
                    {store && <MediaBadge><img src={store.logo} alt="" className="h-9 w-9 object-contain" /></MediaBadge>}
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="truncate text-sm font-extrabold text-ink">{store?.name}</p>
                        <StatusBadge tone={isActive ? 'brand' : 'neutral'} icon={isActive ? <Clock3 size={12} /> : <CheckCircle2 size={12} />}>
                          {t(isActive ? 'activeOrderStatus' : 'completedOrderStatus')}
                        </StatusBadge>
                      </div>
                      <p className="mt-1 text-[11px] font-semibold text-ink-subtle">{t('orderId')}: {formatOrderId(order.id)}</p>
                    </div>
                  </div>

                  {isActive ? (
                    <div data-testid="active-order-pickup" className="mt-4 flex flex-wrap items-center justify-between gap-x-3 gap-y-1 text-xs font-bold">
                      <span className="flex items-center gap-2 text-brand"><Clock3 size={16} />{t('pickupToday')} · {pickupWindow}</span>
                      <span className="flex items-center gap-2 text-ink-muted"><CalendarDays size={16} />{orderDate}</span>
                    </div>
                  ) : (
                    <div className="mt-4 flex items-center gap-2 text-xs font-bold text-ink-muted"><CalendarDays size={16} />{orderDate}</div>
                  )}

                  <div className="mt-4 space-y-2">
                    {order.items.map((item) => {
                      const box = boxes.find((candidate) => candidate.id === item.boxId);
                      return (
                        <div key={item.boxId} className="flex items-center justify-between gap-3 text-xs">
                          <span className="min-w-0 truncate font-bold text-ink-secondary">{box ? boxName(box, locale) : ''}</span>
                          <span className="shrink-0 font-bold text-ink-muted">{formatPrice(item.unitPrice)} × {item.quantity}</span>
                        </div>
                      );
                    })}
                  </div>
                  <div className="mt-4 flex items-center justify-between border-t border-border pt-4"><span className="text-xs font-bold text-ink-muted">{t('total')}</span><b className="text-lg text-brand">{formatPrice(order.total)}</b></div>
                </div>

                {isActive && (
                  <div className={`grid gap-2 border-t border-border bg-surface-soft p-3 ${store ? 'grid-cols-2' : 'grid-cols-1'}`}>
                    <PrimaryButton size="md" onClick={() => { setSelectedOrder(order); haptic('tap'); }}>{t('showQr')}</PrimaryButton>
                    {store && <SecondaryButton size="md" onClick={() => { setRouteStore(store); haptic('tap'); }}>{t('buildRoute')}</SecondaryButton>}
                  </div>
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
      <p className="text-xs font-bold text-white/70">{label}</p>
      <p className="mt-1 text-3xl font-black tracking-[0.12em]">{formatPickupCode(pickupCode)}</p>
    </InsetSurface>
  );
}

function OrderItemsList({ order, locale }: { order: Order; locale: Locale }) {
  const formatPrice = usePriceFormatter(locale);
  return (
    <div className="space-y-3">
      {order.items.map((item) => {
        const box = boxes.find((candidate) => candidate.id === item.boxId);
        return (
          <InsetSurface key={item.boxId} tone="panel" radius="card" className="flex items-center gap-3 p-3">
            {box && <img src={box.image} alt="" className="h-14 w-14 shrink-0 rounded-control object-cover" />}
            <div className="min-w-0 flex-1"><p className="truncate text-sm font-black">{box ? boxName(box, locale) : ''}</p><p className="mt-1 text-xs text-ink-muted">{formatPrice(item.unitPrice)} × {item.quantity}</p></div>
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
  const orderDate = formatOrderDate(order.createdAt, locale);
  const isActive = order.status === 'paid';
  if (isActive) {
    return (
      <DialogLayer onClose={onClose} closeLabel={t('close')} ariaLabel={t('showQr')} sheetHeight="medium">
        <ModalBody className="flex h-full min-h-0 flex-col overflow-hidden">
          <SheetHeader title={t('showQr')} onClose={onClose} closeLabel={t('close')} />
          <ScrollArea className="flex-1 pb-2 text-center">
            <div className="mt-6"><OrderQr order={order} t={t} /></div>
            <p className="mx-auto mt-5 max-w-[300px] text-sm leading-6 text-ink-secondary">{t('successText')}</p>
            <PickupCodePanel pickupCode={order.pickupCode} label={t('pickupCode')} className="mt-5" />
          </ScrollArea>
        </ModalBody>
      </DialogLayer>
    );
  }
  return (
    <DialogLayer onClose={onClose} closeLabel={t('close')} ariaLabel={t('orderDetails')} sheetHeight="tall">
      <ModalBody className="flex h-full min-h-0 flex-col overflow-hidden pb-0">
        <SheetHeader title={t('orderDetails')} onClose={onClose} closeLabel={t('close')} />
        <ScrollArea className="flex-1 pb-5">
          <InsetSurface tone="brand" radius="card" className="mt-4 p-4">
            <div className="flex items-center gap-3">
              {store && <MediaBadge><img src={store.logo} alt="" className="h-9 w-9 object-contain" /></MediaBadge>}
              <div className="min-w-0 flex-1"><p className="truncate text-base font-extrabold">{store?.name}</p><p className="mt-1 text-xs font-bold text-ink-muted">{t('orderId')}: {formatOrderId(order.id)}</p></div>
              <StatusBadge tone="neutral">{t('completedOrderStatus')}</StatusBadge>
            </div>
            <div className="mt-4 flex items-center gap-2 border-t border-brand/10 pt-3 text-xs font-bold text-ink-secondary"><CalendarDays size={15} />{orderDate}</div>
          </InsetSurface>

          <SectionTitle className="mt-7 text-base">{t('orderContents')}</SectionTitle>
          <div className="mt-3"><OrderItemsList order={order} locale={locale} /></div>
          <InsetSurface radius="card" className="mt-4 flex items-center justify-between p-4"><span className="text-sm font-bold text-ink-muted">{t('total')}</span><b className="text-xl text-brand">{formatPrice(order.total)}</b></InsetSurface>
        </ScrollArea>
      </ModalBody>
    </DialogLayer>
  );
}

function ProfileTab({ t, profile, currency, currencyLoading, currencyRateError, onToggleCurrency, openSettings, openHelp, openDocuments, resetDemo }: {
  t: Translator; profile: UserProfile; currency: Currency; currencyLoading: boolean; currencyRateError: boolean;
  onToggleCurrency: () => void; openSettings: () => void; openHelp: () => void; openDocuments: () => void; resetDemo: () => void;
}) {
  const telegramUsername = telegramProfile().username.trim().replace(/^@/, '');
  const firstName = localizedFirstName(profile, t);
  const fullName = [firstName, DEMO_FALLBACK_NAMES.has(profile.firstName.trim()) ? undefined : profile.lastName].filter(Boolean).join(' ');
  const [resetConfirmationOpen, setResetConfirmationOpen] = useState(false);
  return (
    <section className="min-h-full bg-canvas pb-8">
      <BrandHeader>
        <div aria-hidden="true" className="absolute -right-12 -top-12 h-44 w-44 rounded-full bg-brand-hover" />
        <div className="relative flex items-center gap-4">
          <ProfileAvatar key={profile.photoUrl ?? 'fallback-avatar'} profile={profile} fallbackName={firstName} />
          <div><ContentTitle as="h1" tone="inverse">{fullName}</ContentTitle><p className="mt-1 text-sm text-white/70">{telegramUsername ? `@${telegramUsername}` : 'Telegram'}</p></div>
        </div>
      </BrandHeader>

      <ScreenBody>
        <SectionTitle className="mb-3">{t('profile')}</SectionTitle>
        <div className="space-y-3">
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
          icon={<RotateCcw size={24} />}
          tone="danger"
          onCancel={() => setResetConfirmationOpen(false)}
          onConfirm={resetDemo}
        />
      )}
    </section>
  );
}

function ProfileAvatar({ profile, fallbackName, compact = false }: { profile: UserProfile; fallbackName: string; compact?: boolean }) {
  const [imageFailed, setImageFailed] = useState(false);
  const [reloadAttempt, setReloadAttempt] = useState(0);
  const initial = fallbackName.trim().charAt(0).toUpperCase() || 'A';
  const photoSource = profile.photoUrl
    ? reloadAttempt === 0 ? profile.photoUrl : avatarRetryUrl(profile.photoUrl, reloadAttempt)
    : undefined;

  const retryImage = () => {
    if (reloadAttempt < 2) setReloadAttempt((attempt) => attempt + 1);
    else setImageFailed(true);
  };

  return (
    <AvatarFrame size={compact ? 'sm' : 'lg'}>
      {photoSource && !imageFailed
        ? <img src={photoSource} alt="" referrerPolicy="no-referrer" className="h-full w-full object-cover" onError={retryImage} />
        : initial}
    </AvatarFrame>
  );
}

function PhoneEditor({ currentPhone, t, onClose, onSave }: {
  currentPhone?: string; t: Translator; onClose: () => void; onSave: (phone: string) => void;
}) {
  const [value, setValue] = useState(formatKazakhstanPhoneInput(currentPhone ?? '+7'));
  const normalizedPhone = normalizeKazakhstanPhone(value);
  const showError = value.replace(/\D/g, '').length > 1 && !normalizedPhone;

  return (
    <DialogLayer className="z-[1200]" onClose={onClose} closeLabel={t('close')} ariaLabel={t('changePhone')} sheetHeight="medium">
      <form className="flex h-full min-h-0 flex-col" onSubmit={(event) => {
          event.preventDefault();
          if (normalizedPhone) onSave(normalizedPhone);
        }}>
        <ModalBody className="flex min-h-0 flex-1 flex-col pb-0">
          <SheetHeader title={t('changePhone')} onClose={onClose} closeLabel={t('close')} />
          <ScrollArea className="flex-1 pb-5">
            <NoticeCard className="mt-4" icon={<Phone size={20} />} title={t('phoneNumber')}>{t('phoneFormatHint')}</NoticeCard>
            <TextField label={t('phone')} required value={value} onValueChange={(phone) => setValue(formatKazakhstanPhoneInput(phone))}
              placeholder="+7 700 000 00 00" autoComplete="tel" type="tel" aria-invalid={showError} aria-describedby="phone-format-hint" />
            <p id="phone-format-hint" className={`mt-2 text-xs font-bold ${showError ? 'text-danger' : 'text-ink-muted'}`} role={showError ? 'alert' : undefined}>{showError ? t('invalidPhone') : t('phoneFormatHint')}</p>
            {normalizedPhone && <StatusBadge className="mt-4" tone="brand" icon={<Check size={12} />}>{t('phoneValid')}</StatusBadge>}
          </ScrollArea>
        </ModalBody>
        <StickyActionFooter><PrimaryButton type="submit" disabled={!normalizedPhone}>{t('savePhone')}<Check size={19} /></PrimaryButton></StickyActionFooter>
      </form>
    </DialogLayer>
  );
}

function ProfileRow({ icon, label, value, valueWrap = false, onClick, className, density = 'default' }: {
  icon: React.ReactNode;
  label: string;
  value?: string;
  valueWrap?: boolean;
  onClick?: () => void;
  className?: string;
  density?: 'default' | 'compact';
}) {
  return (
    <ListRow
      icon={icon}
      title={label}
      subtitle={value}
      subtitleWrap={valueWrap}
      onClick={onClick}
      disabled={!onClick}
      trailing={onClick ? <ChevronRight size={17} className="text-ink-subtle" /> : undefined}
      className={className}
      density={density}
    />
  );
}

function CartDock({ items, locale, t, onOpen }: { items: CartItem[]; locale: Locale; t: Translator; onOpen: () => void }) {
  const formatPrice = usePriceFormatter(locale);
  const lines = items.flatMap((item) => {
    const box = boxes.find((candidate) => candidate.id === item.boxId);
    return box ? [{ box, quantity: item.quantity }] : [];
  });
  const total = lines.reduce((sum, line) => sum + line.box.salePrice * line.quantity, 0);
  const quantity = lines.reduce((sum, line) => sum + line.quantity, 0);
  return (
    <StickyActionFooter data-testid="cart-dock" density="compact" className="z-[700]">
      <PrimaryButton size="md" onClick={onOpen} aria-label={`${t('cart')}, ${formatPrice(total)}`}>
        <span>{t('cart')} · {quantity}</span>
        <span className="ml-auto">{formatPrice(total)}</span>
      </PrimaryButton>
    </StickyActionFooter>
  );
}

function BottomNav({ tab, setTab, t }: { tab: Tab; setTab: (tab: Tab) => void; t: Translator }) {
  const items: { id: Tab; icon: React.ReactNode; label: CopyKey }[] = [
    { id: 'home', icon: <Home size={21} />, label: 'home' },
    { id: 'orders', icon: <ShoppingBag size={21} />, label: 'ordersNav' },
    { id: 'favorites', icon: <Heart size={21} />, label: 'favoritesNav' },
    { id: 'profile', icon: <UserRound size={21} />, label: 'profile' },
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
        <SheetHeader title={t('settings')} onClose={onClose} closeLabel={t('close')} />
        <div className="pb-1">
          <SectionTitle className="mt-4 text-base">{t('accountDetails')}</SectionTitle>
          <div className="mt-3"><ProfileRow icon={<Phone size={18} />} label={t('phoneNumber')} value={phone ? formatKazakhstanPhoneInput(phone) : undefined} onClick={onEditPhone} /></div>
          <SectionTitle className="mt-6 text-base">{t('languageChoice')}</SectionTitle>
          <div className="mt-3"><SegmentedControl value={locale} label={t('languageChoice')} items={[{ value: 'ru', label: t('russianLanguage') }, { value: 'kk', label: t('kazakhLanguage') }]} onChange={(nextLocale) => { if (nextLocale !== locale) { setLocale(nextLocale); haptic('tap'); } }} /></div>
        </div>
      </ModalBody>
    </DialogLayer>
  );
}

function BoxDetails({ box, locale, t, cartQuantity, available, onChangeQuantity, onClose }: {
  box: Box; locale: Locale; t: Translator; cartQuantity: number; available: number;
  onChangeQuantity: (quantity: number) => void; onClose: () => void;
}) {
  const formatPrice = usePriceFormatter(locale);
  const discount = Math.round((1 - box.salePrice / box.originalPrice) * 100);
  const name = boxName(box, locale);
  const store = storeById(box.storeId);
  const address = storeAddress(store, locale);
  const allergens = boxAllergens(box, locale);
  const [routePickerOpen, setRoutePickerOpen] = useState(false);
  const [selectedQuantity, setSelectedQuantity] = useState(() =>
    Math.min(Math.max(cartQuantity, 1), Math.max(available, 1)),
  );
  return (
    <DialogLayer onClose={onClose} closeLabel={t('close')} ariaLabel={name} sheetHeight="tall">
      <div data-testid="box-details-sheet" className="flex h-full min-h-0 flex-col">
        <ScrollArea data-testid="box-details-scroll" className="flex-1">
          <MediaSheetHeader data-testid="box-details-cover" onClose={onClose} closeLabel={t('close')}>
            <img src={box.image} alt={name} className="h-full w-full object-cover" />
          </MediaSheetHeader>
          <div data-testid="box-details-content" className="relative z-10 -mt-5 rounded-t-sheet bg-surface px-page pb-6 pt-6 sm:px-page-wide">
            <div className="mb-3 flex items-center gap-2.5 text-sm font-extrabold text-ink">
              <MediaBadge size="sm"><img src={store.logo} alt="" className="h-7 w-7 object-contain" /></MediaBadge>
              <span className="min-w-0 truncate">{store.name}</span>
            </div>
            <PageTitle>{name}</PageTitle>
            {box.type === 'SURPRISE' && <div className="mt-3"><SurpriseBadge /></div>}

            <InsetSurface data-testid="box-store-summary" tone="panel" className="mt-4 overflow-hidden p-0 shadow-card">
              <div className="flex items-start gap-2.5 p-3.5 text-sm font-bold text-ink-secondary">
                <MapPin size={17} className="mt-0.5 shrink-0 text-brand-hover" />
                <span>{address}</span>
              </div>
              <CardActionButton onClick={() => { setRoutePickerOpen(true); haptic('tap'); }}>
                {t('buildRoute')}
              </CardActionButton>
            </InsetSurface>

            <div data-testid="box-price-card" className="mt-4 flex flex-wrap items-end justify-between gap-2 border-b border-border pb-4">
              <div><p className="text-[11px] font-black uppercase tracking-[0.08em] text-ink-secondary">{t('boxPrice')}</p><p className="mt-1 whitespace-nowrap text-[30px] font-black tracking-[-0.04em] text-brand-hover">{formatPrice(box.salePrice)}</p></div>
              <div className="mb-1 flex items-center gap-2"><span className="text-xs font-semibold text-ink-muted line-through">{formatPrice(box.originalPrice)}</span><StatusBadge tone="accentSolid" size="sm">−{discount}%</StatusBadge></div>
            </div>

            <div data-testid="box-commerce-summary" className="mt-3 grid grid-cols-2 gap-2">
              <InsetSurface data-testid="box-pickup-time" className="min-w-0 p-3">
                <p className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.05em] text-ink-secondary"><Clock3 size={13} className="shrink-0 text-brand" />{t('pickupTime')}</p>
                <p className="mt-2 whitespace-nowrap text-sm font-black tracking-[-0.02em] text-ink">{box.pickupFrom}–{box.pickupTo}</p>
              </InsetSurface>
              <InsetSurface className="min-w-0 p-3">
                <p className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.05em] text-ink-secondary"><Package size={13} className="shrink-0 text-brand" />{t('offersLabel')}</p>
                <p data-testid="box-stock" className={`mt-2 text-xs font-black ${available > 0 ? 'text-brand' : 'text-danger'}`}>{formatBoxesLeft(available, locale)}</p>
              </InsetSurface>
            </div>

            <div data-testid="box-appearance-notice" className="mt-4 flex items-center gap-2.5 rounded-control bg-brand-pale/55 px-3 py-2.5 text-xs leading-5 text-ink-secondary">
              <ImageIcon size={16} className="shrink-0 text-brand" />
              <strong className="font-extrabold text-brand">{t('appearanceMayDifferTitle')}.</strong>
            </div>

            {box.type === 'SURPRISE' ? (
              <>
                <SectionTitle className="mt-6">{t('surprisePossibleTitle')}</SectionTitle>
                <p className="mt-2 text-sm leading-6 text-ink-secondary">{t('surprisePossibleContents')}</p>
                <NoticeCard data-testid="surprise-composition-notice" className="mt-4" icon={<Package size={19} />} title={t('surpriseNoticeTitle')}>{t('surprise')}</NoticeCard>
              </>
            ) : (
              <>
                <SectionTitle className="mt-6">{t('composition')}</SectionTitle>
                <ul className="mt-2 divide-y divide-border border-y border-border" data-testid="box-contents">
                  {box.contents?.map((item) => (
                    <li key={item.contentName} className="flex items-center justify-between gap-4 py-3 text-sm">
                      <span className="font-bold text-ink">{boxContentName(item, locale)}</span>
                      <span className="shrink-0 rounded-full bg-brand-pale px-2.5 py-1 text-xs font-black text-brand">× {item.quantity}</span>
                    </li>
                  ))}
                </ul>
              </>
            )}
            <InsetSurface data-testid="box-allergens" tone="danger" radius="card" className="mt-5 flex items-start gap-2.5 p-4 text-sm leading-6">
              <AlertTriangle size={18} className="mt-0.5 shrink-0 text-danger" />
              <div><h2 className="font-extrabold text-danger">{allergens ? t('containsAllergens') : t('allergens')}</h2><p className="mt-1">{allergens ?? t('allergensUnknown')}</p></div>
            </InsetSurface>
          </div>
        </ScrollArea>
        {(available > 0 || cartQuantity > 0) && (
          <StickyActionFooter>
            <div className="grid grid-cols-[7rem_minmax(0,1fr)] items-center gap-2">
              <QuantityStepper quantity={selectedQuantity} min={1} max={Math.max(available, cartQuantity)}
                label={t('quantity')} onChange={setSelectedQuantity} />
              <PrimaryButton size="md" className="whitespace-nowrap px-2 text-center text-[13px]" onClick={() => {
                onChangeQuantity(selectedQuantity);
                onClose();
              }}
                aria-label={`${t('addToCartFull')} ${name}`}>
                {t('addToCartFull')}
              </PrimaryButton>
            </div>
          </StickyActionFooter>
        )}
        {routePickerOpen && <RoutePicker lat={store.lat} lng={store.lng} t={t} onClose={() => setRoutePickerOpen(false)} />}
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
  const options = getRouteOptions(lat, lng, true);
  return (
    <DialogLayer onClose={onClose} closeLabel={t('close')} ariaLabel={t('chooseMap')} className="z-[1200]" sheetHeight="medium">
      <ModalBody className="flex h-full min-h-0 flex-col pt-4">
        <SheetHeader title={t('chooseMap')} onClose={onClose} closeLabel={t('close')} />
        <ScrollArea className="mt-4 flex-1 pb-1">
          <div className="space-y-3">
            {options.map((option) => (
              <ListRow
                key={option.id}
                icon={<img src={routeProviderLogo[option.id]} alt="" className="h-10 w-10 rounded-control object-cover" />}
                title={option.label}
                tone="panel"
                className="min-h-19"
                trailing={<span className="flex items-center gap-1 text-xs font-extrabold text-brand">{t('openInMap')}<ArrowUpRight size={16} /></span>}
                onClick={() => { openExternalLink(option.url); haptic('tap'); }}
              />
            ))}
          </div>
        </ScrollArea>
      </ModalBody>
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
    <DialogLayer onClose={onClose} closeLabel={t('close')} ariaLabel={t('cart')} sheetHeight="tall">
      <ModalBody className="flex h-full min-h-0 flex-col overflow-hidden">
        <SheetHeader className="pb-3" title={t('cart')} onClose={onClose} closeLabel={t('close')} />
        <ScrollArea data-testid="cart-scroll" className="flex flex-1 flex-col pb-1">
        {lines.length === 0 ? (
          <EmptyState icon={<ShoppingBag size={32} />} title={t('cartEmpty')} />
        ) : (
          <div className="mt-2 space-y-3">
            {lines.map(({ box, quantity }) => (
              <InsetSurface key={box.id} tone="panel" className="overflow-hidden p-3">
                <div className="flex items-center gap-3">
                  <span aria-hidden="true" className="h-18 w-18 shrink-0 overflow-hidden rounded-control"><img src={box.image} alt="" className="h-full w-full object-cover" /></span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-bold text-brand">{storeById(box.storeId).name}</p>
                    <p className="mt-0.5 truncate text-sm font-extrabold">{boxName(box, locale)}</p>
                    <p className="mt-1.5 text-base font-extrabold text-brand-hover">{formatPrice(box.salePrice * quantity)}</p>
                  </div>
                </div>
                <div className="mt-3 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2 border-t border-border pt-3">
                  <QuantityControl quantity={quantity} max={availableQuantity(box, purchasedBoxQuantities)} label={t('quantity')}
                    addLabel={`${t('addToCart')} ${boxName(box, locale)}`} addText={t('addToCart')} onChange={(next) => onChangeQuantity(box, next)} />
                  <TertiaryButton tone="danger" onClick={() => onChangeQuantity(box, 0)}>{t('removeFromCart')}</TertiaryButton>
                </div>
              </InsetSurface>
            ))}
          </div>
        )}
        <div className="my-5 h-px shrink-0 bg-border" />
        <div className="flex shrink-0 items-end justify-between"><span className="text-sm font-bold text-ink-secondary">{t('total')}</span><span className="text-2xl font-black" aria-live="polite">{formatPrice(total)}</span></div>
        <PrimaryButton onClick={() => void onPay()} disabled={lines.length === 0 || paymentPending} aria-busy={paymentPending} className="mt-5 shrink-0">
          {paymentPending ? t('paymentProcessing') : t('checkoutCart')}
        </PrimaryButton>
        <p className="mt-auto shrink-0 pt-3 text-center text-xs leading-5 text-ink-muted">
          {t('checkoutOfferPrefix')}{' '}
          <TextLinkButton onClick={onOpenOffer}>{t('checkoutOfferLink')}</TextLinkButton>
          {' '}{t('checkoutOfferBetween')}{' '}
          <TextLinkButton onClick={onOpenOrderRules}>{t('checkoutRulesLink')}</TextLinkButton>
          {t('checkoutOfferSuffix') ? ` ${t('checkoutOfferSuffix')}` : ''}
        </p>
        </ScrollArea>
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
        tone="coral"
        className="relative overflow-hidden"
        icon={<><AlganMark className="h-9 w-9" /><AlertTriangle className="absolute -right-2 -top-2 rounded-full bg-surface p-1 text-accent-strong shadow-control" size={24} strokeWidth={2.5} /></>}
        title={t('paymentFailedTitle')}
        description={t('paymentFailedText')}
      >
        <PrimaryButton onClick={onBackToCart} className="mx-auto mt-6 w-full max-w-[330px]">{t('backToCart')}</PrimaryButton>
      </FullScreenFeedback>
    </DialogLayer>
  );
}

function Success({ order, t, onDone }: { order: Order; t: Translator; onDone: () => void }) {
  return (
    <DialogLayer onClose={onDone} closeLabel={t('close')} ariaLabel={t('ordersCreated')} variant="full">
      <FullScreenFeedback
        icon={<><AlganMark className="h-10 w-10" /><Sparkles className="absolute -right-2 -top-1 text-accent-strong" size={20} /></>}
        title={t('ordersCreated')}
        description={t('successText')}
      >
        <div className="mt-5"><OrderQr order={order} t={t} /></div>
        <PickupCodePanel pickupCode={order.pickupCode} label={t('pickupCode')} className="mx-auto mt-4 w-full max-w-[320px] p-3" />
        <p className="mt-4 text-xs font-bold text-ink-muted">{t('orderId')}: {formatOrderId(order.id)}</p>
        <PrimaryButton onClick={onDone} className="mt-6 shrink-0">{t('toOrders')}</PrimaryButton>
      </FullScreenFeedback>
    </DialogLayer>
  );
}

function DocumentsModal({ t, locale, subject, onClose }: { t: Translator; locale: Locale; subject: LegalSubject; onClose: () => void }) {
  const [selectedView, setSelectedView] = useState<LegalInformationView | null>(null);
  const documents: { type: LegalDocument; icon: React.ReactNode }[] = [
    { type: 'terms', icon: <FileText size={18} /> },
    { type: 'personalDataConsent', icon: <FileCheck2 size={18} /> },
    { type: 'privacy', icon: <ShieldCheck size={18} /> },
    { type: 'orderRules', icon: <ShoppingBag size={18} /> },
    { type: 'publicOffer', icon: <ReceiptText size={18} /> },
  ];
  const title = selectedView === 'contacts'
    ? t('contacts')
    : selectedView ? t(LEGAL_TITLE_KEYS[selectedView]) : t('legal');

  return (
    <DialogLayer onClose={onClose} closeLabel={t('close')} ariaLabel={t('legal')} sheetHeight="tall">
      <ModalBody className="flex h-full min-h-0 flex-col overflow-hidden">
        <SheetHeader
          data-testid="documents-modal-header"
          className="pb-3"
          title={title}
          onBack={selectedView ? () => setSelectedView(null) : undefined}
          backLabel={t('back')}
          onClose={onClose}
          closeLabel={t('close')}
        />
        <ScrollArea data-testid="documents-modal-scroll" className="flex-1 pb-4">
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
            <>
              <SectionTitle className="mt-4 text-base">{t('agreements')}</SectionTitle>
              <div className="mt-3 space-y-2">
                {documents.map((document) => (
                  <ProfileRow density="compact" key={document.type} icon={document.icon} label={t(LEGAL_TITLE_KEYS[document.type])} onClick={() => setSelectedView(document.type)} />
                ))}
              </div>
              <SectionTitle className="mt-4 text-base">{t('companyInformation')}</SectionTitle>
              <div className="mb-1 mt-2"><ProfileRow density="compact" icon={<Building2 size={18} />} label={t('contacts')} onClick={() => setSelectedView('contacts')} /></div>
            </>
          )}
        </ScrollArea>
      </ModalBody>
    </DialogLayer>
  );
}

function CompanyContacts({ t }: { t: Translator }) {
  return (
    <div className="mt-4 space-y-3">
      <InsetSurface tone="brandSolid" radius="card" className="relative overflow-hidden p-5 text-sm">
        <div aria-hidden="true" className="absolute -right-8 -top-10 h-28 w-28 rounded-full bg-brand-hover" />
        <div className="relative"><AlganLogo light markClassName="h-8 w-8" wordmarkClassName="h-6 w-[73px]" /><SectionTitle tone="inverse" className="mt-5">{t('companyName')}</SectionTitle><p className="mt-1 font-bold text-white/70">{t('companyId')}</p></div>
      </InsetSurface>
      <InsetSurface tone="panel" radius="card" className="p-4"><p className="text-xs font-black uppercase tracking-[.06em] text-ink-muted">{t('contactLegalAddressLabel')}</p><p className="mt-2 text-sm leading-6 text-ink">{t('companyAddress')}</p></InsetSurface>
      <LinkRow tone="panel" href="mailto:algansupport@gmail.com" icon={<Mail size={18} />} title={t('emailLabel')} subtitle="algansupport@gmail.com" trailing={<ArrowUpRight size={17} className="text-ink-subtle" />} />
      <LinkRow tone="panel" href="tel:+77059768000" icon={<Phone size={18} />} title={t('contactPhoneLabel')} subtitle="+7 705 976 80 00" trailing={<ArrowUpRight size={17} className="text-ink-subtle" />} />
    </div>
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
    <DialogLayer onClose={onClose} closeLabel={t('close')} ariaLabel={t('support')} sheetHeight="tall">
      <ModalBody className="flex h-full min-h-0 flex-col overflow-hidden">
        <SheetHeader
          className="pb-3"
          title={title}
          onBack={view !== 'menu' ? () => setView('menu') : undefined}
          backLabel={t('back')}
          onClose={onClose}
          closeLabel={t('close')}
        />

        <ScrollArea className="flex-1 pb-1">
          {view === 'menu' && (
            <>
              <InsetSurface tone="brandSolid" radius="card" className="relative mt-3 overflow-hidden p-5 text-white">
                <div aria-hidden="true" className="absolute -right-8 -top-12 h-32 w-32 rounded-full bg-brand-hover" />
                <span className="relative grid h-12 w-12 place-items-center rounded-[16px] bg-highlight text-brand"><Headphones size={23} /></span>
                <p className="relative mt-5 text-xl font-extrabold tracking-[-0.025em] text-white">{t('support')}</p>
                <p className="relative mt-2 text-sm leading-6 text-white/75">{t('supportIntro')}</p>
                <PrimaryButton
                  aria-label={`${t('contactSupport')}. ${t('workingHours')}`}
                  onClick={() => openTelegramLink(SUPPORT_TELEGRAM_URL)}
                  className="relative mt-5"
                  tone="highlight"
                >
                  <TelegramIcon />
                  <span>{t('contactSupport')}</span>
                </PrimaryButton>
                <p className="relative mt-3 text-center text-xs font-bold text-white/70">{t('workingHours')}</p>
              </InsetSurface>
              <div className="mt-4"><ProfileRow icon={<CircleHelp size={18} />} label={t('faq')} onClick={() => setView('faq')} /></div>
            </>
          )}

          {view === 'faq' && (
            <div className="mt-3">
              <div className="space-y-3">
              {faqItems.map((item, index) => {
                const expanded = openQuestion === index;
                return (
                  <AccordionItem key={item.question} title={<span className="flex items-start gap-3"><span aria-hidden="true" className="grid h-6 w-6 shrink-0 place-items-center rounded-[8px] bg-brand-pale text-[11px] font-black text-brand">{index + 1}</span><span>{t(item.question)}</span></span>} expanded={expanded} onToggle={() => setOpenQuestion(expanded ? null : index)}>
                    {t(item.answer)}
                  </AccordionItem>
                );
              })}
              </div>
            </div>
          )}
        </ScrollArea>
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
    <article className="mt-4 text-sm leading-7 text-ink-secondary" data-legal-document={type}>
      <InsetSurface tone="brand" radius="card" className="p-4">
        <div className="mb-3 flex items-center gap-2 border-b border-brand/10 pb-3 text-brand"><FileText size={18} /><span className="text-xs font-extrabold uppercase tracking-[.06em]">{t(LEGAL_TITLE_KEYS[type])}</span></div>
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

      <div className="mt-6 space-y-4 text-ink-secondary">
        {document.introduction.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
      </div>
      <div className="mt-7 space-y-0">
        {document.sections.map((section) => (
          <section key={section.heading} className="border-t border-border py-6 first:border-t-0 first:pt-0">
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
    <DialogLayer onClose={onClose} closeLabel={t('close')} ariaLabel={t(LEGAL_TITLE_KEYS[type])} sheetHeight="tall">
      <ModalBody className="flex h-full min-h-0 flex-col overflow-hidden">
        <SheetHeader data-testid="legal-modal-header" className="pb-3" title={t(LEGAL_TITLE_KEYS[type])} onClose={onClose} closeLabel={t('close')} />
        <ScrollArea data-testid="legal-modal-scroll" className="flex-1 pb-4">
          <LegalDocumentView type={type} t={t} locale={locale} subject={subject} />
          {!isPublishedLegalDocument(type) && <PrimaryButton onClick={onClose} className="mt-5">{t('back')}</PrimaryButton>}
        </ScrollArea>
      </ModalBody>
    </DialogLayer>
  );
}
