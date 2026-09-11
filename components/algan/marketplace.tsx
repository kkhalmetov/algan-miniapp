'use client';
/* eslint-disable @next/next/no-img-element */

import { ArrowUpRight, Check, Clock3, Coffee, Cookie, Croissant, FlaskConical, Heart, LayoutGrid, Leaf, MapPin, Package, Search, ShoppingBag, SlidersHorizontal, Sparkles, Star } from '@/components/icons';
import { memo, useState, type ReactNode } from 'react';
import { AlganLogo } from '@/components/algan-logo';
import { usePriceFormatter } from '@/components/algan/price-context';
import type { Translator } from '@/components/algan/types';
import { BrandHeader, CardPressable, CardTitle, DialogLayer, EmptyState, FilterChip, IconButton, MediaBadge, ModalBody, PageSection, PrimaryButton, ScreenBody, ScrollArea, SearchField, SectionTitle, SheetHeader, StatusBadge, SurfaceCard, TertiaryButton } from '@/components/ui-kit';
import { availableQuantity, localizedFirstName } from '@/lib/app-utils';
import { boxName, storeAddress } from '@/lib/catalog-localization';
import { DEFAULT_CATALOG_FILTERS, queryCatalog, type CatalogCategory, type CatalogFilters, type CatalogSort } from '@/lib/catalog-query';
import { boxes, storeById, stores } from '@/lib/mock-data';
import { IS_DEMO_RELEASE } from '@/lib/release';
import { formatBoxesLeft } from '@/lib/stock';
import type { Box, Locale, Store, UserProfile } from '@/lib/types';
import type { CopyKey } from '@/lib/translations';

