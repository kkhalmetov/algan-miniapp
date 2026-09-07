'use client';
/* eslint-disable @next/next/no-img-element */

import { CalendarDays, Clock3, PackageCheck, ShoppingBag } from 'lucide-react';
import { lazy, Suspense, useState } from 'react';
import { usePriceFormatter } from '@/components/algan/price-context';
import { RoutePicker } from '@/components/algan/route-picker';
import type { Translator } from '@/components/algan/types';
import { DialogLayer, EmptyState, InsetSurface, MediaBadge, ModalBody, PageSection, PrimaryButton, ScrollArea, SecondaryButton, SectionTitle, SegmentedControl, SheetHeader, SurfaceCard } from '@/components/ui-kit';
import { boxName } from '@/lib/catalog-localization';
import { formatOrderDate } from '@/lib/date';
import { boxes, demoPastOrder, stores } from '@/lib/mock-data';
import { createOrderQrPayload, formatOrderId, formatPickupCode } from '@/lib/order-id';
import { haptic } from '@/lib/telegram';
import type { Locale, Order, Store } from '@/lib/types';

const LazyQRCodeSVG = lazy(async () => {
  const { QRCodeSVG } = await import('qrcode.react');
  return { default: QRCodeSVG };
});

function orderPickupWindow(order: Order) {
  const orderBoxes = order.items.flatMap((item) => {
    const box = boxes.find((candidate) => candidate.id === item.boxId);
    return box ? [box] : [];
  });
  const from = orderBoxes.map((box) => box.pickupFrom).sort()[0];
  const to = orderBoxes.map((box) => box.pickupTo).sort().at(-1);
  return from && to ? `${from}–${to}` : undefined;
}

export function OrdersTab({ t, locale, orders, onBrowseOffers }: { t: Translator; locale: Locale; orders: Order[]; onBrowseOffers: () => void }) {
  const formatPrice = usePriceFormatter(locale);
  const [view, setView] = useState<'active' | 'past'>('active');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [routeStore, setRouteStore] = useState<Store | null>(null);
  const ordersWithDemoHistory = orders.some((order) => order.id === demoPastOrder.id) ? orders : [...orders, demoPastOrder];
  const visibleOrders = ordersWithDemoHistory.filter((order) => view === 'active' ? order.status === 'paid' : order.status === 'collected');
  const emptyTitle = view === 'active' ? t('noActiveOrders') : t('noPastOrders');
  const emptyText = view === 'active' ? t('noActiveOrdersText') : t('noPastOrdersText');

  return (
    <PageSection title={t('orders')}>
      <div className="mt-5">
        <SegmentedControl value={view} label={t('orders')} items={[{ value: 'active', label: t('activeOrders') }, { value: 'past', label: t('pastOrders') }]} onChange={(item) => { setView(item); haptic('tap'); }} />
      </div>

      {visibleOrders.length === 0 ? (
        <EmptyState icon={view === 'active' ? <ShoppingBag size={34} /> : <PackageCheck size={34} />} title={emptyTitle} description={emptyText}>
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
                    <div className="min-w-0 flex-1"><p className="truncate text-sm font-extrabold text-ink">{store?.name}</p><p className="mt-1 text-[11px] font-semibold text-ink-subtle">{t('orderId')}: {formatOrderId(order.id)}</p></div>
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

export function OrderQr({ order, t }: { order: Order; t: Translator }) {
  return (
    <div className="mx-auto w-fit rounded-card border border-border bg-white p-4 text-brand shadow-card">
      <Suspense fallback={<span role="status" className="grid h-[184px] w-[184px] place-items-center text-xs font-bold text-ink-muted">{t('loading')}</span>}>
        <LazyQRCodeSVG value={createOrderQrPayload(order.id, order.pickupCode)} size={184} level="M" marginSize={1} bgColor="white" fgColor="currentColor" title={t('qrCode')} />
      </Suspense>
    </div>
  );
}

export function PickupCodePanel({ pickupCode, label, className }: { pickupCode: string; label: string; className?: string }) {
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
            </div>
            <div className="mt-4 flex items-center gap-2 border-t border-brand/10 pt-3 text-xs font-bold text-ink-secondary"><CalendarDays size={15} />{orderDate}</div>
          </InsetSurface>
          <SectionTitle as="h3" className="mt-7 text-base">{t('orderContents')}</SectionTitle>
          <div className="mt-3"><OrderItemsList order={order} locale={locale} /></div>
          <InsetSurface radius="card" className="mt-4 flex items-center justify-between p-4"><span className="text-sm font-bold text-ink-muted">{t('total')}</span><b className="text-xl text-brand">{formatPrice(order.total)}</b></InsetSurface>
        </ScrollArea>
      </ModalBody>
    </DialogLayer>
  );
}
