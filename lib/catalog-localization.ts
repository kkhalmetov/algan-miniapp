import type { Box, BoxContent, Locale, Store } from './types';

export const storeAddress = (store: Store, locale: Locale) =>
  locale === 'kk' ? store.addressKk ?? store.address : store.address;

export const boxName = (box: Box, locale: Locale) =>
  locale === 'kk' ? box.nameKk ?? box.name : box.name;

export const boxAllergens = (box: Box, locale: Locale) =>
  locale === 'kk' ? box.allergensKk ?? box.allergens : box.allergens;

export const boxContentName = (content: BoxContent, locale: Locale) =>
  locale === 'kk' ? content.contentNameKk ?? content.contentName : content.contentName;
