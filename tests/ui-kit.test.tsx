import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { DangerButton, EmptyState, IconButton, ModalHeader, PrimaryButton, SecondaryButton, SegmentedControl, TextField } from '../components/ui-kit';

describe('Algan UI kit', () => {
  afterEach(cleanup);

  it('uses one primary action style and preserves native button state', () => {
    render(<>
      <PrimaryButton disabled>Продолжить</PrimaryButton>
      <SecondaryButton>Маршрут</SecondaryButton>
      <DangerButton>Выйти</DangerButton>
    </>);
    const button = screen.getByRole('button', { name: 'Продолжить' });

    expect(button).toBeDisabled();
    expect(button).toHaveClass('primary-button');
    expect(screen.getByRole('button', { name: 'Маршрут' })).toHaveClass('bg-brand-pale');
    expect(screen.getByRole('button', { name: 'Выйти' })).toHaveClass('bg-accent-soft');
  });

  it('gives every icon button a 44px touch target and accessible name', () => {
    render(<IconButton label="Закрыть">×</IconButton>);

    expect(screen.getByRole('button', { name: 'Закрыть' })).toHaveClass('h-11', 'w-11');
  });

  it('provides consistent back and close actions in modal headers', () => {
    const onBack = vi.fn();
    const onClose = vi.fn();
    render(<ModalHeader title="Документы" onBack={onBack} backLabel="Назад" onClose={onClose} closeLabel="Закрыть" />);

    fireEvent.click(screen.getByRole('button', { name: 'Назад' }));
    fireEvent.click(screen.getByRole('button', { name: 'Закрыть' }));
    expect(onBack).toHaveBeenCalledOnce();
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('exposes selected state for segmented controls', () => {
    const onChange = vi.fn();
    render(<SegmentedControl value="active" label="Заказы" items={[
      { value: 'active', label: 'Активные' },
      { value: 'past', label: 'Прошедшие' },
    ]} onChange={onChange} />);

    expect(screen.getByRole('button', { name: 'Активные' })).toHaveAttribute('aria-pressed', 'true');
    fireEvent.click(screen.getByRole('button', { name: 'Прошедшие' }));
    expect(onChange).toHaveBeenCalledWith('past');
  });

  it('shares field and empty-state presentation', () => {
    const onValueChange = vi.fn();
    render(<>
      <TextField label="Телефон" required value="" onValueChange={onValueChange} />
      <EmptyState icon="♡" title="Пусто" description="Здесь пока ничего нет" />
    </>);

    fireEvent.change(screen.getByLabelText(/Телефон/), { target: { value: '+7705' } });
    expect(onValueChange).toHaveBeenCalledWith('+7705');
    expect(screen.getByText('Здесь пока ничего нет')).toBeInTheDocument();
  });
});
