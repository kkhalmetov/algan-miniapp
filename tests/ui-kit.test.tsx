import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  AccordionItem, BottomNavigation, BottomNavigationItem, BrandHeader, CardActionButton, CardPressable, DangerButton, DialogLayer,
  EmptyState, FullScreenFeedback, IconButton, LinkRow, ModalBody, ModalHeader, PageSection, PillButton, PrimaryButton, SecondaryButton,
  QuantityControl, SegmentedControl, StatusBadge, StickyActionFooter, TextField, TextLinkButton,
  TertiaryButton,
} from '../components/ui-kit';

describe('Algan UI kit', () => {
  afterEach(cleanup);

  it('uses one primary action style and preserves native button state', () => {
    render(<>
      <PrimaryButton disabled>Продолжить</PrimaryButton>
      <SecondaryButton>Маршрут</SecondaryButton>
      <DangerButton>Выйти</DangerButton>
      <TertiaryButton tone="danger">Удалить</TertiaryButton>
    </>);
    const button = screen.getByRole('button', { name: 'Продолжить' });

    expect(button).toBeDisabled();
    expect(button).toHaveClass('min-h-14', 'bg-brand');
    expect(screen.getByRole('button', { name: 'Маршрут' })).toHaveClass('min-h-14', 'bg-brand-pale');
    expect(screen.getByRole('button', { name: 'Выйти' })).toHaveClass('min-h-14', 'bg-danger-soft');
    expect(screen.getByRole('button', { name: 'Удалить' })).toHaveClass('min-h-11', 'text-danger');
  });

  it('gives every icon button a 44px touch target and accessible name', () => {
    render(<><IconButton label="Закрыть">×</IconButton><PillButton tone="dark">Рус</PillButton></>);

    expect(screen.getByRole('button', { name: 'Закрыть' })).toHaveClass('h-11', 'w-11');
    expect(screen.getByRole('button', { name: 'Рус' })).toHaveClass('h-11', 'rounded-full');
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

  it('shares screen hierarchy and status presentation', () => {
    render(<>
      <BrandHeader>Профиль</BrandHeader>
      <PageSection title="Заказы"><StatusBadge tone="danger">Боксы закончились</StatusBadge></PageSection>
    </>);

    expect(screen.getByRole('banner')).toHaveClass('bg-brand');
    expect(screen.getByRole('heading', { name: 'Заказы' })).toHaveClass('text-page-title');
    expect(screen.getByText('Боксы закончились')).toHaveClass('bg-danger-soft', 'text-danger');
  });

  it('shares attached actions and modal layers', () => {
    const onClose = vi.fn();
    render(
      <DialogLayer onClose={onClose} closeLabel="Закрыть" ariaLabel="Корзина">
        <StickyActionFooter><CardActionButton>Получить заказ</CardActionButton></StickyActionFooter>
      </DialogLayer>,
    );

    expect(screen.getByRole('dialog', { name: 'Корзина' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Получить заказ' })).toHaveClass('border-t');
    fireEvent.click(screen.getByRole('button', { name: 'Закрыть (Корзина)' }));
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('shares modal spacing, inline links and accordion behavior', () => {
    const onToggle = vi.fn();
    render(
      <ModalBody data-testid="modal-body">
        <TextLinkButton>Политика</TextLinkButton>
        <LinkRow tone="panel" href="mailto:test@example.com" icon="@" title="Email" subtitle="test@example.com" />
        <AccordionItem title="Вопрос" expanded onToggle={onToggle}>Ответ</AccordionItem>
      </ModalBody>,
    );

    expect(screen.getByTestId('modal-body')).toHaveClass('px-page-wide');
    expect(screen.getByRole('button', { name: 'Политика' })).toHaveClass('underline');
    expect(screen.getByRole('link', { name: /Email/ })).toHaveClass('border-border', 'bg-panel');
    fireEvent.click(screen.getByRole('button', { name: 'Вопрос' }));
    expect(onToggle).toHaveBeenCalledOnce();
    expect(screen.getByText('Ответ')).toBeInTheDocument();
  });

  it('shares bottom navigation and full-screen feedback', () => {
    render(<>
      <BottomNavigation>
        <BottomNavigationItem active icon="⌂" label="Главная" />
        <BottomNavigationItem active={false} icon="♡" label="Избранное" />
      </BottomNavigation>
      <FullScreenFeedback icon="!" title="Ошибка" description="Попробуйте позже" tone="danger" centered>
        <PrimaryButton>Назад</PrimaryButton>
      </FullScreenFeedback>
    </>);

    expect(screen.getByRole('navigation')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Главная' })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('heading', { name: 'Ошибка' })).toHaveClass('text-page-title');
    expect(screen.getByText('!')).toHaveClass('bg-danger-soft');
  });

  it('supports a centered confirmation dialog variant', () => {
    render(<DialogLayer variant="center" onClose={vi.fn()} closeLabel="Закрыть" ariaLabel="Подтверждение">Текст</DialogLayer>);

    const dialog = screen.getByRole('dialog', { name: 'Подтверждение' });
    expect(dialog.firstElementChild).toHaveClass('absolute');
    expect(dialog.querySelector('section')).toHaveClass('rounded-card', 'max-w-sm');
    expect(dialog.querySelector('section')).toHaveFocus();
  });

  it('shares compact add and quantity controls with full touch targets', () => {
    const onChange = vi.fn();
    const { rerender } = render(<QuantityControl quantity={0} max={2} label="Количество" addLabel="Добавить бокс" addText="Добавить" onChange={onChange} />);
    fireEvent.click(screen.getByRole('button', { name: 'Добавить бокс' }));
    expect(onChange).toHaveBeenCalledWith(1);

    rerender(<QuantityControl quantity={1} max={2} label="Количество" addLabel="Добавить бокс" addText="Добавить" onChange={onChange} />);
    expect(screen.getByRole('button', { name: 'Количество −' })).toHaveClass('h-11', 'w-11');
    expect(screen.getByRole('button', { name: 'Количество +' })).toHaveClass('h-11', 'w-11');
  });

  it('keeps keyboard focus visible inside clipped card surfaces', () => {
    render(<CardPressable>Открыть заведение</CardPressable>);

    expect(screen.getByRole('button', { name: 'Открыть заведение' })).toHaveClass(
      'focus-visible:ring-inset',
      'focus-visible:ring-brand-hover',
    );
  });
});
