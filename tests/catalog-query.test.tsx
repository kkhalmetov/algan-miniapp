import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { HomeTab } from '../components/algan/marketplace';
import { DEFAULT_CATALOG_FILTERS, queryCatalog } from '../lib/catalog-query';
import { boxes, stores } from '../lib/mock-data';
import { getCopy } from '../lib/translations';

afterEach(cleanup);

describe('catalog discovery', () => {
  it('finds boxes by multiple name and address terms in either language', () => {
    const search = (query: string) => queryCatalog(boxes, stores, { ...DEFAULT_CATALOG_FILTERS, query }, 'kk', {});
    expect(search(' ТӘУКЕ   tatti ')).toHaveLength(5);
    expect(search('Кофе Байтұрсынов').map((box) => box.id)).toEqual(['coffee-pair']);
    expect(search('кофе Байтурсынова').map((box) => box.id)).toEqual(['coffee-pair']);
    expect(search('нет такого бокса')).toEqual([]);
  });

  it('combines category, stock and halal filters using the remaining inventory', () => {
    const catalog = boxes.map((box) => ({ ...box, isHalal: box.id !== 'tatti-family' }));
    const matches = queryCatalog(catalog, stores, { ...DEFAULT_CATALOG_FILTERS, category: 'bakery', availableOnly: true, halalOnly: true }, 'ru', { 'bakery-surprise': 4 });
    expect(matches.map((box) => box.id)).toEqual(['tatti-defined', 'tatti-morning', 'tatti-evening-surprise']);
  });

  it('sorts available offers by price or pickup and leaves sold-out offers last without changing source order', () => {
    const sourceIds = boxes.map((box) => box.id);
    const byPrice = queryCatalog(boxes, stores, { ...DEFAULT_CATALOG_FILTERS, sort: 'price' }, 'ru', { 'tatti-morning': 5 });
    expect(byPrice[0].id).toBe('coffee-pair');
    expect(byPrice.slice(-2).map((box) => box.id)).toEqual(['tatti-morning', 'qamyr-evening']);
    expect(queryCatalog(boxes, stores, { ...DEFAULT_CATALOG_FILTERS, sort: 'pickup' }, 'ru', {})[0].id).toBe('tatti-morning');
    expect(boxes.map((box) => box.id)).toEqual(sourceIds);
  });

  it('discards unconfirmed filters and applies the draft only after Show offers', () => {
    const t = getCopy('ru');
    render(<HomeTab t={t} locale="ru" profile={{ firstName: 'Алия' }} favoriteBoxIds={[]} toggleFavoriteBox={vi.fn()} openBox={vi.fn()} purchasedBoxQuantities={{}} />);
    const openFilters = () => {
      fireEvent.click(screen.getByRole('button', { name: t('filters') }));
      return screen.getByRole('dialog', { name: t('filters') });
    };
    let dialog = openFilters();
    fireEvent.click(within(dialog).getByRole('checkbox', { name: t('availableOnly') }));
    fireEvent.click(within(dialog).getByRole('button', { name: t('close') }));
    expect(screen.getAllByTestId('marketplace-box-card')).toHaveLength(boxes.length);
    dialog = openFilters();
    expect(within(dialog).getByRole('checkbox', { name: t('availableOnly') })).not.toBeChecked();
    fireEvent.click(within(dialog).getByRole('checkbox', { name: t('availableOnly') }));
    fireEvent.click(within(dialog).getByRole('button', { name: t('showOffers') }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.getAllByTestId('marketplace-box-card')).toHaveLength(boxes.length - 1);
    fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'ничего-не-найти' } });
    expect(screen.getByText(t('noResults'))).toBeVisible();
    fireEvent.click(screen.getByRole('button', { name: t('resetFilters') }));
    expect(screen.getByRole('searchbox')).toHaveValue('');
    expect(screen.getAllByTestId('marketplace-box-card')).toHaveLength(boxes.length);
  });
});
