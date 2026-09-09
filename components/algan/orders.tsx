'use client';
/* eslint-disable @next/next/no-img-element */

import { CalendarDays, CheckCircle2, Clock3, PackageCheck, ShoppingBag, XCircle } from 'lucide-react';
import { lazy, Suspense, useEffect, useState } from 'react';
import { usePriceFormatter } from '@/components/algan/price-context';
import { RoutePicker } from '@/components/algan/route-picker';
import type { Translator } from '@/components/algan/types';
import { ConfirmationDialog, DangerButton, DialogLayer, EmptyState, InsetSurface, MediaBadge, ModalBody, PageSection, PrimaryButton, ScrollArea, SecondaryButton, SegmentedControl, SheetHeader, StatusBadge, SurfaceCard } from '@/components/ui-kit';
import { boxName } from '@/lib/catalog-localization';
import { formatOrderDate, formatShymkentTime } from '@/lib/date';
import { boxes, demoPastOrder, stores } from '@/lib/mock-data';
import { canCancelOrder, orderCancellationDeadline } from '@/lib/order-cancellation';
import { createOrderQrPayload, formatOrderId, formatPickupCode } from '@/lib/order-id';
import { haptic } from '@/lib/telegram';
import type { Locale, Order, Store } from '@/lib/types';

const LazyQRCodeSVG = lazy(async () => {
  const { QRCodeSVG } = await import('qrcode.react');
  return { default: QRCodeSVG };
});

function orderPickupWindow(order: Order) {
  const snapshotFrom = formatShymkentTime(order.pickupStartsAt);
  const snapshotTo = formatShymkentTime(order.pickupEndsAt);
  if (snapshotFrom && snapshotTo) return `${snapshotFrom}–${snapshotTo}`;

  const orderBoxes = order.items.flatMap((item) => {
    const box = boxes.find((candidate) => candidate.id === item.boxId);
    return box ? [box] : [];
  });
  const from = orderBoxes.map((box) => box.pickupFrom).sort()[0];
  const to = orderBoxes.map((box) => box.pickupTo).sort().at(-1);
  return from && to ? `${from}–${to}` : undefined;
}

function OrderStatus({ order, t }: { order: Order; t: Translator }) {
  if (order.status === 'paid') {
    return <StatusBadge tone="brand" icon={<Clock3 size={12} />}>{t('activeOrderStatus')}</StatusBadge>;
  }
  if (order.status === 'cancelled') {
    return <StatusBadge tone="danger" icon={<XCircle size={12} />}>{t('cancelledOrderStatus')}</StatusBadge>;
  }
  return <StatusBadge tone="neutral" icon={<CheckCircle2 size={12} />}>{t('collectedStatus')}</StatusBadge>;
}

