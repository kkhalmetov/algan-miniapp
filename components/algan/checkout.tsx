'use client';
/* eslint-disable @next/next/no-img-element */

import { AlertTriangle, ArrowUpRight, CheckCircle2, Clock3, Image as ImageIcon, MapPin, Package, ShoppingBag, X } from '@/components/icons';
import type { ReactNode } from 'react';
import { useState } from 'react';
import { SurpriseBadge } from '@/components/algan/marketplace';
import { usePriceFormatter } from '@/components/algan/price-context';
import { RoutePicker } from '@/components/algan/route-picker';
import type { Translator } from '@/components/algan/types';
import { CardActionButton, ConfirmationDialog, DialogLayer, EmptyState, FullScreenFeedback, IconButton, InsetSurface, MediaBadge, MediaSheetHeader, ModalBody, NoticeCard, PageTitle, PrimaryButton, QuantityControl, QuantityStepper, ScrollArea, SectionTitle, SheetHeader, StatusBadge, StickyActionFooter, TertiaryButton, TextLinkButton } from '@/components/ui-kit';
import { availableQuantity } from '@/lib/app-utils';
import { boxAllergens, boxContentName, boxName, storeAddress } from '@/lib/catalog-localization';
import { boxes, storeById } from '@/lib/mock-data';
import { formatBoxesLeft } from '@/lib/stock';
import { haptic } from '@/lib/telegram';
import type { Box, CartItem, Locale } from '@/lib/types';
import { AlganLogo } from '@/components/algan-logo';

export function CartReplacementDialog({ t, onCancel, onConfirm }: { t: Translator; onCancel: () => void; onConfirm: () => void }) {
  return (
    <ConfirmationDialog
      className="z-[1400]"
      title={t('cartRuleTitle')}
      description={<><span className="block">{t('cartRuleText')}</span><span className="mt-2 block font-bold text-ink">{t('replaceCartConfirm')}</span></>}
      confirmLabel={t('replaceCartAction')}
      cancelLabel={t('keepCart')}
      closeLabel={t('close')}
      icon={<ShoppingBag size={24} />}
      tone="warning"
      showClose={false}
      onConfirm={onConfirm}
      onCancel={onCancel}
    />
  );
}

export function CartDock({ items, locale, t, onOpen }: { items: CartItem[]; locale: Locale; t: Translator; onOpen: () => void }) {
  const formatPrice = usePriceFormatter(locale);
  const lines = items.flatMap((item) => {
    const box = boxes.find((candidate) => candidate.id === item.boxId);
    return box ? [{ box, quantity: item.quantity }] : [];
  });
  const total = lines.reduce((sum, line) => sum + line.box.salePrice * line.quantity, 0);
  const quantity = lines.reduce((sum, line) => sum + line.quantity, 0);
  return (
    <StickyActionFooter data-testid="cart-dock" density="compact" className="z-[700]">
      <PrimaryButton onClick={onOpen} aria-label={`${t('cart')}, ${formatPrice(total)}`}>
        <span className="grid h-7 min-w-7 place-items-center rounded-[9px] bg-white/15 px-1 text-xs">{quantity}</span><span>{t('cart')}</span><span className="ml-auto tabular-nums">{formatPrice(total)}</span><ArrowUpRight size={18} />
      </PrimaryButton>
    </StickyActionFooter>
  );
}

