'use client';
/* eslint-disable @next/next/no-img-element */

import { AlertTriangle, Clock3, Image as ImageIcon, MapPin, Package, ShoppingBag, Sparkles } from 'lucide-react';
import { useState } from 'react';
import { AlganMark } from '@/components/algan-logo';
import { SurpriseBadge } from '@/components/algan/marketplace';
import { OrderQr, PickupCodePanel } from '@/components/algan/orders';
import { usePriceFormatter } from '@/components/algan/price-context';
import { RoutePicker } from '@/components/algan/route-picker';
import type { Translator } from '@/components/algan/types';
import { CardActionButton, ConfirmationDialog, DialogLayer, EmptyState, FullScreenFeedback, InsetSurface, MediaBadge, MediaSheetHeader, ModalBody, NoticeCard, PageTitle, PrimaryButton, QuantityControl, QuantityStepper, ScrollArea, SectionTitle, SheetHeader, StatusBadge, StickyActionFooter, TertiaryButton, TextLinkButton } from '@/components/ui-kit';
import { availableQuantity } from '@/lib/app-utils';
import { boxAllergens, boxContentName, boxName, storeAddress } from '@/lib/catalog-localization';
import { boxes, storeById } from '@/lib/mock-data';
import { formatOrderId } from '@/lib/order-id';
import { formatBoxesLeft } from '@/lib/stock';
import { haptic } from '@/lib/telegram';
import type { Box, CartItem, Locale, Order } from '@/lib/types';

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
      tone="danger"
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
      <PrimaryButton size="md" onClick={onOpen} aria-label={`${t('cart')}, ${formatPrice(total)}`}>
        <span>{t('cart')} · {quantity}</span><span className="ml-auto">{formatPrice(total)}</span>
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
      <div data-testid="box-details-sheet" className="flex h-full min-h-0 flex-col">
        <ScrollArea data-testid="box-details-scroll" className="flex-1">
          <MediaSheetHeader data-testid="box-details-cover" onClose={onClose} closeLabel={t('close')}><img src={box.image} alt={name} className="h-full w-full object-cover" /></MediaSheetHeader>
          <div data-testid="box-details-content" className="relative z-10 -mt-5 rounded-t-sheet bg-surface px-page pb-6 pt-6 sm:px-page-wide">
            <div className="mb-3 flex items-center gap-2.5 text-sm font-extrabold text-ink">
              <MediaBadge size="sm"><img src={store.logo} alt="" className="h-7 w-7 object-contain" /></MediaBadge><span className="min-w-0 break-words leading-5">{store.name}</span>
            </div>
            <PageTitle>{name}</PageTitle>
            {box.type === 'SURPRISE' && <div className="mt-3"><SurpriseBadge /></div>}

            <InsetSurface data-testid="box-store-summary" tone="panel" className="mt-4 overflow-hidden p-0 shadow-card">
              <div className="flex items-start gap-2.5 p-3.5 text-sm font-bold text-ink-secondary"><MapPin size={17} className="mt-0.5 shrink-0 text-brand-hover" /><span>{address}</span></div>
              <CardActionButton onClick={() => { setRoutePickerOpen(true); haptic('tap'); }}>{t('buildRoute')}</CardActionButton>
            </InsetSurface>

            <div data-testid="box-price-card" className="mt-4 flex flex-wrap items-end justify-between gap-2 border-b border-border pb-4 tabular-nums">
              <div><p className="text-[11px] font-black uppercase tracking-[0.08em] text-ink-secondary">{t('boxPrice')}</p><p className="mt-1 whitespace-nowrap text-commerce-price text-brand-hover">{formatPrice(box.salePrice)}</p></div>
              <div className="mb-1 flex items-center gap-2"><span className="text-xs font-semibold text-ink-muted line-through">{formatPrice(box.originalPrice)}</span><StatusBadge tone="accentSolid" size="sm">−{discount}%</StatusBadge></div>
            </div>

            <div data-testid="box-commerce-summary" className="mt-3 grid grid-cols-2 gap-2">
              <InsetSurface data-testid="box-pickup-time" className="min-w-0 p-3"><p className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.05em] text-ink-secondary"><Clock3 size={13} className="shrink-0 text-brand" />{t('pickupTime')}</p><p className="mt-2 whitespace-nowrap text-sm font-black tracking-[-0.02em] text-ink tabular-nums">{box.pickupFrom}–{box.pickupTo}</p></InsetSurface>
              <InsetSurface className="min-w-0 p-3"><p className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.05em] text-ink-secondary"><Package size={13} className="shrink-0 text-brand" />{t('offersLabel')}</p><p data-testid="box-stock" className={`mt-2 text-xs font-black ${available > 0 ? 'text-brand' : 'text-danger'}`}>{formatBoxesLeft(available, locale)}</p></InsetSurface>
            </div>

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
              <PrimaryButton size="md" className="whitespace-nowrap px-2 text-center" onClick={() => { onChangeQuantity(selectedQuantity); onClose(); }} aria-label={`${t('addToCartFull')} ${name}`} aria-describedby="box-selected-total">
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
  return (
    <DialogLayer onClose={onClose} closeLabel={t('close')} ariaLabel={t('cart')} sheetHeight="tall">
      <ModalBody className="flex h-full min-h-0 flex-col overflow-hidden">
        <SheetHeader className="pb-3" title={t('cart')} onClose={onClose} closeLabel={t('close')} />
        <ScrollArea data-testid="cart-scroll" className="flex flex-1 flex-col pb-1">
          {lines.length === 0 ? <EmptyState icon={<ShoppingBag size={32} />} title={t('cartEmpty')} /> : (
            <div className="mt-2 space-y-3">
              {lines.map(({ box, quantity }) => (
                <InsetSurface key={box.id} tone="panel" className="overflow-hidden p-3">
                  <div className="flex items-center gap-3"><span aria-hidden="true" className="h-18 w-18 shrink-0 overflow-hidden rounded-control"><img src={box.image} alt="" className="h-full w-full object-cover" /></span><div className="min-w-0 flex-1"><p className="break-words text-xs font-bold leading-5 text-brand">{storeById(box.storeId).name}</p><p className="mt-0.5 break-words text-sm font-extrabold leading-5">{boxName(box, locale)}</p><p className="mt-1.5 text-base font-extrabold text-brand-hover">{formatPrice(box.salePrice * quantity)}</p></div></div>
                  <div className="mt-3 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2 border-t border-border pt-3"><QuantityControl quantity={quantity} max={availableQuantity(box, purchasedBoxQuantities)} label={t('quantity')} addLabel={`${t('addToCart')} ${boxName(box, locale)}`} addText={t('addToCart')} onChange={(next) => onChangeQuantity(box, next)} /><TertiaryButton tone="danger" onClick={() => onChangeQuantity(box, 0)}>{t('removeFromCart')}</TertiaryButton></div>
                </InsetSurface>
              ))}
            </div>
          )}
          <div className="my-5 h-px shrink-0 bg-border" />
          <div className="flex shrink-0 items-end justify-between tabular-nums"><span className="text-sm font-bold text-ink-secondary">{t('total')}</span><span className="text-2xl font-black" aria-live="polite">{formatPrice(total)}</span></div>
          <PrimaryButton onClick={() => void onPay()} disabled={lines.length === 0 || paymentPending} aria-busy={paymentPending} className="mt-5 shrink-0">{paymentPending ? t('paymentProcessing') : t('checkoutCart')}</PrimaryButton>
          <p className="mt-auto shrink-0 pt-3 text-center text-xs leading-5 text-ink-muted">
            {t('checkoutOfferPrefix')}{' '}<TextLinkButton onClick={onOpenOffer}>{t('checkoutOfferLink')}</TextLinkButton>{' '}{t('checkoutOfferBetween')}{' '}<TextLinkButton onClick={onOpenOrderRules}>{t('checkoutRulesLink')}</TextLinkButton>{t('checkoutOfferSuffix') ? ` ${t('checkoutOfferSuffix')}` : ''}
          </p>
        </ScrollArea>
      </ModalBody>
    </DialogLayer>
  );
}

