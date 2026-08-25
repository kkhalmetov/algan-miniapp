'use client';
/* eslint-disable @next/next/no-img-element */

import {
  ArrowLeft, Check, ChevronRight, Crosshair, Heart, Home, Info, Languages,
  LocateFixed, Map as MapIcon, Minus, Navigation, PackageCheck, Plus, Search,
  ShoppingBag, Sparkles, Star, UserRound, X,
} from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import LocationMap from '@/components/location-map';
import { authenticateTelegram } from '@/lib/api';
import { boxes, storeById, stores } from '@/lib/mock-data';
import { useAppStore } from '@/lib/store';
import { getCopy, type CopyKey } from '@/lib/translations';
import { haptic, prepareTelegram, telegramProfile } from '@/lib/telegram';
import type { Box, GeocodingResult, Locale, Order, Tab, UserLocation } from '@/lib/types';

const SHYMKENT = { lat: 42.3155, lng: 69.5869 };

const formatPrice = (value: number, locale: Locale) =>
  `${new Intl.NumberFormat(locale === 'kk' ? 'kk-KZ' : 'ru-KZ').format(value)} ₸`;

export default function AlganApp() {
  const {
    hydrated, onboardingDone, profile, location, locale, tab, favoriteStoreIds, orders,
    completeOnboarding, setLocation, setLocale, setTab, toggleFavorite, addOrder, resetDemo,
  } = useAppStore();
  const t = getCopy(locale);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [terms, setTerms] = useState(false);
  const [privacy, setPrivacy] = useState(false);
  const [legal, setLegal] = useState<'terms' | 'privacy' | null>(null);
  const [selectedBox, setSelectedBox] = useState<Box | null>(null);
  const [checkoutBox, setCheckoutBox] = useState<Box | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [successOrder, setSuccessOrder] = useState<Order | null>(null);
  const [category, setCategory] = useState<'all' | 'bakery' | 'cafe' | 'market'>('all');

  useEffect(() => {
    prepareTelegram();
    const telegramRetry = window.setTimeout(() => {
      prepareTelegram();
      const tgProfile = telegramProfile();
      if (!onboardingDone) {
        setFirstName(tgProfile.firstName);
        setLastName(tgProfile.lastName);
        setLocale(tgProfile.locale);
      }
    }, 400);
    void authenticateTelegram().catch(() => undefined);
    return () => window.clearTimeout(telegramRetry);
  }, [onboardingDone, setLocale]);

  const finishOnboarding = () => {
    if (!firstName.trim() || !terms || !privacy) return;
    haptic('success');
    completeOnboarding({
      firstName: firstName.trim(),
      lastName: lastName.trim() || undefined,
      phone: phone.trim() || undefined,
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
      id: `order-${Date.now()}`,
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

  if (!hydrated) return <Splash />;
  if (!onboardingDone) {
    return (
      <PhoneShell>
        <Onboarding
          t={t} locale={locale} setLocale={setLocale}
          firstName={firstName} setFirstName={setFirstName}
          lastName={lastName} setLastName={setLastName}
          phone={phone} setPhone={setPhone}
          terms={terms} setTerms={setTerms} privacy={privacy} setPrivacy={setPrivacy}
          openLegal={setLegal} onContinue={finishOnboarding}
        />
        {legal && <LegalModal type={legal} t={t} onClose={() => setLegal(null)} />}
      </PhoneShell>
    );
  }
  if (!location) {
    return (
      <PhoneShell>
        <LocationStep t={t} locale={locale} onConfirm={(value) => { setLocation(value); haptic('success'); }} />
      </PhoneShell>
    );
  }

  return (
    <PhoneShell>
      <div className="relative flex h-dvh min-h-0 flex-col overflow-hidden bg-[#fffdf8] sm:h-[780px]">
        <main className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto overscroll-contain">
          {tab === 'home' && (
            <HomeTab
              t={t} locale={locale} profileName={profile.firstName} location={location}
              favoriteStoreIds={favoriteStoreIds} category={category} setCategory={setCategory}
              toggleFavorite={toggleFavorite} openBox={openBox}
            />
          )}
          {tab === 'map' && <MapTab t={t} location={location} openBox={openBox} />}
          {tab === 'favorites' && (
            <FavoritesTab t={t} locale={locale} favoriteStoreIds={favoriteStoreIds} toggleFavorite={toggleFavorite} openBox={openBox} />
          )}
          {tab === 'profile' && (
            <ProfileTab t={t} locale={locale} setLocale={setLocale} profile={profile} location={location} orders={orders}
              openLegal={setLegal} resetDemo={resetDemo} openBox={openBox} />
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
        <Success order={successOrder} t={t} onDone={() => { setSuccessOrder(null); setTab('profile'); }} />
      )}
      {legal && <LegalModal type={legal} t={t} onClose={() => setLegal(null)} />}
    </PhoneShell>
  );
}

function Splash() {
  return (
    <main className="grid min-h-dvh place-items-center bg-[#1f5c49] text-white">
      <div className="text-center">
        <span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-[#d9ed9a] text-3xl font-black text-[#173c31]">a</span>
        <p className="mt-4 text-xl font-black">algan</p>
      </div>
    </main>
  );
}

function PhoneShell({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-dvh bg-[#eee7da] text-[#173c31] sm:grid sm:place-items-center sm:px-8 sm:py-6">
      <section className="relative mx-auto min-h-dvh w-full max-w-[460px] overflow-hidden bg-[#fffdf8] sm:min-h-[780px] sm:rounded-[36px] sm:shadow-[0_26px_90px_rgba(24,61,49,0.18)]">
        {children}
      </section>
    </main>
  );
}

type Translator = (key: CopyKey) => string;

function Brand({ light = false }: { light?: boolean }) {
  return (
    <div className={`flex items-center gap-2 text-lg font-black tracking-[-0.04em] ${light ? 'text-white' : 'text-[#173c31]'}`}>
      <span className="grid h-9 w-9 place-items-center rounded-full bg-[#d9ed9a] text-[#173c31]">a</span>
      algan
    </div>
  );
}

interface OnboardingProps {
  t: Translator; locale: Locale; setLocale: (locale: Locale) => void;
  firstName: string; setFirstName: (value: string) => void;
  lastName: string; setLastName: (value: string) => void;
  phone: string; setPhone: (value: string) => void;
  terms: boolean; setTerms: (value: boolean) => void;
  privacy: boolean; setPrivacy: (value: boolean) => void;
  openLegal: (type: 'terms' | 'privacy') => void; onContinue: () => void;
}

function Onboarding(props: OnboardingProps) {
  const { t, locale, setLocale, firstName, setFirstName, lastName, setLastName, phone, setPhone, terms, setTerms, privacy, setPrivacy, openLegal, onContinue } = props;
  const canContinue = Boolean(firstName.trim() && terms && privacy);
  return (
    <div className="flex min-h-dvh flex-col sm:min-h-[780px]">
      <div className="relative overflow-hidden bg-[#1f5c49] px-7 pb-9 pt-[max(1.5rem,env(safe-area-inset-top))] text-white">
        <div className="absolute -right-8 -top-6 h-40 w-40 rounded-full bg-[#f5b968]/20" />
        <div className="absolute -bottom-14 -left-8 h-36 w-36 rounded-full border-[28px] border-[#cce385]/20" />
        <div className="relative flex items-start justify-between">
          <Brand light />
          <LanguagePill locale={locale} setLocale={setLocale} dark />
        </div>
        <div className="relative mt-12">
          <p className="text-sm font-bold text-[#d9ed9a]">{t('slogan')}</p>
          <h1 className="mt-2 max-w-[340px] text-[34px] font-black leading-[1.04] tracking-[-0.05em]">{t('hero')}</h1>
        </div>
      </div>

      <form className="flex flex-1 flex-col px-7 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-7" onSubmit={(event) => { event.preventDefault(); onContinue(); }}>
        <p className="text-sm font-bold text-[#db6f4b]">{t('intro')}</p>
        <h2 className="mt-1 text-2xl font-black tracking-[-0.04em]">{t('askName')}</h2>
        <p className="mt-2 text-sm leading-6 text-[#63736c]">{t('nameHelp')}</p>

        <Field label={t('firstName')} required value={firstName} setValue={setFirstName} placeholder={t('namePlaceholder')} autoComplete="given-name" />
        <div className="grid grid-cols-2 gap-3">
          <Field label={t('lastName')} optional={t('optional')} value={lastName} setValue={setLastName} placeholder={t('lastPlaceholder')} autoComplete="family-name" />
          <Field label={t('phone')} optional={t('optional')} value={phone} setValue={setPhone} placeholder="+7 700 000 00 00" autoComplete="tel" type="tel" />
        </div>

        <div className="mt-5 space-y-3 text-[13px] leading-5 text-[#43574f]">
          <Consent checked={terms} setChecked={setTerms} text={t('terms')} onOpen={() => openLegal('terms')} />
          <Consent checked={privacy} setChecked={setPrivacy} text={t('privacy')} onOpen={() => openLegal('privacy')} />
        </div>

        <button type="submit" disabled={!canContinue} className="primary-button mt-7">{t('continue')}<ChevronRight size={19} /></button>
      </form>
    </div>
  );
}

function Field({ label, optional, required, value, setValue, placeholder, autoComplete, type = 'text' }: {
  label: string; optional?: string; required?: boolean; value: string; setValue: (value: string) => void; placeholder: string; autoComplete: string; type?: string;
}) {
  return (
    <label className="mt-5 block min-w-0 text-sm font-extrabold">
      <span>{label} {required && <span className="text-[#db6f4b]">*</span>}</span>
      {optional && <span className="ml-1 text-[11px] font-medium text-[#8a9791]">({optional})</span>}
      <input type={type} value={value} onChange={(event) => setValue(event.target.value)} placeholder={placeholder} autoComplete={autoComplete}
        className="mt-2 h-13 w-full rounded-2xl border border-[#dde3dd] bg-white px-4 text-[15px] outline-none transition placeholder:text-[#a4ada8] focus:border-[#2d745e] focus:ring-4 focus:ring-[#2d745e]/10" />
    </label>
  );
}

function Consent({ checked, setChecked, text, onOpen }: { checked: boolean; setChecked: (value: boolean) => void; text: string; onOpen: () => void }) {
  const words = text.split(' ');
  const linked = words.slice(Math.max(words.length - 2, 1)).join(' ');
  const prefix = text.slice(0, Math.max(0, text.length - linked.length));
  return (
    <label className="flex cursor-pointer gap-3">
      <input type="checkbox" checked={checked} onChange={(event) => setChecked(event.target.checked)} className="peer sr-only" />
      <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-md border-2 border-[#b9c5bf] bg-white text-white transition peer-checked:border-[#1f5c49] peer-checked:bg-[#1f5c49]"><Check size={14} strokeWidth={3} /></span>
      <span>{prefix}<button type="button" onClick={(event) => { event.preventDefault(); onOpen(); }} className="font-extrabold text-[#1f5c49] underline decoration-[#9ab7ac] underline-offset-2">{linked}</button></span>
    </label>
  );
}

function LanguagePill({ locale, setLocale, dark = false }: { locale: Locale; setLocale: (locale: Locale) => void; dark?: boolean }) {
  return (
    <button onClick={() => setLocale(locale === 'ru' ? 'kk' : 'ru')} className={`flex h-9 items-center gap-1.5 rounded-full px-3 text-xs font-black uppercase ${dark ? 'bg-white/12 text-white' : 'bg-[#edf3ed] text-[#1f5c49]'}`} aria-label="Switch language">
      <Languages size={15} /> {locale === 'ru' ? 'Қаз' : 'Рус'}
    </button>
  );
}

function LocationStep({ t, locale, onConfirm }: { t: Translator; locale: Locale; onConfirm: (location: UserLocation) => void }) {
  const [point, setPoint] = useState(SHYMKENT);
  const [address, setAddress] = useState(t('demoAddress'));
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<GeocodingResult[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const moveMarker = useCallback((lat: number, lng: number) => {
    setPoint({ lat, lng });
    setAddress(`${lat.toFixed(5)}, ${lng.toFixed(5)}`);
  }, []);

  const search = async () => {
    if (!query.trim() || busy) return;
    setBusy(true); setError(''); setResults([]);
    try {
      const base = process.env.NEXT_PUBLIC_GEOCODER_URL ?? 'https://nominatim.openstreetmap.org';
      const params = new URLSearchParams({ format: 'jsonv2', q: `${query}, Шымкент, Казахстан`, countrycodes: 'kz', limit: '5', 'accept-language': locale });
      const response = await fetch(`${base.replace(/\/$/, '')}/search?${params}`);
      const data = await response.json() as GeocodingResult[];
      if (!data.length) setError(t('searchError'));
      setResults(data);
    } catch {
      setError(t('searchError'));
    } finally {
      setBusy(false);
    }
  };

  const locate = () => {
    if (!navigator.geolocation) { setError(t('locateError')); return; }
    setBusy(true); setError('');
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => { setPoint({ lat: coords.latitude, lng: coords.longitude }); setAddress(t('currentLocation')); setBusy(false); },
      () => { setError(t('locateError')); setBusy(false); },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };

  return (
    <div className="flex min-h-dvh flex-col bg-[#fffdf8] sm:min-h-[780px]">
      <header className="px-6 pb-4 pt-[max(1.4rem,env(safe-area-inset-top))]">
        <Brand />
        <p className="mt-7 text-sm font-bold text-[#db6f4b]">2 / 2</p>
        <h1 className="mt-1 text-[29px] font-black tracking-[-0.045em]">{t('chooseLocation')}</h1>
        <p className="mt-2 text-sm leading-6 text-[#63736c]">{t('locationHelp')}</p>
      </header>

      <div className="px-6">
        <div className="flex gap-2">
          <label className="flex h-13 flex-1 items-center gap-2 rounded-2xl border border-[#dce3dc] bg-white px-4 focus-within:border-[#2d745e]">
            <Search size={18} className="text-[#77867f]" />
            <input value={query} onChange={(event) => setQuery(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') { event.preventDefault(); void search(); } }}
              placeholder={t('addressPlaceholder')} className="min-w-0 flex-1 bg-transparent text-sm outline-none" />
          </label>
          <button onClick={() => void search()} className="grid h-13 w-13 place-items-center rounded-2xl bg-[#1f5c49] text-white" aria-label={t('search')}><Search size={20} /></button>
        </div>
        {error && <p className="mt-2 rounded-xl bg-[#fff0ea] px-3 py-2 text-xs font-semibold text-[#a84425]">{error}</p>}
        {results.length > 0 && (
          <div className="absolute left-6 right-6 z-[700] mt-2 max-h-48 overflow-y-auto rounded-2xl border border-[#dfe4df] bg-white p-1 shadow-xl">
            {results.map((result) => (
              <button key={`${result.lat}-${result.lon}`} onClick={() => {
                setPoint({ lat: Number(result.lat), lng: Number(result.lon) }); setAddress(result.display_name); setResults([]); setQuery('');
              }} className="w-full rounded-xl px-3 py-3 text-left text-xs leading-5 hover:bg-[#f2f5f1]">
                {result.display_name}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="relative mt-4 flex-1 overflow-hidden">
        <LocationMap lat={point.lat} lng={point.lng} interactiveMarker onChange={moveMarker} className="absolute inset-0" />
        <button onClick={locate} disabled={busy} className="absolute bottom-5 left-1/2 z-[600] flex h-11 -translate-x-1/2 items-center gap-2 rounded-full bg-white px-4 text-xs font-black shadow-lg disabled:opacity-60">
          <LocateFixed size={17} className="text-[#db6f4b]" /> {busy ? t('searching') : t('currentLocation')}
        </button>
      </div>

      <div className="rounded-t-[28px] bg-[#fffdf8] px-6 pb-[max(1.4rem,env(safe-area-inset-bottom))] pt-5 shadow-[0_-18px_45px_rgba(23,60,49,0.08)]">
        <div className="flex items-start gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[#e8f1d0] text-[#1f5c49]"><Navigation size={19} /></span>
          <div className="min-w-0"><p className="text-xs font-semibold text-[#7a8982]">{t('location')}</p><p className="mt-1 line-clamp-2 text-sm font-black">{address}</p></div>
        </div>
        <button onClick={() => onConfirm({ ...point, address })} className="primary-button mt-4">{t('confirmLocation')}<Check size={19} /></button>
      </div>
    </div>
  );
}

function HomeTab({ t, locale, profileName, location, favoriteStoreIds, category, setCategory, toggleFavorite, openBox }: {
  t: Translator; locale: Locale; profileName: string; location: UserLocation; favoriteStoreIds: string[];
  category: 'all' | 'bakery' | 'cafe' | 'market'; setCategory: (value: 'all' | 'bakery' | 'cafe' | 'market') => void;
  toggleFavorite: (id: string) => void; openBox: (box: Box) => void;
}) {
  const filtered = category === 'all' ? boxes : boxes.filter((box) => storeById(box.storeId).type === category);
  return (
    <>
      <header className="bg-[#1f5c49] px-6 pb-8 pt-[max(1.4rem,env(safe-area-inset-top))] text-white">
        <div className="mt-2 flex items-end justify-between gap-4">
          <div><p className="text-sm text-white/70">{t('greeting')},</p><h1 className="mt-0.5 text-[30px] font-black tracking-[-0.045em]">{profileName}!</h1></div>
          <div className="h-12 w-12 overflow-hidden rounded-full border-2 border-white/30 bg-[#d9ed9a] text-center text-2xl font-black leading-[44px] text-[#173c31]">{profileName[0]?.toUpperCase()}</div>
        </div>
        <button className="mt-5 flex w-full items-center gap-3 rounded-2xl bg-white/10 px-4 py-3 text-left">
          <Navigation size={18} className="shrink-0 text-[#d9ed9a]" />
          <span className="min-w-0 flex-1"><span className="block text-[10px] font-semibold text-white/60">{t('location')}</span><span className="block truncate text-sm font-extrabold">{location.address}</span></span>
          <ChevronRight size={17} className="text-white/50" />
        </button>
      </header>

      <section className="-mt-1 rounded-t-[28px] bg-[#fffdf8] px-5 pt-6">
        <div className="relative overflow-hidden rounded-[26px] bg-[#d9ed9a] p-5">
          <div className="absolute -right-5 -top-8 h-28 w-28 rounded-full bg-white/35" />
          <Sparkles size={22} className="text-[#db6f4b]" />
          <h2 className="mt-4 max-w-[250px] text-xl font-black tracking-[-0.035em]">{t('impactTitle')}</h2>
          <p className="mt-2 max-w-[270px] text-xs leading-5 text-[#3c5c50]">{t('impactText')}</p>
        </div>

        <div className="hide-scrollbar -mx-5 mt-6 flex gap-2 overflow-x-auto px-5">
          {(['all', 'bakery', 'cafe', 'market'] as const).map((item) => (
            <button key={item} onClick={() => setCategory(item)} className={`shrink-0 rounded-full px-4 py-2.5 text-xs font-black transition ${category === item ? 'bg-[#1f5c49] text-white' : 'bg-[#edf1eb] text-[#50645b]'}`}>{t(item)}</button>
          ))}
        </div>

        <div className="mt-7 flex items-center justify-between"><h2 className="text-xl font-black tracking-[-0.035em]">{t('nearby')}</h2><span className="text-xs font-bold text-[#db6f4b]">{filtered.length}</span></div>
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
    <article className="overflow-hidden rounded-[24px] border border-[#e3e7e1] bg-white shadow-[0_9px_30px_rgba(30,72,58,0.07)]">
      <button onClick={onOpen} className="relative block h-44 w-full overflow-hidden text-left">
        <img src={box.image} alt="" className="h-full w-full object-cover transition duration-500 hover:scale-105" />
        <span className="absolute left-3 top-3 rounded-full bg-[#db6f4b] px-3 py-1.5 text-[11px] font-black text-white">−{discount}%</span>
      </button>
      <div className="p-4">
        <div className="flex items-start gap-3">
          <button onClick={onOpen} className="min-w-0 flex-1 text-left">
            <p className="flex items-center gap-1 text-xs font-bold text-[#718078]"><Star size={13} fill="#f5b968" strokeWidth={0} />{store.rating} · {store.name}</p>
            <h3 className="mt-1 truncate text-lg font-black tracking-[-0.03em]">{box.name}</h3>
          </button>
          <button onClick={toggleFavorite} aria-label={t('favorites')} className={`grid h-10 w-10 place-items-center rounded-full ${favorite ? 'bg-[#ffe9e1] text-[#db6f4b]' : 'bg-[#f1f3ef] text-[#65766e]'}`}><Heart size={19} fill={favorite ? 'currentColor' : 'none'} /></button>
        </div>
        <div className="mt-4 flex items-end justify-between gap-3">
          <div><p className="text-xs text-[#849088] line-through">{formatPrice(box.originalPrice, locale)}</p><p className="text-lg font-black text-[#1f5c49]">{formatPrice(box.salePrice, locale)}</p></div>
          <div className="text-right"><p className="text-[11px] font-bold text-[#db6f4b]">{box.quantity} {t('left')}</p><p className="mt-1 text-xs font-semibold text-[#607169]">{box.pickupFrom}–{box.pickupTo}</p></div>
        </div>
      </div>
    </article>
  );
}

function MapTab({ t, location, openBox }: { t: Translator; location: UserLocation; openBox: (box: Box) => void }) {
  const [storeId, setStoreId] = useState<string | null>(null);
  const selected = storeId ? boxes.find((box) => box.storeId === storeId) : null;
  const selectStore = useCallback((id: string) => setStoreId(id), []);
  return (
    <div className="relative min-h-[calc(100dvh-98px)] sm:min-h-[682px]">
      <header className="absolute left-4 right-4 top-[max(1rem,env(safe-area-inset-top))] z-[600] flex items-center justify-between rounded-2xl bg-white/95 px-4 py-3 shadow-lg backdrop-blur">
        <div><p className="text-[10px] font-bold text-[#7d8983]">{t('map')}</p><h1 className="text-base font-black">Шымкент · {boxes.length} бокса</h1></div>
        <button className="grid h-10 w-10 place-items-center rounded-full bg-[#eaf2d7] text-[#1f5c49]"><Crosshair size={19} /></button>
      </header>
      <LocationMap lat={location.lat} lng={location.lng} stores={stores} onSelectStore={selectStore} className="absolute inset-0" />
      {selected && (
        <button onClick={() => openBox(selected)} className="absolute bottom-5 left-4 right-4 z-[600] flex gap-3 rounded-[22px] bg-white p-3 text-left shadow-[0_18px_50px_rgba(23,60,49,0.22)]">
          <img src={selected.image} alt="" className="h-20 w-20 rounded-2xl object-cover" />
          <span className="min-w-0 flex-1 py-1"><span className="block text-xs font-bold text-[#738078]">{storeById(selected.storeId).name}</span><span className="mt-1 block truncate text-base font-black">{selected.name}</span><span className="mt-2 block text-sm font-black text-[#1f5c49]">{formatPrice(selected.salePrice, 'ru')}</span></span>
          <ChevronRight className="mt-7 text-[#829087]" size={19} />
        </button>
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
        <div className="mt-20 text-center">
          <span className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-[#ffe9e1] text-[#db6f4b]"><Heart size={34} /></span>
          <h2 className="mx-auto mt-6 max-w-[280px] text-xl font-black">{t('noFavorites')}</h2>
          <p className="mx-auto mt-2 max-w-[280px] text-sm leading-6 text-[#6d7c75]">{t('noFavoritesText')}</p>
        </div>
      ) : (
        <div className="mt-6 space-y-4">
          {favoriteBoxes.map((box) => <BoxCard key={box.id} box={box} locale={locale} t={t} favorite toggleFavorite={() => toggleFavorite(box.storeId)} onOpen={() => openBox(box)} />)}
        </div>
      )}
    </section>
  );
}

function ProfileTab({ t, locale, setLocale, profile, location, orders, openLegal, resetDemo, openBox }: {
  t: Translator; locale: Locale; setLocale: (locale: Locale) => void; profile: { firstName: string; lastName?: string; phone?: string };
  location: UserLocation; orders: Order[]; openLegal: (type: 'terms' | 'privacy') => void; resetDemo: () => void; openBox: (box: Box) => void;
}) {
  return (
    <section className="pb-8">
      <header className="bg-[#1f5c49] px-6 pb-8 pt-[max(1.5rem,env(safe-area-inset-top))] text-white">
        <div className="mt-2 flex items-center gap-4">
          <div className="grid h-16 w-16 place-items-center rounded-full bg-[#d9ed9a] text-2xl font-black text-[#173c31]">{profile.firstName[0]?.toUpperCase()}</div>
          <div><h1 className="text-2xl font-black">{profile.firstName} {profile.lastName}</h1><p className="mt-1 text-sm text-white/65">{profile.phone || 'Telegram Mini App'}</p></div>
        </div>
      </header>

      <div className="-mt-1 rounded-t-[28px] bg-[#fffdf8] px-5 pt-6">
        <h2 className="text-lg font-black">{t('orders')}</h2>
        {orders.length === 0 ? (
          <div className="mt-3 flex items-center gap-3 rounded-2xl bg-[#f1f4ef] p-4 text-sm text-[#66756e]"><ShoppingBag size={20} /> {t('noFavoritesText')}</div>
        ) : (
          <div className="mt-3 space-y-3">
            {orders.map((order) => {
              const box = boxes.find((item) => item.id === order.boxId)!;
              return (
                <button key={order.id} onClick={() => openBox(box)} className="flex w-full items-center gap-3 rounded-2xl border border-[#e0e6df] bg-white p-3 text-left">
                  <img src={box.image} alt="" className="h-14 w-14 rounded-xl object-cover" />
                  <span className="min-w-0 flex-1"><span className="block truncate text-sm font-black">{box.name}</span><span className="mt-1 block text-xs text-[#74827b]">{t('pickupCode')}: <b className="text-[#1f5c49]">{order.pickupCode}</b></span></span>
                  <ChevronRight size={18} className="text-[#87938d]" />
                </button>
              );
            })}
          </div>
        )}

        <div className="mt-7 space-y-2">
          <ProfileRow icon={<UserRound size={18} />} label={t('personal')} value={`${profile.firstName} ${profile.lastName ?? ''}`.trim()} />
          <ProfileRow icon={<Navigation size={18} />} label={t('location')} value={location.address} />
          <ProfileRow icon={<Languages size={18} />} label={t('language')} value={locale === 'ru' ? 'Русский' : 'Қазақша'} onClick={() => setLocale(locale === 'ru' ? 'kk' : 'ru')} />
          <ProfileRow icon={<Info size={18} />} label={t('termsTitle')} onClick={() => openLegal('terms')} />
          <ProfileRow icon={<PackageCheck size={18} />} label={t('privacyTitle')} onClick={() => openLegal('privacy')} />
        </div>
        <button onClick={() => { if (window.confirm(t('signOutDemo'))) resetDemo(); }} className="mt-6 w-full rounded-2xl bg-[#fff0ea] px-4 py-4 text-sm font-black text-[#b44b2b]">{t('signOutDemo')}</button>
        <p className="mt-5 text-center text-[11px] font-semibold text-[#98a29d]">Algan MVP · 0.1.0</p>
      </div>
    </section>
  );
}

function ProfileRow({ icon, label, value, onClick }: { icon: React.ReactNode; label: string; value?: string; onClick?: () => void }) {
  return (
    <button onClick={onClick} disabled={!onClick} className="flex w-full items-center gap-3 rounded-2xl bg-[#f2f5f1] p-4 text-left disabled:opacity-100">
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white text-[#1f5c49]">{icon}</span>
      <span className="min-w-0 flex-1"><span className="block text-sm font-black">{label}</span>{value && <span className="mt-0.5 block truncate text-xs text-[#74817b]">{value}</span>}</span>
      {onClick && <ChevronRight size={17} className="text-[#89958f]" />}
    </button>
  );
}

function BottomNav({ tab, setTab, t }: { tab: Tab; setTab: (tab: Tab) => void; t: Translator }) {
  const items: { id: Tab; icon: React.ReactNode; label: CopyKey }[] = [
    { id: 'home', icon: <Home size={21} />, label: 'home' },
    { id: 'map', icon: <MapIcon size={21} />, label: 'map' },
    { id: 'favorites', icon: <Heart size={21} />, label: 'favorites' },
    { id: 'profile', icon: <UserRound size={21} />, label: 'profile' },
  ];
  return (
    <nav className="z-[800] shrink-0 border-t border-[#e3e7e2] bg-[#fffdf8]/95 px-3 pb-[max(.6rem,env(safe-area-inset-bottom))] pt-2 backdrop-blur-xl">
      <div className="grid grid-cols-4">
        {items.map((item) => (
          <button key={item.id} onClick={() => { setTab(item.id); haptic('tap'); }} className={`flex min-h-14 flex-col items-center justify-center gap-1 rounded-xl text-[10px] font-black transition ${tab === item.id ? 'text-[#1f5c49]' : 'text-[#89958f]'}`}>
            <span className={`grid h-8 w-12 place-items-center rounded-full ${tab === item.id ? 'bg-[#dceab3]' : ''}`}>{item.icon}</span>{t(item.label)}
          </button>
        ))}
      </div>
    </nav>
  );
}

function Overlay({ children, onClose, full = false }: { children: React.ReactNode; onClose: () => void; full?: boolean }) {
  return (
    <div className="absolute inset-0 z-[1000] flex items-end bg-[#102b22]/40 backdrop-blur-[2px]" role="dialog" aria-modal="true">
      <button onClick={onClose} className="absolute inset-0" aria-label="Close" />
      <section className={`relative z-10 w-full overflow-hidden bg-[#fffdf8] ${full ? 'min-h-full' : 'max-h-[92%] rounded-t-[30px]'}`}>{children}</section>
    </div>
  );
}

function BoxDetails({ box, locale, t, isFavorite, toggleFavorite, onClose, onBuy }: {
  box: Box; locale: Locale; t: Translator; isFavorite: boolean; toggleFavorite: () => void; onClose: () => void; onBuy: () => void;
}) {
  const store = storeById(box.storeId);
  const discount = Math.round((1 - box.salePrice / box.originalPrice) * 100);
  return (
    <Overlay onClose={onClose} full>
      <div className="h-full overflow-y-auto pb-[max(1.5rem,env(safe-area-inset-bottom))]">
        <div className="relative h-[310px]">
          <img src={box.image} alt="" className="h-full w-full object-cover" />
          <div className="absolute inset-x-0 top-0 flex justify-between px-5 pt-[max(1.2rem,env(safe-area-inset-top))]">
            <button onClick={onClose} className="grid h-11 w-11 place-items-center rounded-full bg-white/92 shadow-lg"><ArrowLeft size={20} /></button>
            <button onClick={toggleFavorite} className={`grid h-11 w-11 place-items-center rounded-full shadow-lg ${isFavorite ? 'bg-[#ffe9e1] text-[#db6f4b]' : 'bg-white/92'}`}><Heart size={20} fill={isFavorite ? 'currentColor' : 'none'} /></button>
          </div>
          <span className="absolute bottom-4 left-5 rounded-full bg-[#db6f4b] px-3 py-1.5 text-xs font-black text-white">−{discount}% {t('discount')}</span>
        </div>
        <div className="-mt-3 rounded-t-[28px] bg-[#fffdf8] px-6 pb-5 pt-6">
          <p className="flex items-center gap-1 text-sm font-bold text-[#6c7a73]"><Star size={15} fill="#f5b968" strokeWidth={0} />{store.rating} · {store.name}</p>
          <h1 className="mt-2 text-[29px] font-black tracking-[-0.045em]">{box.name}</h1>
          <p className="mt-3 text-sm leading-6 text-[#5e7068]">{box.description}</p>
          <div className="mt-5 flex items-center justify-between rounded-2xl bg-[#edf3db] p-4">
            <div><p className="text-xs text-[#78857e] line-through">{formatPrice(box.originalPrice, locale)}</p><p className="text-2xl font-black text-[#1f5c49]">{formatPrice(box.salePrice, locale)}</p></div>
            <div className="text-right"><p className="text-xs font-bold text-[#68776f]">{t('pickup')}</p><p className="mt-1 text-sm font-black">{box.pickupFrom}–{box.pickupTo}</p></div>
          </div>
          <h2 className="mt-6 text-lg font-black">{t('composition')}</h2>
          <p className="mt-2 text-sm leading-6 text-[#617169]">{t('surprise')}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            {box.isHalal && <span className="rounded-full bg-[#e4f1dd] px-3 py-2 text-xs font-black text-[#34714b]">{t('halal')}</span>}
            {box.allergens && <span className="rounded-full bg-[#fff0ea] px-3 py-2 text-xs font-bold text-[#a44c30]">{t('allergens')}: {box.allergens}</span>}
          </div>
          <div className="mt-5 flex items-start gap-3 rounded-2xl bg-[#f2f4f1] p-4">
            <Navigation size={19} className="mt-0.5 shrink-0 text-[#db6f4b]" /><div><p className="text-sm font-black">{store.address}</p><p className="mt-1 text-xs text-[#74817b]">{box.distanceKm} км</p></div>
          </div>
          <button onClick={onBuy} disabled={box.quantity < 1} className="primary-button mt-6">{t('buy')}<ShoppingBag size={19} /></button>
        </div>
      </div>
    </Overlay>
  );
}

function Checkout({ box, quantity, setQuantity, locale, t, onClose, onPay }: {
  box: Box; quantity: number; setQuantity: (value: number) => void; locale: Locale; t: Translator; onClose: () => void; onPay: () => void;
}) {
  return (
    <Overlay onClose={onClose}>
      <div className="px-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-5">
        <div className="mx-auto h-1.5 w-10 rounded-full bg-[#d6ddd8]" />
        <div className="mt-5 flex items-center justify-between"><h2 className="text-2xl font-black tracking-[-0.04em]">{t('demoPayment')}</h2><button onClick={onClose} className="grid h-9 w-9 place-items-center rounded-full bg-[#edf1ed]"><X size={18} /></button></div>
        <div className="mt-5 flex gap-4 rounded-2xl bg-[#f1f4ef] p-3">
          <img src={box.image} alt="" className="h-20 w-20 rounded-xl object-cover" />
          <div className="min-w-0 flex-1 py-1"><p className="truncate text-base font-black">{box.name}</p><p className="mt-1 text-xs text-[#718078]">{storeById(box.storeId).name}</p><p className="mt-2 text-sm font-black text-[#1f5c49]">{formatPrice(box.salePrice, locale)}</p></div>
        </div>
        <div className="mt-5 flex items-center justify-between">
          <span className="text-sm font-black">{t('quantity')}</span>
          <div className="flex items-center gap-3">
            <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="grid h-10 w-10 place-items-center rounded-full bg-[#edf1ed]" disabled={quantity <= 1}><Minus size={17} /></button>
            <span className="w-5 text-center text-lg font-black">{quantity}</span>
            <button onClick={() => setQuantity(Math.min(box.quantity, quantity + 1))} className="grid h-10 w-10 place-items-center rounded-full bg-[#1f5c49] text-white" disabled={quantity >= box.quantity}><Plus size={17} /></button>
          </div>
        </div>
        <div className="my-5 h-px bg-[#e1e5e1]" />
        <div className="flex items-end justify-between"><span className="text-sm font-bold text-[#607169]">{t('total')}</span><span className="text-2xl font-black">{formatPrice(box.salePrice * quantity, locale)}</span></div>
        <p className="mt-4 flex gap-2 rounded-2xl bg-[#fff3c9] p-3 text-xs leading-5 text-[#765f17]"><Info size={17} className="mt-0.5 shrink-0" />{t('paymentNote')}</p>
        <button onClick={onPay} className="primary-button mt-5">{t('pay')}<ChevronRight size={19} /></button>
      </div>
    </Overlay>
  );
}

function Success({ order, t, onDone }: { order: Order; t: Translator; onDone: () => void }) {
  return (
    <Overlay onClose={onDone} full>
      <div className="flex min-h-dvh flex-col items-center justify-center px-7 pb-[max(1.5rem,env(safe-area-inset-bottom))] text-center sm:min-h-[780px]">
        <div className="relative grid h-28 w-28 place-items-center rounded-full bg-[#d9ed9a] text-[#1f5c49]">
          <Check size={52} strokeWidth={3} />
          <Sparkles className="absolute -right-3 -top-2 text-[#db6f4b]" size={28} />
        </div>
        <h1 className="mt-8 text-[34px] font-black tracking-[-0.05em]">{t('success')}</h1>
        <p className="mt-3 max-w-[300px] text-sm leading-6 text-[#617169]">{t('successText')}</p>
        <div className="mt-8 w-full rounded-[26px] bg-[#1f5c49] p-6 text-white">
          <p className="text-xs font-bold text-white/60">{t('pickupCode')}</p>
          <p className="mt-2 text-5xl font-black tracking-[0.16em]">{order.pickupCode}</p>
        </div>
        <button onClick={onDone} className="primary-button mt-8">{t('toOrders')}<ChevronRight size={19} /></button>
      </div>
    </Overlay>
  );
}

function LegalModal({ type, t, onClose }: { type: 'terms' | 'privacy'; t: Translator; onClose: () => void }) {
  return (
    <Overlay onClose={onClose}>
      <div className="px-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-5">
        <div className="flex items-center justify-between"><h2 className="text-xl font-black">{type === 'terms' ? t('termsTitle') : t('privacyTitle')}</h2><button onClick={onClose} className="grid h-9 w-9 place-items-center rounded-full bg-[#edf1ed]"><X size={18} /></button></div>
        <div className="mt-5 rounded-2xl bg-[#fff3c9] p-4 text-sm leading-6 text-[#6f5b1e]"><Info size={20} className="mb-3" />{t('placeholderLegal')}</div>
        <button onClick={onClose} className="primary-button mt-5">{t('back')}</button>
      </div>
    </Overlay>
  );
}
