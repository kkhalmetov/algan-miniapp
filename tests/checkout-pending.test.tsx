import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { CartSheet } from '../components/algan/checkout';
import { getCopy } from '../lib/translations';

afterEach(cleanup);

it('keeps checkout stable while awaiting payment and restores controls after the response', () => {
  const props = {
    items: [{ boxId: 'bakery-surprise', quantity: 1 }], purchasedBoxQuantities: {}, locale: 'ru' as const, t: getCopy('ru'),
    onClose: vi.fn(), onChangeQuantity: vi.fn(), onPay: vi.fn(async () => undefined), onOpenOffer: vi.fn(), onOpenOrderRules: vi.fn(),
  };
  const { rerender } = render(<CartSheet {...props} paymentPending />);
  expect(screen.getByRole('button', { name: props.t('paymentProcessing') })).toHaveAttribute('aria-busy', 'true');
  for (const button of screen.getAllByRole('button')) expect(button).toBeDisabled();
  fireEvent.keyDown(document, { key: 'Escape' });
  expect(props.onClose).not.toHaveBeenCalled();
  expect(props.onPay).not.toHaveBeenCalled();
  rerender(<CartSheet {...props} paymentPending={false} />);
  expect(screen.getByRole('button', { name: props.t('checkoutCart') })).toBeEnabled();
  fireEvent.keyDown(document, { key: 'Escape' });
  expect(props.onClose).toHaveBeenCalledOnce();
});