export function PaymentFailure({ t, onBackToCart }: { t: Translator; onBackToCart: () => void }) {
  return (
    <DialogLayer onClose={onBackToCart} closeLabel={t('close')} ariaLabel={t('paymentFailedTitle')} variant="full">
      <FullScreenFeedback centered tone="coral" className="relative overflow-hidden" icon={<><AlganMark className="h-9 w-9" /><AlertTriangle className="absolute -right-2 -top-2 rounded-full bg-surface p-1 text-accent-strong shadow-control" size={24} strokeWidth={2.5} /></>} title={t('paymentFailedTitle')} description={t('paymentFailedText')}>
        <PrimaryButton onClick={onBackToCart} className="mx-auto mt-6 w-full max-w-[330px]">{t('backToCart')}</PrimaryButton>
      </FullScreenFeedback>
    </DialogLayer>
  );
}

export function Success({ order, t, onDone }: { order: Order; t: Translator; onDone: () => void }) {
  return (
    <DialogLayer onClose={onDone} closeLabel={t('close')} ariaLabel={t('ordersCreated')} variant="full">
      <FullScreenFeedback icon={<><AlganMark className="h-10 w-10" /><Sparkles className="absolute -right-2 -top-1 text-accent-strong" size={20} /></>} title={t('ordersCreated')} description={t('successText')}>
        <div className="mt-5"><OrderQr order={order} t={t} /></div>
        <PickupCodePanel pickupCode={order.pickupCode} label={t('pickupCode')} className="mx-auto mt-4 w-full max-w-[320px] p-3" />
        <p className="mt-4 text-xs font-bold text-ink-muted">{t('orderId')}: {formatOrderId(order.id)}</p>
        <PrimaryButton onClick={onDone} className="mt-6 shrink-0">{t('toOrders')}</PrimaryButton>
      </FullScreenFeedback>
    </DialogLayer>
  );
}
