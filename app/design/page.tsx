'use client';

import { useState } from 'react';
import Link from 'next/link';
import { AlganLogo } from '@/components/algan-logo';
import * as Icons from '@/components/icons';
import { BoxDetails, CartSheet, PaymentFailure, Success } from '@/components/algan/checkout';
import { HomeTab, FavoritesTab } from '@/components/algan/marketplace';
import { Onboarding, PhoneShell, Splash, LegalAcceptanceScreen } from '@/components/algan/onboarding';
import { BottomNav } from '@/components/algan/navigation';
import { OrdersTab } from '@/components/algan/orders';
import { ProfileTab, SettingsModal, PhoneEditor } from '@/components/algan/profile';
import { DocumentsModal, HelpModal, LegalModal } from '@/components/algan/legal-support';
import { PriceProvider } from '@/components/algan/price-context';
import { AppErrorFallback } from '@/components/app-error';
import type { LegalDocument } from '@/components/algan/types';
import { AccordionItem, DangerButton, EmptyState, FilterChip, IconButton, NoticeCard, PrimaryButton, QuantityStepper, ScrollArea, SearchField, SecondaryButton, SegmentedControl, StatusBadge, SurfaceCard, TextField } from '@/components/ui-kit';
import { boxes, demoPastOrder } from '@/lib/mock-data';
import { getCopy } from '@/lib/translations';
import type { CartItem, Locale, Order, Tab } from '@/lib/types';

const scenes = [
  ['kit', 'UI kit'], ['splash', '01 · Загрузка'], ['onboarding', '02 · Вход'], ['home', '03 · Главная'], ['box', '04 · Карточка бокса'],
  ['cart', '05 · Корзина'], ['processing', '06 · Оплата'], ['success', '07 · Успех'], ['failure', '08 · Ошибка оплаты'],
  ['orders', '09 · Заказы'], ['favorites', '10 · Избранное'], ['empty', '11 · Пустое избранное'], ['profile', '12 · Профиль'],
  ['settings', '13 · Настройки'], ['phone', '14 · Номер телефона'], ['support', '15 · Поддержка'], ['documents', '16 · Документы'],
  ['legal-update', '17 · Обновление документов'], ['error', '18 · Ошибка приложения'],
] as const;
type Scene = typeof scenes[number][0];
const previewProfile = { firstName: 'Алия', phone: '+77000000000' };
const previewOrder: Order = { id: '12345678', storeId: boxes[0].storeId, items: [{ boxId: boxes[0].id, quantity: 1, unitPrice: boxes[0].salePrice }], total: boxes[0].salePrice, pickupCode: '123456', createdAt: '2026-09-11T10:00:00Z', pickupStartsAt: '2026-09-11T14:30:00Z', pickupEndsAt: '2026-09-11T15:30:00Z', status: 'paid' };