export function BoxDetails({ box, locale, t, cartQuantity, available, onChangeQuantity, onClose }: {
  box: Box;
  locale: Locale;
  t: Translator;
  cartQuantity: number;
  available: number;
  onChangeQuantity: (quantity: number) => void;
  onClose: () => void;
}) {
  const formatPrice = usePriceFormatter(locale);
  const discount = Math.round((1 - box.salePrice / box.originalPrice) * 100);
  const name = boxName(box, locale);
  const store = storeById(box.storeId);
  const address = storeAddress(store, locale);
  const allergens = boxAllergens(box, locale);
  const [routePickerOpen, setRoutePickerOpen] = useState(false);
  const [selectedQuantity, setSelectedQuantity] = useState(() => Math.min(Math.max(cartQuantity, 1), Math.max(available, 1)));
  const selectedTotal = formatPrice(box.salePrice * selectedQuantity);
  return (
    <DialogLayer onClose={onClose} closeLabel={t('close')} ariaLabel={name} sheetHeight="tall">
      <div data-testid="box-details-sheet" className="relative flex h-full min-h-0 flex-col">
        <IconButton onClick={onClose} label={t('close')} tone="floating" className="absolute right-page top-4 z-30 sm:right-page-wide"><X size={18} /></IconButton>
        <ScrollArea data-testid="box-details-scroll" className="flex-1">
          <MediaSheetHeader data-testid="box-details-cover" onClose={onClose} closeLabel={t('close')} showClose={false}><img src={box.image} alt={name} className="h-full w-full object-cover" /><span className="absolute bottom-8 left-page z-10 sm:left-page-wide"><StatusBadge tone="accentSolid" size="lg">−{discount}%</StatusBadge></span></MediaSheetHeader>
          <div data-testid="box-details-content" className="relative z-10 -mt-5 rounded-t-sheet bg-surface px-page pb-6 pt-6 sm:px-page-wide">
            <div className="mb-3 flex items-center gap-2.5 text-sm font-extrabold text-ink">
              <MediaBadge size="sm"><img src={store.logo} alt="" className="h-7 w-7 object-contain" /></MediaBadge><span className="min-w-0 flex-1 break-words leading-5">{store.name}</span>{box.isHalal && <StatusBadge tone="success" size="sm">{t('halal')}</StatusBadge>}
            </div>
            <PageTitle>{name}</PageTitle>
            {box.type === 'SURPRISE' && <div className="mt-3"><SurpriseBadge /></div>}

            <div data-testid="box-price-card" className="mt-4 flex flex-wrap items-end gap-3 tabular-nums">
              <div><p className="algan-eyebrow text-ink-muted">{t('boxPrice')}</p><p className="mt-1 whitespace-nowrap text-commerce-price text-ink">{formatPrice(box.salePrice)}</p></div>
              <span className="pb-1 text-sm font-medium text-ink-muted line-through">{formatPrice(box.originalPrice)}</span>
            </div>
            <p className="mt-2 text-xs font-bold text-brand">{t('yourSavings')} · {formatPrice(box.originalPrice - box.salePrice)}</p>

            <div data-testid="box-commerce-summary" className="mt-5 grid grid-cols-2 gap-2">
              <InsetSurface data-testid="box-pickup-time" className="min-w-0 p-3"><p className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.05em] text-ink-secondary"><Clock3 size={13} className="shrink-0 text-brand" />{t('pickupTime')}</p><p className="mt-2 whitespace-nowrap text-sm font-black tracking-[-0.02em] text-ink tabular-nums">{box.pickupFrom}–{box.pickupTo}</p></InsetSurface>
              <InsetSurface className="min-w-0 p-3"><p className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.05em] text-ink-secondary"><Package size={13} className="shrink-0 text-brand" />{t('offersLabel')}</p><p data-testid="box-stock" className={`mt-2 text-xs font-black ${available > 0 ? 'text-brand' : 'text-danger'}`}>{formatBoxesLeft(available, locale)}</p></InsetSurface>
            </div>

            <InsetSurface data-testid="box-store-summary" tone="soft" className="mt-3 overflow-hidden">
              <div className="flex items-start gap-2.5 p-3.5 text-sm font-medium text-ink-secondary"><MapPin size={18} className="mt-0.5 shrink-0 text-brand" /><span>{address}</span></div>
              <CardActionButton onClick={() => { setRoutePickerOpen(true); haptic('tap'); }}>{t('buildRoute')}<ArrowUpRight size={16} /></CardActionButton>
            </InsetSurface>

            <NoticeCard
              data-testid="box-appearance-notice"
              density="compact"
              titleAs="p"
              className="mt-4"
              icon={<ImageIcon size={15} />}
              title={`${t('appearanceMayDifferTitle')}.`}
            />

            {box.type === 'SURPRISE' ? (
              <><SectionTitle className="mt-6">{t('surprisePossibleTitle')}</SectionTitle><p className="mt-2 text-sm leading-6 text-ink-secondary">{t('surprisePossibleContents')}</p><NoticeCard data-testid="surprise-composition-notice" className="mt-4" icon={<Package size={19} />} title={t('surpriseNoticeTitle')}>{t('surprise')}</NoticeCard></>
            ) : (
              <><SectionTitle className="mt-6">{t('composition')}</SectionTitle><ul className="mt-2 divide-y divide-border border-y border-border" data-testid="box-contents">{box.contents?.map((item) => <li key={item.contentName} className="flex items-center justify-between gap-4 py-3 text-sm"><span className="font-bold text-ink">{boxContentName(item, locale)}</span><StatusBadge tone="brand" size="sm">× {item.quantity}</StatusBadge></li>)}</ul></>
            )}
            <NoticeCard
              data-testid="box-allergens"
              tone="allergen"
              titleAs="h2"
              className="mt-5"
              icon={<AlertTriangle size={18} />}
              title={allergens ? t('containsAllergens') : t('allergens')}
            >
              {allergens ?? t('allergensUnknown')}
            </NoticeCard>
          </div>
        </ScrollArea>
        {(available > 0 || cartQuantity > 0) && (
          <StickyActionFooter>
            <div className="grid grid-cols-[7rem_minmax(0,1fr)] items-center gap-2">
              <QuantityStepper quantity={selectedQuantity} min={1} max={Math.max(available, cartQuantity)} label={t('quantity')} onChange={setSelectedQuantity} />
              <PrimaryButton className="px-2 text-center" onClick={() => { onChangeQuantity(selectedQuantity); onClose(); }} aria-label={`${t('addToCartFull')} ${name}`} aria-describedby="box-selected-total">
                <span className="flex min-w-0 flex-col items-center"><span className="text-[11px] leading-4">{t('addToCartFull')}</span><span id="box-selected-total" className="text-sm leading-4 tabular-nums">{selectedTotal}</span></span>
              </PrimaryButton>
            </div>
          </StickyActionFooter>
        )}
        {routePickerOpen && <RoutePicker lat={store.lat} lng={store.lng} t={t} onClose={() => setRoutePickerOpen(false)} />}
      </div>
    </DialogLayer>
  );
}