const categories: { id: CatalogCategory; label: CopyKey; icon: ReactNode }[] = [
  { id: 'all', label: 'all', icon: <LayoutGrid size={16} /> },
  { id: 'bakery', label: 'bakery', icon: <Croissant size={17} /> },
  { id: 'cafe', label: 'cafe', icon: <Coffee size={17} /> },
  { id: 'dessert', label: 'dessert', icon: <Cookie size={17} /> },
  { id: 'market', label: 'market', icon: <Leaf size={17} /> },
];

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
  const [filters, setFilters] = useState<CatalogFilters>(DEFAULT_CATALOG_FILTERS);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const visibleBoxes = queryCatalog(boxes, stores, filters, locale, purchasedBoxQuantities);
  const filterCount = Number(filters.availableOnly) + Number(filters.halalOnly) + Number(filters.sort !== 'recommended');
  const maxDiscount = Math.max(...boxes.map((box) => Math.round((1 - box.salePrice / box.originalPrice) * 100)));
  return (
    <>
      <BrandHeader className="pb-4">
        <div className="flex items-center justify-between gap-3">
          <AlganLogo markClassName="h-10 w-10" wordmarkClassName="h-9 w-[91px]" />
          <span className="flex items-center gap-1.5 text-xs font-bold text-ink"><MapPin size={15} className="text-brand" />{t('city')}</span>
        </div>
        <div className="algan-hero mt-5 min-h-40 px-5 py-5">
          <p className="relative z-10 max-w-[75%] text-[11px] font-semibold text-ink-muted">{t('greeting')}, <span>{firstName}!</span></p>
          <h1 className="relative z-10 mt-2 max-w-[73%] text-[27px] font-extrabold leading-[1.08] tracking-[-.045em]">{t('homeHeadline')}<br /><span className="text-brand">{t('homeHeadlineAccent')}</span></h1>
          <p className="relative z-10 mt-4 inline-flex items-center gap-1.5 rounded-full bg-highlight px-2.5 py-1 text-[10px] font-extrabold"><Sparkles size={12} />{t('upToDiscount')} −{maxDiscount}%</p>
          <img className="algan-hero-art" src="/images/algan-good-bag.svg" alt="" aria-hidden="true" width={180} height={220} />
        </div>
      </BrandHeader>

      <ScreenBody flush>
        <div className="flex items-center gap-2">
          <SearchField value={filters.query} onChange={(query) => setFilters((current) => ({ ...current, query }))} label={t('searchOffers')} clearLabel={t('clearSearch')} />
          <IconButton label={t('filters')} onClick={() => setFiltersOpen(true)} tone={filterCount ? 'brand' : 'muted'} className="relative"><SlidersHorizontal size={19} />{filterCount > 0 && <span className="absolute -right-1 -top-1 rounded-full bg-highlight px-1.5 text-[10px] font-bold text-ink">{filterCount}</span>}</IconButton>
        </div>
        <div className="algan-categories -mr-page mt-3 pr-page sm:-mr-page-wide sm:pr-page-wide" role="group" aria-label={t('categories')}>
          {categories.map((item) => <FilterChip key={item.id} selected={filters.category === item.id} icon={item.icon} onClick={() => setFilters((current) => ({ ...current, category: item.id }))}>{t(item.label)}</FilterChip>)}
        </div>
        <div className="mb-4 mt-5 flex items-end justify-between gap-2">
          <div><p className="algan-eyebrow mb-1 text-ink-muted">{t('availableToday')}</p><SectionTitle>{t('boxesToday')}</SectionTitle></div>
          <span role="status" aria-label={`${t('foundOffers')}: ${visibleBoxes.length}`} className="mb-1 text-xs font-bold text-ink-muted">{visibleBoxes.length}</span>
        </div>
        {IS_DEMO_RELEASE && <p title={t('demoModeText')} className="mb-3 flex items-center gap-1.5 text-[11px] text-ink-muted"><FlaskConical size={13} />{t('demoShort')}</p>}
        <div className="space-y-4 pb-7">
          {visibleBoxes.map((box, index) => (
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
          {visibleBoxes.length === 0 && <EmptyState icon={<Search size={34} />} title={t('noResults')} description={t('noResultsText')}><PrimaryButton onClick={() => setFilters(DEFAULT_CATALOG_FILTERS)}>{t('resetFilters')}</PrimaryButton></EmptyState>}
        </div>
      </ScreenBody>
      {filtersOpen && <CatalogFilterSheet filters={filters} t={t} onApply={(next) => { setFilters(next); setFiltersOpen(false); }} onClose={() => setFiltersOpen(false)} />}
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
    <SurfaceCard data-testid="marketplace-box-card" tone={soldOut ? 'muted' : 'panel'} className="algan-food-card relative overflow-hidden transition" data-sold-out={soldOut || undefined}>
      <CardPressable onClick={onOpen} disabled={soldOut} aria-label={`${t('details')}: ${name}, ${store.name}`} className="group overflow-hidden rounded-card disabled:cursor-default">
        <span className={`relative block h-[174px] overflow-hidden bg-canvas ${soldOut ? 'opacity-55 grayscale' : ''}`}>
          <img src={box.image} alt={name} width={920} height={600} loading={priority ? 'eager' : 'lazy'} fetchPriority={priority ? 'high' : 'auto'} decoding="async" className="h-full w-full object-cover transition duration-[var(--motion-slow)] group-hover:scale-[1.03] group-disabled:scale-100" />
          <span aria-hidden="true" className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-brand-deep/55 to-transparent" />
          <span className="absolute left-3 top-3"><StatusBadge tone={soldOut ? 'neutral' : 'accentSolid'} size="md">−{discount}%</StatusBadge></span>
          <span className="absolute bottom-3 left-3 flex items-center gap-2"><MediaBadge size="sm" tone="floating"><img src={store.logo} alt="" className="h-7 w-7 object-contain" /></MediaBadge><span className="text-sm font-bold text-white">{store.name}</span></span>
          {box.type === 'SURPRISE' && <span className="absolute bottom-3 right-3"><SurpriseBadge compact /></span>}
        </span>
        <span className={`block p-4 ${soldOut ? 'text-ink-muted' : ''}`}>
          <span className="flex items-center gap-2"><CardTitle tone={soldOut ? 'muted' : 'default'} className="min-w-0 flex-1">{name}</CardTitle><span className="flex shrink-0 items-center gap-1 text-[11px] font-bold"><Star size={12} fill="currentColor" className="text-brand" />{store.rating}</span></span>
          <span className="mt-2 flex items-start gap-1.5 text-xs font-medium text-ink-muted"><MapPin size={14} className="mt-0.5 shrink-0 text-brand-hover" /><span>{address}</span></span>
          <span className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-bold text-ink-secondary">
            <span className="flex items-center gap-1.5"><Clock3 size={14} className="shrink-0 text-brand" />{box.pickupFrom}–{box.pickupTo}</span>
            <span className={`flex items-center gap-1.5 ${soldOut ? 'font-extrabold text-danger' : 'text-brand'}`}><Package size={14} className="shrink-0" />{soldOut ? t('boxesSoldOut') : formatBoxesLeft(available, locale)}</span>
          </span>
          <span className="mt-4 flex flex-wrap items-center gap-2 border-t border-border/70 pt-3 tabular-nums">
            <b className={`text-2xl leading-none tracking-[-.04em] ${soldOut ? 'text-ink-muted' : 'text-ink'}`}>{formatPrice(box.salePrice)}</b>
            <span className="text-xs text-ink-muted line-through">{formatPrice(box.originalPrice)}</span>
            {!soldOut && <span aria-hidden="true" className="ml-auto grid h-9 w-9 place-items-center rounded-full bg-brand-pale text-brand"><ArrowUpRight size={19} /></span>}
          </span>
        </span>
      </CardPressable>
      {(!soldOut || favorite) && (
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
  return <ShoppingBag data-testid="surprise-box-icon" className={compact ? 'h-3.5 w-3.5' : 'h-4 w-4'} />;
}
export function FavoritesTab({ t, locale, favoriteBoxIds, toggleFavoriteBox, openBox, purchasedBoxQuantities, onBrowseOffers }: {
  t: Translator;
  locale: Locale;
  favoriteBoxIds: string[];
  toggleFavoriteBox: (id: string) => void;
  openBox: (box: Box) => void;
  purchasedBoxQuantities: Record<string, number>;
  onBrowseOffers?: () => void;
}) {
  const favoriteBoxes = boxes.filter((box) => favoriteBoxIds.includes(box.id));
  return (
    <PageSection title={t('favorites')} eyebrow={t('collection')} description={t('favoritesIntro')}>
      {favoriteBoxes.length === 0 ? (
        <EmptyState icon={<Heart size={34} />} title={t('noFavorites')} description={t('noFavoritesText')} tone="accent">{onBrowseOffers && <PrimaryButton onClick={onBrowseOffers}>{t('favoritesBrowse')}</PrimaryButton>}</EmptyState>
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

function CatalogFilterSheet({ filters, t, onApply, onClose }: { filters: CatalogFilters; t: Translator; onApply: (filters: CatalogFilters) => void; onClose: () => void }) {
  const [draft, setDraft] = useState(filters);
  const sorts: { value: CatalogSort; label: CopyKey }[] = [{ value: 'recommended', label: 'recommended' }, { value: 'price', label: 'cheaperFirst' }, { value: 'pickup', label: 'earlierPickup' }];
  return (
    <DialogLayer onClose={onClose} closeLabel={t('close')} ariaLabel={t('filters')}>
      <ModalBody className="flex min-h-0 flex-col">
        <SheetHeader title={t('filters')} onClose={onClose} closeLabel={t('close')} />
        <ScrollArea className="pt-5">
          <p className="algan-eyebrow text-ink-muted">{t('sortBy')}</p>
          <div className="mt-2 space-y-1" role="group" aria-label={t('sortBy')}>
            {sorts.map((sort) => <button key={sort.value} type="button" aria-pressed={draft.sort === sort.value} onClick={() => setDraft((current) => ({ ...current, sort: sort.value }))} className="flex min-h-12 w-full items-center justify-between rounded-control px-3 text-left text-sm font-semibold hover:bg-surface-soft"><span>{t(sort.label)}</span><span className={`grid h-6 w-6 place-items-center rounded-full border ${draft.sort === sort.value ? 'border-brand bg-brand text-white' : 'border-border-strong'}`}>{draft.sort === sort.value && <Check size={14} />}</span></button>)}
          </div>
          <div className="my-4 border-t border-border pt-3">{(['availableOnly', 'halalOnly'] as const).map((key) => <label key={key} className="flex min-h-12 cursor-pointer items-center justify-between gap-4 px-3 text-sm font-semibold">{t(key)}<input type="checkbox" checked={draft[key]} onChange={(event) => setDraft((current) => ({ ...current, [key]: event.target.checked }))} className="h-6 w-6 accent-brand" /></label>)}</div>
        </ScrollArea>
        <PrimaryButton onClick={() => onApply(draft)}>{t('showOffers')}</PrimaryButton>
        <TertiaryButton onClick={() => setDraft({ ...DEFAULT_CATALOG_FILTERS, query: filters.query })} className="mt-1">{t('resetFilters')}</TertiaryButton>
      </ModalBody>
    </DialogLayer>
  );
}
