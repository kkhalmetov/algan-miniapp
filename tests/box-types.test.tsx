import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Store } from '../lib/types';

vi.mock('@/components/location-map', () => ({
  default: ({ stores, onSelectStore }: { stores: Store[]; onSelectStore: (id: string) => void }) => (
    <div>
      {stores.map((store) => (
        <button key={store.id} type="button" onClick={() => onSelectStore(store.id)}>
          {store.name} marker
        </button>
      ))}
    </div>
  ),
}));

import AlganApp, { MINIMUM_SPLASH_MS } from '../app/app-client';
import { boxes } from '../lib/mock-data';
import { useAppStore } from '../lib/store';

describe('box types', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    delete window.Telegram;
    useAppStore.setState({
      hydrated: true,
      onboardingDone: true,
      profile: { firstName: 'Kimal', phone: '+77059768000' },
      locale: 'ru',
      tab: 'home',
      favoriteStoreIds: [],
      orders: [],
      cartStoreId: undefined,
      cartItems: [],
      purchasedBoxQuantities: {},
    });
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  it('keeps mock data compatible with the backend box type contract', () => {
    expect(boxes.every((box) => box.type === 'SURPRISE' || box.type === 'DEFINED')).toBe(true);
    expect(boxes.filter((box) => box.type === 'SURPRISE').every((box) => !box.contents?.length)).toBe(true);
    expect(boxes.filter((box) => box.type === 'DEFINED').every((box) => Boolean(box.contents?.length))).toBe(true);
  });

  it('opens venue details directly from a map marker', () => {
    render(<AlganApp />);
    act(() => vi.advanceTimersByTime(MINIMUM_SPLASH_MS));
    fireEvent.click(screen.getByRole('button', { name: 'Карта' }));
    fireEvent.click(screen.getByRole('button', { name: 'Tatti Bakery marker' }));

    const dialog = screen.getByRole('dialog', { name: 'Tatti Bakery' });
    expect(within(dialog).getByRole('heading', { name: 'Tatti Bakery' })).toBeInTheDocument();
    expect(screen.queryByTestId('map-box-options')).not.toBeInTheDocument();
  });

  it('uses the localized surprise explanation in Kazakh', () => {
    useAppStore.setState({ locale: 'kk' });
    render(<AlganApp />);
    act(() => vi.advanceTimersByTime(MINIMUM_SPLASH_MS));
    fireEvent.click(screen.getByRole('button', { name: /Tatti Bakery пр\. Тауке хана, 47/ }));
    const storeDialog = screen.getByRole('dialog', { name: 'Tatti Bakery' });
    expect(within(storeDialog).getByText('Сыртқы көрінісі өзгеше болуы мүмкін')).toBeInTheDocument();
    expect(within(storeDialog).getByText('Бокстың және өнімдердің нақты сыртқы көрінісі суреттен өзгеше болуы мүмкін.')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Толығырақ Surprise Tatti-box' }));

    const dialog = screen.getByRole('dialog', { name: 'Surprise Tatti-box' });
    expect(within(dialog).getByRole('heading', { name: 'Ішінде не болуы мүмкін' })).toBeInTheDocument();
    expect(within(dialog).getByText('Круассандар, қатпарлы қамыр өнімдері, тоқаштар, багеттер және басқа да пісірмелер.')).toBeInTheDocument();
    expect(within(dialog).getByText('Нақты жиынтық алдын ала белгісіз және оны мекеме тапсырысты алатын күні қалыптастырады.')).toBeInTheDocument();
    expect(within(dialog).queryByText('Сыртқы көрінісі өзгеше болуы мүмкін')).not.toBeInTheDocument();
    expect(within(dialog).getByText('SURPRISE')).toBeInTheDocument();
  });
});