export function OrdersTab({ t, locale, orders, onCancelOrder, onBrowseOffers }: { t: Translator; locale: Locale; orders: Order[]; onCancelOrder: (orderId: string) => boolean; onBrowseOffers: () => void }) {
  const formatPrice = usePriceFormatter(locale);
  const [view, setView] = useState<'active' | 'past'>('active');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [cancellationOrderId, setCancellationOrderId] = useState<string | null>(null);
  const [routeStore, setRouteStore] = useState<Store | null>(null);
  const [nowMs, setNowMs] = useState(() => Date.now());
  const ordersWithDemoHistory = orders.some((order) => order.id === demoPastOrder.id) ? orders : [...orders, demoPastOrder];
  const visibleOrders = ordersWithDemoHistory.filter((order) => view === 'active' ? order.status === 'paid' : order.status !== 'paid');
  const emptyTitle = view === 'active' ? t('noActiveOrders') : t('noPastOrders');
  const emptyText = view === 'active' ? t('noActiveOrdersText') : t('noPastOrdersText');
  const cancellationOrder = cancellationOrderId ? orders.find((order) => order.id === cancellationOrderId) : undefined;

  useEffect(() => {
    const currentTime = Date.now();
    const nextDeadline = orders
      .filter((order) => order.status === 'paid')
      .map(orderCancellationDeadline)
      .flatMap((deadline) => deadline && deadline.getTime() >= currentTime ? [deadline.getTime()] : [])
      .sort((a, b) => a - b)[0];
    if (nextDeadline === undefined) return;
    const timeout = window.setTimeout(() => setNowMs(Date.now()), Math.min(nextDeadline - currentTime + 1, 2_147_483_647));
    return () => window.clearTimeout(timeout);
  }, [orders, nowMs]);

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
            const isActive = order.status === 'paid';
            const cancellationAllowed = canCancelOrder(order, new Date(nowMs));
            const cancellationHelpId = `order-cancellation-${order.id}`;
            return (
              <SurfaceCard key={order.id} data-order-status={order.status} className="overflow-hidden tabular-nums">
                <div className="p-4">
                  <div className="flex items-start gap-3">
                    {store && <MediaBadge><img src={store.logo} alt="" className="h-9 w-9 object-contain" /></MediaBadge>}
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center justify-between gap-2"><p className="break-words text-sm font-extrabold leading-5 text-ink">{store?.name}</p><OrderStatus order={order} t={t} /></div>
                      <p className="mt-1 text-[11px] font-semibold text-ink-subtle">{t('orderId')}: {formatOrderId(order.id)}</p>
                    </div>
                  </div>

                  <div className="mt-4 space-y-2">
                    {order.items.map((item) => {
                      const box = boxes.find((candidate) => candidate.id === item.boxId);
                      return (
                        <div key={item.boxId} className="flex items-center justify-between gap-3 text-xs">
                          <span className="min-w-0 break-words font-bold leading-5 text-ink-secondary">{box ? boxName(box, locale) : ''}</span>
                          <span className="shrink-0 font-bold text-ink-muted">{formatPrice(item.unitPrice)} × {item.quantity}</span>
                        </div>
                      );
                    })}
                  </div>
                  <div data-testid="order-schedule" className="mt-4 space-y-2 border-t border-border pt-3 text-xs font-bold">
                    {isActive && <div data-testid="active-order-pickup" className="flex items-center gap-2 text-brand"><Clock3 size={16} />{t('pickupToday')} · {pickupWindow}</div>}
                    <div className="flex items-center gap-2 text-ink-muted"><CalendarDays size={16} />{orderDate}</div>
                  </div>
                  <div className="mt-4 flex items-center justify-between border-t border-border pt-4"><span className="text-xs font-bold text-ink-muted">{t('total')}</span><b className="text-lg text-brand">{formatPrice(order.total)}</b></div>
                </div>

                {isActive && (
                  <div className="border-t border-border bg-surface-soft p-3">
                    <div className={`grid gap-2 ${store ? 'grid-cols-2' : 'grid-cols-1'}`}>
                      <PrimaryButton size="md" onClick={() => { setSelectedOrder(order); haptic('tap'); }}>{t('showQr')}</PrimaryButton>
                      {store && <SecondaryButton size="md" onClick={() => { setRouteStore(store); haptic('tap'); }}>{t('buildRoute')}</SecondaryButton>}
                    </div>
                    <DangerButton size="md" className="mt-2" disabled={!cancellationAllowed} aria-describedby={cancellationHelpId} onClick={() => { setCancellationOrderId(order.id); haptic('tap'); }}>{t('cancelOrder')}</DangerButton>
                    <p id={cancellationHelpId} className="mt-2 text-center text-[11px] font-semibold leading-4 text-ink-muted">{t(cancellationAllowed ? 'cancellationAvailable' : 'cancellationUnavailable')}</p>
                  </div>
                )}
              </SurfaceCard>
            );
          })}
        </div>
      )}
      {selectedOrder && <OrderDetails order={selectedOrder} t={t} onClose={() => setSelectedOrder(null)} />}
      {routeStore && <RoutePicker lat={routeStore.lat} lng={routeStore.lng} t={t} onClose={() => setRouteStore(null)} />}
      {cancellationOrder && (
        <ConfirmationDialog
          title={t('cancelOrderTitle')}
          description={t('cancelOrderConfirmText')}
          confirmLabel={t('cancelOrder')}
          cancelLabel={t('keepOrder')}
          closeLabel={t('close')}
          tone="danger"
          icon={<XCircle size={26} />}
          onCancel={() => setCancellationOrderId(null)}
          onConfirm={() => {
            const cancelled = onCancelOrder(cancellationOrder.id);
            setCancellationOrderId(null);
            setNowMs(Date.now());
            if (!cancelled) {
              haptic('error');
              return;
            }
            setSelectedOrder(null);
            setView('past');
            haptic('success');
          }}
        />
      )}
    </PageSection>
  );
}

export function OrderQr({ order, t }: { order: Order; t: Translator }) {
  return (
    <div className="mx-auto w-fit rounded-card border border-border bg-surface p-4 text-brand shadow-card">
      <Suspense fallback={<span role="status" className="grid h-[184px] w-[184px] place-items-center text-xs font-bold text-ink-muted">{t('loading')}</span>}>
        <LazyQRCodeSVG value={createOrderQrPayload(order.id, order.pickupCode)} size={184} level="M" marginSize={1} bgColor="white" fgColor="currentColor" title={t('qrCode')} />
      </Suspense>
    </div>
  );
}

export function PickupCodePanel({ pickupCode, label, className }: { pickupCode: string; label: string; className?: string }) {
  return (
    <InsetSurface tone="brandSolid" className={`p-4 text-center tabular-nums ${className ?? ''}`}>
      <p className="text-xs font-bold text-white/70">{label}</p>
      <p className="mt-1 text-3xl font-black tracking-[0.12em]">{formatPickupCode(pickupCode)}</p>
    </InsetSurface>
  );
}

function OrderDetails({ order, t, onClose }: { order: Order; t: Translator; onClose: () => void }) {
  return (
    <DialogLayer onClose={onClose} closeLabel={t('close')} ariaLabel={t('showQr')} sheetHeight="medium">
      <ModalBody className="flex h-full min-h-0 flex-col overflow-hidden">
        <SheetHeader title={t('showQr')} onClose={onClose} closeLabel={t('close')} />
        <ScrollArea className="flex-1 pb-2 text-center">
          <div className="mt-6"><OrderQr order={order} t={t} /></div>
          <p className="mx-auto mt-5 max-w-[300px] text-sm leading-6 text-ink-secondary">{t('pickupInstructions')}</p>
          <PickupCodePanel pickupCode={order.pickupCode} label={t('pickupCode')} className="mt-5" />
        </ScrollArea>
      </ModalBody>
    </DialogLayer>
  );
}
