'use client';
/* eslint-disable @next/next/no-img-element */

import { Clock3, Heart, MapPin, Package } from 'lucide-react';
import { memo } from 'react';
import { AlganLogo } from '@/components/algan-logo';
import { usePriceFormatter } from '@/components/algan/price-context';
import type { Translator } from '@/components/algan/types';
import { BrandHeader, CardPressable, CardTitle, EmptyState, IconButton, MediaBadge, PageSection, PageTitle, ScreenBody, StatusBadge, SurfaceCard } from '@/components/ui-kit';
import { availableQuantity, localizedFirstName } from '@/lib/app-utils';
import { boxName, storeAddress } from '@/lib/catalog-localization';
import { boxes, storeById } from '@/lib/mock-data';
import { formatBoxesLeft } from '@/lib/stock';
import type { Box, Locale, Store, UserProfile } from '@/lib/types';

export const HomeTab = memo(function HomeTab({ t, locale, profile, favoriteBoxIds, toggleFavoriteBox, openBox, purchasedBoxQuantities }: {
  t: Translator;
  locale: Locale;
  profile: UserProfile;
  favoriteBoxIds: string[];
  toggleFavoriteBox: (id: string) => void;
  openBox: (box: Box) => void;
  purchasedBoxQuantities: Record<string, number>;
}) {
  const firstName = localizedFirstName(profile, t('fallbackUser'));
  return (
    <>
      <BrandHeader>
        <div aria-hidden="true" className="absolute -right-10 -top-14 h-44 w-44 rounded-full bg-brand-hover" />
        <div className="relative"><AlganLogo light markClassName="h-8 w-8" wordmarkClassName="h-6 w-[73px]" /></div>
        <div className="relative mt-7 min-w-0">
          <p className="text-sm font-medium text-white/75">{t('greeting')},</p>
          <PageTitle tone="inverse" className="mt-0.5 truncate">{firstName}!</PageTitle>
        </div>
      </BrandHeader>

      <ScreenBody>
        <div className="space-y-4 pb-7">
          {boxes.map((box, index) => (
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
              priority={index === 0}
            />
          ))}
        </div>
      </ScreenBody>
    </>
  );
});

function MarketplaceBoxCard({ box, store, t, locale, favorite, toggleFavorite, onOpen, available, priority = false }: {
  box: Box;
  store: Store;
  t: Translator;
  locale: Locale;
  favorite: boolean;
  toggleFavorite: () => void;
  onOpen: () => void;
  available: number;
  priority?: boolean;
}) {
  const formatPrice = usePriceFormatter(locale);
  const discount = Math.round((1 - box.salePrice / box.originalPrice) * 100);
  const name = boxName(box, locale);
  const address = storeAddress(store, locale);
  const soldOut = available < 1;
  return (
    <SurfaceCard data-testid="marketplace-box-card" tone={soldOut ? 'muted' : 'panel'} className="relative overflow-hidden transition" data-sold-out={soldOut || undefined}>
      <CardPressable onClick={onOpen} disabled={soldOut} aria-label={`${t('details')}: ${name}, ${store.name}`} className="group overflow-hidden rounded-card disabled:cursor-default">
        <span className={`relative block h-44 overflow-hidden bg-canvas ${soldOut ? 'opacity-55 grayscale' : ''}`}>
          <img src={box.image} alt={name} width={920} height={600} loading={priority ? 'eager' : 'lazy'} fetchPriority={priority ? 'high' : 'auto'} decoding="async" className="h-full w-full object-cover transition duration-[var(--motion-slow)] group-hover:scale-[1.03] group-disabled:scale-100" />
          <span aria-hidden="true" className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-brand-deep/55 to-transparent" />
          <MediaBadge className="absolute bottom-3 left-3 border-3 border-panel"><img src={store.logo} alt="" className="h-9 w-9 object-contain" /></MediaBadge>
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
        <IconButton onClick={toggleFavorite} label={`${t('favorites')}: ${name}`} aria-pressed={favorite} tone={favorite ? 'floatingAccent' : 'floating'} className="absolute right-3 top-3 z-20">
          <Heart size={19} fill={favorite ? 'currentColor' : 'none'} />
        </IconButton>
      )}
    </SurfaceCard>
  );
}

export function SurpriseBadge({ compact = false }: { compact?: boolean }) {
  return (
    <span data-surprise-variant={compact ? 'compact' : 'default'} className={`inline-flex shrink-0 items-center rounded-full border border-brand/20 bg-highlight font-black tracking-[0.08em] text-brand-deep shadow-card ${compact ? 'min-h-6 gap-1 px-2 py-1 text-[9px]' : 'min-h-8 gap-1.5 px-2.5 py-1.5 text-[10px]'}`}>
      <SurpriseBoxIcon compact={compact} />
      SURPRISE
    </span>
  );
}

function SurpriseBoxIcon({ compact }: { compact: boolean }) {
  return (
    <svg data-testid="surprise-box-icon" aria-hidden="true" viewBox="0 0 18 18" fill="none" className={compact ? 'h-3.5 w-3.5' : 'h-4 w-4'}>
      <path d="M3.25 7.5 9 10.5l5.75-3M3.75 8.75v4.75L9 16l5.25-2.5V8.75M9 10.5V16" stroke="currentColor" strokeWidth="1.55" strokeLinecap="round" strokeLinejoin="round" />
      <path d="m3.25 7.5 2.5-2.25L9 7l3.25-1.75 2.5 2.25L9 10.5 3.25 7.5Z" fill="currentColor" fillOpacity=".12" stroke="currentColor" strokeWidth="1.55" strokeLinejoin="round" />
      <path d="M14.25 1.5v3M12.75 3h3" stroke="currentColor" strokeWidth="1.55" strokeLinecap="round" />
    </svg>
  );
}

export function FavoritesTab({ t, locale, favoriteBoxIds, toggleFavoriteBox, openBox, purchasedBoxQuantities }: {
  t: Translator;
  locale: Locale;
  favoriteBoxIds: string[];
  toggleFavoriteBox: (id: string) => void;
  openBox: (box: Box) => void;
  purchasedBoxQuantities: Record<string, number>;
}) {
  const favoriteBoxes = boxes.filter((box) => favoriteBoxIds.includes(box.id));
  return (
    <PageSection title={t('favorites')}>
      {favoriteBoxes.length === 0 ? (
        <EmptyState icon={<Heart size={34} />} title={t('noFavorites')} description={t('noFavoritesText')} tone="accent" />
      ) : (
        <div className="mt-6 space-y-4">
          {favoriteBoxes.map((box) => (
            <MarketplaceBoxCard key={box.id} box={box} store={storeById(box.storeId)} t={t} locale={locale} favorite toggleFavorite={() => toggleFavoriteBox(box.id)} onOpen={() => openBox(box)} available={availableQuantity(box, purchasedBoxQuantities)} />
          ))}
        </div>
      )}
    </PageSection>
  );
}
