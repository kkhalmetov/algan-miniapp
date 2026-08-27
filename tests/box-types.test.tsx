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

  it('shows every box for a selected store on the map and opens the selected one', () => {
    render(<AlganApp />);
    act(() => vi.advanceTimersByTime(MINIMUM_SPLASH_MS));
    fireEvent.click(screen.getByRole('button', { name: 'Карта' }));
    fireEvent.click(screen.getByRole('button', { name: 'Tatti Bakery marker' }));

    const options = screen.getByTestId('map-box-options');
    expect(within(options).getByRole('button', { name: /Surprise Tatti-box/ })).toBeInTheDocument();
    const definedBox = within(options).getByRole('button', { name: /^Tatti BakeryTatti-box/ });
    expect(within(definedBox).queryByText('SURPRISE')).not.toBeInTheDocument();
    fireEvent.click(definedBox);

    const dialog = screen.getByRole('dialog', { name: 'Tatti Bakery' });
    expect(within(dialog).queryByText('Tatti-box')).not.toBeInTheDocument();
    expect(within(dialog).queryByText('SURPRISE')).not.toBeInTheDocument();
    const contents = within(dialog).getByTestId('box-contents');
    expect(contents).toHaveTextContent('Круассан');
    expect(contents).toHaveTextContent('× 2');
    expect(contents).toHaveTextContent('Булочка с корицей');
    expect(contents).toHaveTextContent('Багет');
  });

  it('uses the localized surprise explanation in Kazakh', () => {
    useAppStore.setState({ locale: 'kk' });
    render(<AlganApp />);
    act(() => vi.advanceTimersByTime(MINIMUM_SPLASH_MS));
    fireEvent.click(screen.getByRole('button', { name: /Tatti Bakery пр\. Тауке хана, 47/ }));

    const dialog = screen.getByRole('dialog', { name: 'Tatti Bakery' });
    expect(within(dialog).getByText('Бұл бокстың нақты құрамы алдын ала белгісіз — ішіндегісі тосынсый болады.')).toBeInTheDocument();
    expect(within(dialog).getByText('SURPRISE')).toBeInTheDocument();
  });
});
