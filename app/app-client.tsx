'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { BoxDetails, CartDock, CartReplacementDialog, CartSheet, PaymentFailure, Success } from '@/components/algan/checkout';
import { FavoritesTab, HomeTab } from '@/components/algan/marketplace';
import { BottomNav } from '@/components/algan/navigation';
import { DocumentsModal, HelpModal, LegalModal } from '@/components/algan/legal-support';
import { LegalAcceptanceScreen, Onboarding, PhoneShell, Splash } from '@/components/algan/onboarding';
import { OrdersTab } from '@/components/algan/orders';
import { PriceProvider } from '@/components/algan/price-context';
import { PhoneEditor, ProfileTab, SettingsModal } from '@/components/algan/profile';
import type { LegalDocument, LegalSubject } from '@/components/algan/types';
import { useCurrencyRate, useDocumentLanguage, useMinimumSplashDelay, useTelegramRuntime } from '@/hooks/use-app-runtime';
import { availableQuantity } from '@/lib/app-utils';
import { createCheckoutOrder } from '@/lib/checkout';
import { createLegalAcceptance, hasCurrentLegalAcceptance } from '@/lib/legal-core';
import { boxes } from '@/lib/mock-data';
import { processPayment } from '@/lib/payment';
import { normalizeKazakhstanPhone } from '@/lib/phone';
import { useAppStore } from '@/lib/store';
import { getCopy } from '@/lib/translations';
import { haptic, setTelegramClosingConfirmation, telegramProfile } from '@/lib/telegram';
import type { Box, Currency } from '@/lib/types';

export { MINIMUM_SPLASH_MS } from '@/hooks/use-app-runtime';
export { avatarRetryUrl } from '@/lib/app-utils';

interface PendingCartReplacement {
  box: Box;
  quantity: number;
}

export default function AlganApp() {
  const {
    hydrated, onboardingDone, profile, legalAcceptance, locale, currency, tab, favoriteBoxIds, orders, cartStoreId, cartItems, purchasedBoxQuantities,
    completeOnboarding, acceptLegalDocuments, syncTelegramProfile, updatePhone, setLocale, setCurrency, setTab, toggleFavoriteBox,
    setCartItemQuantity, clearCart, completePurchase, cancelOrder, resetDemo,
  } = useAppStore();
  const t = useMemo(() => getCopy(locale), [locale]);
  const liveTelegramProfile = telegramProfile();
  const [phone, setPhone] = useState('+7');
  const [legal, setLegal] = useState<LegalDocument | null>(null);
  const [documentsOpen, setDocumentsOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [selectedBox, setSelectedBox] = useState<Box | null>(null);
  const [cartOpen, setCartOpen] = useState(false);
  const [pendingCartReplacement, setPendingCartReplacement] = useState<PendingCartReplacement | null>(null);
  const [purchaseSucceeded, setPurchaseSucceeded] = useState(false);
  const [paymentFailed, setPaymentFailed] = useState(false);
  const [paymentPending, setPaymentPending] = useState(false);
  const paymentPendingRef = useRef(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [editingPhone, setEditingPhone] = useState(false);
  const { rate: kztToRubRate, error: currencyRateError, toggleCurrency } = useCurrencyRate(currency, setCurrency);
  const minimumSplashElapsed = useMinimumSplashDelay();
  const mainScrollRef = useRef<HTMLElement>(null);
  const displayCurrency: Currency = currency === 'RUB' && kztToRubRate ? 'RUB' : 'KZT';
  const legalSubject: LegalSubject = {
    fullName: [
      liveTelegramProfile.firstName || profile.firstName,
      liveTelegramProfile.lastName || profile.lastName,
    ].filter(Boolean).join(' ').trim() || t('fallbackUser'),
    telegramId: liveTelegramProfile.telegramId ?? profile.telegramId,
    phone: onboardingDone ? profile.phone : normalizeKazakhstanPhone(phone) ?? (phone.length > 2 ? phone : undefined),
  };

  useTelegramRuntime(onboardingDone, syncTelegramProfile);
  useDocumentLanguage(locale);

  useEffect(() => {
    setTelegramClosingConfirmation(paymentPending);
    return () => {
      if (paymentPending) setTelegramClosingConfirmation(false);
    };
  }, [paymentPending]);

  useEffect(() => {
    if (mainScrollRef.current) mainScrollRef.current.scrollTop = 0;
  }, [tab]);

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

  const openBox = useCallback((box: Box) => {
    if (availableQuantity(box, purchasedBoxQuantities) < 1) return;
    haptic('tap');
    setSelectedBox(box);
  }, [purchasedBoxQuantities]);

  const applyCartQuantity = (box: Box, nextQuantity: number) => {
    const quantity = Math.min(Math.max(0, nextQuantity), availableQuantity(box, purchasedBoxQuantities));
    setCartItemQuantity(box.id, box.storeId, quantity);
    haptic(quantity > 0 ? 'tap' : 'success');
  };

  const changeCartQuantity = (box: Box, nextQuantity: number) => {
    if (nextQuantity > 0 && cartStoreId && cartStoreId !== box.storeId) {
      setPendingCartReplacement({ box, quantity: nextQuantity });
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
    const order = createCheckoutOrder({
      boxes,
      cartItems,
      cartStoreId,
      existingOrders: orders,
      purchasedBoxQuantities,
    });
    if (!order) return;
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
    setPurchaseSucceeded(true);
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
  return (
    <PriceProvider currency={displayCurrency} kztToRubRate={kztToRubRate}>
    <PhoneShell>
      <div className="algan-app-frame relative flex min-h-0 flex-col overflow-hidden bg-canvas">
        <main ref={mainScrollRef} className="hide-scrollbar min-h-0 flex-1 overflow-x-hidden overflow-y-auto overscroll-contain">
          {tab === 'home' && (
            <HomeTab
              t={t} locale={locale} profile={profile}
              favoriteBoxIds={favoriteBoxIds} toggleFavoriteBox={toggleFavoriteBox} openBox={openBox}
              purchasedBoxQuantities={purchasedBoxQuantities}
            />
          )}
          {tab === 'favorites' && (
            <FavoritesTab t={t} locale={locale} favoriteBoxIds={favoriteBoxIds} toggleFavoriteBox={toggleFavoriteBox} openBox={openBox} purchasedBoxQuantities={purchasedBoxQuantities} onBrowseOffers={() => setTab('home')} />
          )}
          {tab === 'orders' && <OrdersTab t={t} locale={locale} orders={orders} onCancelOrder={cancelOrder} onBrowseOffers={() => { setTab('home'); haptic('tap'); }} />}
          {tab === 'profile' && (
            <ProfileTab t={t} locale={locale} orders={orders} profile={profile} currency={currency}
              currencyLoading={currency === 'RUB' && !kztToRubRate} currencyRateError={currencyRateError} onToggleCurrency={toggleCurrency}
              openSettings={() => setSettingsOpen(true)}
              openHelp={() => setHelpOpen(true)}
              openDocuments={() => setDocumentsOpen(true)}
              resetDemo={resetDemo} />
          )}
        </main>
        {cartItems.length > 0 && !selectedBox && !cartOpen && (
          <CartDock items={cartItems} locale={locale} t={t} onOpen={() => setCartOpen(true)} />
        )}
        <BottomNav tab={tab} setTab={setTab} t={t} activeOrders={orders.filter((order) => order.status === 'paid').length} />
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
      {purchaseSucceeded && (
        <Success t={t} onDone={() => { setPurchaseSucceeded(false); setTab('orders'); }} />
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
    </PriceProvider>
  );
}