/** Isolated component gallery: no persisted account state, payments or network mutations. */
export default function DesignSystemPage() {
  const [scene, setScene] = useState<Scene>('kit');
  const [locale, setLocale] = useState<Locale>('ru');
  const [phone, setPhone] = useState('+7');
  const [favorites, setFavorites] = useState<string[]>([boxes[0].id]);
  const [items, setItems] = useState<CartItem[]>([{ boxId: boxes[0].id, quantity: 1 }]);
  const [selectedBox, setSelectedBox] = useState(boxes[0]);
  const [legal, setLegal] = useState<LegalDocument | null>(null);
  const t = getCopy(locale);
  const toggleFavoriteBox = (id: string) => setFavorites((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
  const updateItem = (id: string, quantity: number) => setItems((current) => [...current.filter((item) => item.boxId !== id), ...(quantity > 0 ? [{ boxId: id, quantity }] : [])]);
  const home = <HomeTab t={t} locale={locale} profile={previewProfile} favoriteBoxIds={favorites} toggleFavoriteBox={toggleFavoriteBox} openBox={(box) => { setSelectedBox(box); setScene('box'); }} purchasedBoxQuantities={{}} />;
  const profile = <ProfileTab t={t} locale={locale} profile={previewProfile} orders={[previewOrder]} currency="KZT" currencyLoading={false} currencyRateError={false} onToggleCurrency={() => setScene('settings')} openSettings={() => setScene('settings')} openHelp={() => setScene('support')} openDocuments={() => setScene('documents')} resetDemo={() => setScene('onboarding')} />;
  const tab: Tab = scene === 'empty' ? 'favorites' : ['settings', 'phone', 'support', 'documents'].includes(scene) ? 'profile' : (['home', 'orders', 'favorites', 'profile'].includes(scene) ? scene : 'home') as Tab;
  return <div lang={locale} className={`bg-canvas text-ink ${scene === 'kit' ? 'min-h-dvh' : 'flex h-dvh flex-col overflow-hidden'}`}>
    <header className="mx-auto flex w-full max-w-6xl shrink-0 flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-5 sm:py-5">
      <div className="flex w-full items-center justify-between gap-2 sm:block sm:w-auto"><Link href="/" aria-label="Открыть Algan"><AlganLogo markClassName="h-7 w-7" wordmarkClassName="h-6 w-16" /></Link><p className="text-[10px] text-ink-muted sm:mt-1">Design system · 02</p></div>
      <div className="flex w-full items-center gap-2 sm:w-auto"><label className="min-w-0 flex-1 text-xs font-bold"><span className="sr-only">Экран</span><select aria-label="Экран для просмотра" value={scene} onChange={(event) => { setScene(event.target.value as Scene); setLegal(null); }} className="min-h-11 w-full rounded-control border border-border bg-surface px-3 text-sm sm:min-w-[240px]">{scenes.map(([id, label]) => <option key={id} value={id}>{label}</option>)}</select></label><button type="button" onClick={() => setLocale(locale === 'ru' ? 'kk' : 'ru')} className="algan-category">RU / ҚАЗ</button></div>
    </header>
    {scene === 'kit' ? <KitGallery /> : <div className="algan-design-preview min-h-0 flex-1"><PriceProvider currency="KZT" kztToRubRate={null}>
      {scene === 'splash' ? <Splash t={t} /> : <PhoneShell key={scene}>
        {scene === 'onboarding' ? <Onboarding t={t} locale={locale} setLocale={setLocale} phone={phone} setPhone={setPhone} openLegal={setLegal} onContinue={() => setScene('home')} /> : scene === 'legal-update' ? <LegalAcceptanceScreen t={t} locale={locale} setLocale={setLocale} openLegal={setLegal} onAccept={() => setScene('home')} /> : scene === 'error' ? <ScrollArea className="h-full"><AppErrorFallback locale={locale} onRetry={() => setScene('home')} /></ScrollArea> : <>
          <div className="algan-app-frame flex flex-col">
            <div className="hide-scrollbar min-h-0 flex-1 overflow-y-auto">
              {scene === 'home' ? home : ['profile', 'settings', 'support', 'phone', 'documents'].includes(scene) ? profile : scene === 'orders' ? <OrdersTab t={t} locale={locale} orders={[previewOrder, demoPastOrder]} onCancelOrder={() => false} onBrowseOffers={() => setScene('home')} /> : ['favorites', 'empty'].includes(scene) ? <FavoritesTab t={t} locale={locale} favoriteBoxIds={scene === 'empty' ? [] : favorites} toggleFavoriteBox={toggleFavoriteBox} openBox={(box) => { setSelectedBox(box); setScene('box'); }} purchasedBoxQuantities={{}} onBrowseOffers={() => setScene('home')} /> : home}
            </div>
            <BottomNav tab={tab} setTab={(value) => setScene(value)} t={t} activeOrders={1} />
          </div>
          {scene === 'box' && <BoxDetails box={selectedBox} t={t} locale={locale} available={selectedBox.quantity} cartQuantity={items.find((item) => item.boxId === selectedBox.id)?.quantity ?? 0} onChangeQuantity={(quantity) => updateItem(selectedBox.id, quantity)} onClose={() => setScene('home')} />}
          {(scene === 'cart' || scene === 'processing') && <CartSheet items={items} purchasedBoxQuantities={{}} t={t} locale={locale} onChangeQuantity={(box, quantity) => updateItem(box.id, quantity)} onClose={() => setScene('home')} onPay={async () => setScene('success')} paymentPending={scene === 'processing'} onOpenOffer={() => setLegal('publicOffer')} onOpenOrderRules={() => setLegal('orderRules')} />}
          {scene === 'success' && <Success t={t} onDone={() => setScene('orders')} />}
          {scene === 'failure' && <PaymentFailure t={t} onBackToCart={() => setScene('cart')} />}
          {scene === 'settings' && <SettingsModal t={t} locale={locale} setLocale={setLocale} phone={previewProfile.phone} onEditPhone={() => setScene('phone')} onClose={() => setScene('profile')} />}
          {scene === 'phone' && <PhoneEditor t={t} currentPhone={previewProfile.phone} onSave={() => setScene('settings')} onClose={() => setScene('settings')} />}
          {scene === 'support' && <HelpModal t={t} onClose={() => setScene('profile')} />}
          {scene === 'documents' && <DocumentsModal t={t} locale={locale} subject={{ fullName: 'Алия' }} onClose={() => setScene('profile')} />}
        </>}
        {legal && <LegalModal type={legal} t={t} locale={locale} subject={{ fullName: 'Алия' }} onClose={() => setLegal(null)} />}
      </PhoneShell>}
    </PriceProvider></div>}
  </div>;
}

function KitGallery() {
  const [value, setValue] = useState('');
  const [phoneValue, setPhoneValue] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [segment, setSegment] = useState('active');
  const [favorite, setFavorite] = useState(false);
  const [expanded, setExpanded] = useState(false);
  return <main className="mx-auto max-w-6xl px-5 pb-16">
    <section className="mt-6 border-y border-border py-10"><p className="algan-eyebrow text-brand">Algan / новый визуальный язык</p><h1 className="mt-3 max-w-2xl text-5xl font-extrabold leading-[1.05] tracking-[-.05em]">Хорошие вещи.<br /><span className="text-brand">Каждый день.</span></h1><p className="mt-5 max-w-xl text-base leading-7 text-ink-secondary">Тёплая палитра, выразительная типографика, мягкая геометрия и понятные действия. Все компоненты ниже работают; экраны приложения доступны в переключателе сверху.</p></section>
    <section className="py-8"><h2 className="text-section-title">01 / Цвет</h2><div className="mt-4 grid grid-cols-3 gap-3 sm:grid-cols-6">{[['bg-brand', 'Терракота'], ['bg-accent', 'Апельсин'], ['bg-highlight', 'Мёд'], ['bg-brand-deep', 'Чернила'], ['bg-canvas', 'Молочный'], ['bg-success-soft', 'Шалфей']].map(([color, label]) => <div key={label}><div className={`h-24 rounded-card border border-border ${color}`} /><p className="mt-2 text-xs font-semibold">{label}</p></div>)}</div></section>
    <div className="grid gap-6 md:grid-cols-2">
      <SurfaceCard className="p-6"><h2 className="text-section-title">02 / Golos Text</h2><p className="mt-5 text-display">Вкусные находки</p><p className="mt-5 text-2xl font-bold">Ә Ғ Қ Ң Ө Ұ Ү Һ І</p><p className="mt-3 text-sm leading-6 text-ink-secondary">Текст 14/24 · цены с табличными цифрами · подписи от 11 px · 400–900</p><p className="mt-5 text-commerce-price tabular-nums">2 490 ₸</p></SurfaceCard>
      <SurfaceCard className="p-6"><h2 className="text-section-title">03 / Действия</h2><div className="mt-5 space-y-3"><PrimaryButton onClick={() => setFavorite(!favorite)}>{favorite ? 'Добавлено в избранное' : 'Основное действие'}</PrimaryButton><SecondaryButton onClick={() => setExpanded(!expanded)}>Вторичное действие</SecondaryButton><PrimaryButton disabled aria-busy>Выполняется</PrimaryButton><DangerButton onClick={() => setFavorite(false)}>Отменить</DangerButton></div></SurfaceCard>
      <SurfaceCard className="p-6"><h2 className="text-section-title">04 / Поля и выбор</h2><div className="mt-5"><SearchField value={value} onChange={setValue} label="Поиск боксов" clearLabel="Очистить поиск" /><TextField label="Телефон" value={phoneValue} onValueChange={setPhoneValue} placeholder="+7 700 000 00 00" /><div className="mt-4"><SegmentedControl label="Заказы" value={segment} items={[{ value: 'active', label: 'Активные' }, { value: 'past', label: 'Прошедшие' }]} onChange={setSegment} /></div></div></SurfaceCard>
      <SurfaceCard className="p-6"><h2 className="text-section-title">05 / Торговые компоненты</h2><div className="mt-5 flex flex-wrap gap-2"><StatusBadge tone="accentSolid">−60%</StatusBadge><StatusBadge tone="success">Готов к получению</StatusBadge><StatusBadge tone="danger">Закончились</StatusBadge><StatusBadge tone="warning">Внимание</StatusBadge></div><div className="mt-5 max-w-40"><QuantityStepper quantity={quantity} min={1} max={5} label="Количество" onChange={setQuantity} /></div><div className="mt-5 flex gap-2"><FilterChip selected={favorite} icon={<Icons.Croissant size={18} />} onClick={() => setFavorite(!favorite)}>Пекарни</FilterChip><IconButton label="В избранное" aria-pressed={favorite} onClick={() => setFavorite(!favorite)} tone={favorite ? 'accent' : 'muted'}><Icons.Heart size={20} fill={favorite ? 'currentColor' : 'none'} /></IconButton></div></SurfaceCard>
    </div>
    <section className="py-8"><h2 className="text-section-title">06 / Собственные иконки</h2><div className="mt-5 grid grid-cols-4 gap-3 sm:grid-cols-8">{Object.entries(Icons).sort(([a], [b]) => a.localeCompare(b, 'en')).map(([name, Icon]) => <div key={name} className="rounded-control bg-surface px-2 py-4 text-center"><Icon className="mx-auto text-brand" size={26} /><p className="mt-2 text-[10px] text-ink-muted">{name}</p></div>)}</div></section>
    <div className="grid gap-6 md:grid-cols-2"><NoticeCard icon={<Icons.ShieldCheck size={20} />} title="Состояния с понятным смыслом">Иконка, текст и цвет вместе объясняют, что произошло и что можно сделать дальше.</NoticeCard><AccordionItem title="Как использовать UI kit?" expanded={expanded} onToggle={() => setExpanded(!expanded)}>Используйте готовые примитивы из components/ui-kit.tsx, цвета из app/globals.css и иконки из components/icons.tsx. Полные правила описаны в DESIGN.md.</AccordionItem></div>
    <div className="max-w-md"><EmptyState icon={<Icons.Heart size={36} />} title="Здесь будет что-то любимое" description="Пустое состояние всегда объясняет следующий шаг."><SecondaryButton onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>К компонентам</SecondaryButton></EmptyState></div>
  </main>;
}