export function CartSheet({ items, purchasedBoxQuantities, locale, t, onChangeQuantity, onClose, onPay, paymentPending, onOpenOffer, onOpenOrderRules }: {
  items: CartItem[];
  purchasedBoxQuantities: Record<string, number>;
  locale: Locale;
  t: Translator;
  onChangeQuantity: (box: Box, quantity: number) => void;
  onClose: () => void;
  onPay: () => Promise<void>;
  paymentPending: boolean;
  onOpenOffer: () => void;
  onOpenOrderRules: () => void;
}) {
  const formatPrice = usePriceFormatter(locale);
  const lines = items.flatMap((item) => {
    const box = boxes.find((candidate) => candidate.id === item.boxId);
    return box ? [{ box, quantity: item.quantity }] : [];
  });
  const total = lines.reduce((sum, line) => sum + line.box.salePrice * line.quantity, 0);
  const savings = lines.reduce((sum, line) => sum + (line.box.originalPrice - line.box.salePrice) * line.quantity, 0);
  const store = lines[0] ? storeById(lines[0].box.storeId) : undefined;
  const close = () => { if (!paymentPending) onClose(); };
  return (
    <DialogLayer onClose={close} closeLabel={t('close')} ariaLabel={t('cart')} sheetHeight="tall">
      <div className="flex h-full min-h-0 flex-col">
        <ModalBody className="pb-3"><SheetHeader title={t('cart')} onClose={close} closeDisabled={paymentPending} closeLabel={t('close')} /></ModalBody>
        <ScrollArea data-testid="cart-scroll" className="flex-1 px-page pb-5 sm:px-page-wide">
          {lines.length === 0 ? <EmptyState icon={<ShoppingBag size={32} />} title={t('cartEmpty')}><PrimaryButton onClick={onClose}>{t('browseOffers')}</PrimaryButton></EmptyState> : (
            <>
              {store && <div className="mb-5 rounded-card bg-surface-soft p-4"><p className="algan-eyebrow text-ink-muted">{t('selfPickup')}</p><p className="mt-2 text-base font-bold">{store.name}</p><p className="mt-1 flex items-start gap-1.5 text-xs leading-5 text-ink-secondary"><MapPin size={15} className="mt-0.5 shrink-0" />{storeAddress(store, locale)}</p></div>}
              <fieldset disabled={paymentPending} className="min-w-0 space-y-3">
                <legend className="algan-eyebrow mb-3 text-ink-muted">{t('orderSummary')}</legend>
                {lines.map(({ box, quantity }) => (
                  <div key={box.id} className="border-b border-border pb-4">
                    <div className="flex items-start gap-3"><span aria-hidden="true" className="h-20 w-20 shrink-0 overflow-hidden rounded-control"><img src={box.image} alt="" className="h-full w-full object-cover" /></span><div className="min-w-0 flex-1"><p className="break-words text-sm font-bold leading-5">{boxName(box, locale)}</p><p className="mt-1 text-[11px] font-medium text-ink-muted">{box.pickupFrom}–{box.pickupTo}</p><p className="mt-2 text-lg font-extrabold text-ink">{formatPrice(box.salePrice * quantity)}</p></div></div>
                    <div className="mt-3 grid grid-cols-[8rem_1fr] items-center gap-2"><QuantityControl quantity={quantity} max={availableQuantity(box, purchasedBoxQuantities)} label={`${t('quantity')}: ${boxName(box, locale)}`} addLabel={`${t('addToCart')} ${boxName(box, locale)}`} addText={t('addToCart')} onChange={(next) => onChangeQuantity(box, next)} /><TertiaryButton tone="danger" className="justify-self-end" onClick={() => onChangeQuantity(box, 0)} aria-label={`${t('removeFromCart')}: ${boxName(box, locale)}`}>{t('removeFromCart')}</TertiaryButton></div>
                  </div>
                ))}
              </fieldset>
              <div className="mt-5 flex items-center justify-between gap-3 rounded-control bg-success-soft px-4 py-3 text-sm font-bold text-success"><span>{t('yourSavings')}</span><span className="tabular-nums">{formatPrice(savings)}</span></div>
              <NoticeCard className="mt-4" density="compact" icon={<Clock3 size={17} />} title={t('cancellationNoticeTitle')}>
                {t('cancellationNoticeText')}
              </NoticeCard>
            </>
          )}
        </ScrollArea>
        {lines.length > 0 && <StickyActionFooter data-testid="cart-checkout-footer">
          <div className="mb-3 flex items-center justify-between gap-3 tabular-nums"><span className="text-sm font-semibold text-ink-secondary">{t('total')}</span><span className="text-2xl font-extrabold" aria-live="polite">{formatPrice(total)}</span></div>
          <PrimaryButton onClick={() => void onPay()} disabled={paymentPending} aria-busy={paymentPending}>{paymentPending ? t('paymentProcessing') : t('checkoutCart')}</PrimaryButton>
          <p className="mt-3 text-center text-xs leading-5 text-ink-muted">
            {t('checkoutOfferPrefix')}{' '}<TextLinkButton disabled={paymentPending} onClick={onOpenOffer}>{t('checkoutOfferLink')}</TextLinkButton>{' '}{t('checkoutOfferBetween')}{' '}<TextLinkButton disabled={paymentPending} onClick={onOpenOrderRules}>{t('checkoutRulesLink')}</TextLinkButton>{t('checkoutOfferSuffix') ? ` ${t('checkoutOfferSuffix')}` : ''}
          </p>
        </StickyActionFooter>}
      </div>
    </DialogLayer>
  );
}

