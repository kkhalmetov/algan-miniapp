import { availableQuantity } from './app-utils';
import { boxName, storeAddress } from './catalog-localization';
import type { Box, Locale, Store } from './types';

export type CatalogCategory = 'all' | Store['type'];
export type CatalogSort = 'recommended' | 'price' | 'pickup';
export interface CatalogFilters {
  query: string;
  category: CatalogCategory;
  sort: CatalogSort;
  availableOnly: boolean;
  halalOnly: boolean;
}
export const DEFAULT_CATALOG_FILTERS: CatalogFilters = { query: '', category: 'all', sort: 'recommended', availableOnly: false, halalOnly: false };

export function queryCatalog(boxes: Box[], stores: Store[], filters: CatalogFilters, locale: Locale, purchased: Record<string, number>) {
  const terms = filters.query.trim().toLocaleLowerCase(locale).split(/\s+/).filter(Boolean);
  const result = boxes.filter((box) => {
    const store = stores.find((candidate) => candidate.id === box.storeId);
    if (!store || (filters.category !== 'all' && store.type !== filters.category)) return false;
    if (filters.availableOnly && availableQuantity(box, purchased) < 1) return false;
    if (filters.halalOnly && !box.isHalal) return false;
    const searchable = [boxName(box, locale), box.name, box.nameKk, store.name, storeAddress(store, locale), store.address, store.addressKk].join(' ').toLocaleLowerCase(locale);
    return terms.every((term) => searchable.includes(term));
  });
  return result.sort((a, b) => {
    const availability = Number(availableQuantity(a, purchased) < 1) - Number(availableQuantity(b, purchased) < 1);
    if (availability) return availability;
    if (filters.sort === 'price') return a.salePrice - b.salePrice;
    if (filters.sort === 'pickup') return a.pickupFrom.localeCompare(b.pickupFrom);
    return 0;
  });
}