function PaymentResultScreen({ title, description, actionLabel, statusIcon, tone, closeLabel, onAction, children }: {
  title: string;
  description: string;
  actionLabel: string;
  statusIcon: ReactNode;
  tone: 'brand' | 'coral';
  closeLabel: string;
  onAction: () => void;
  children?: ReactNode;
}) {
  return (
    <DialogLayer onClose={onAction} closeLabel={closeLabel} ariaLabel={title} variant="full">
      <FullScreenFeedback centered tone={tone} icon={statusIcon} title={title} description={description} header={<AlganLogo markClassName="h-7 w-7" wordmarkClassName="h-7 w-[72px]" />}>
        {children}
        <PrimaryButton onClick={onAction} className="mx-auto mt-8 w-full max-w-[330px] shrink-0">{actionLabel}</PrimaryButton>
      </FullScreenFeedback>
    </DialogLayer>
  );
}

export function PaymentFailure({ t, onBackToCart }: { t: Translator; onBackToCart: () => void }) {
  return (
    <PaymentResultScreen
      title={t('paymentFailedTitle')}
      description={t('paymentFailedText')}
      actionLabel={t('backToCart')}
      closeLabel={t('close')}
      onAction={onBackToCart}
      tone="coral"
      statusIcon={<AlertTriangle size={42} />}
    />
  );
}

export function Success({ t, onDone }: { t: Translator; onDone: () => void }) {
  return (
    <PaymentResultScreen
      title={t('paymentSuccessTitle')}
      description={t('successText')}
      actionLabel={t('toOrders')}
      closeLabel={t('close')}
      onAction={onDone}
      tone="brand"
      statusIcon={<CheckCircle2 size={44} />}
    />
  );
}
