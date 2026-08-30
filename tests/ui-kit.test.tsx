import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  AccordionItem, BottomNavigation, BottomNavigationItem, BrandHeader, CardActionButton, CardPressable, ConfirmationDialog, DangerButton, DialogLayer,
  ContentTitle, DetailRow, DisclosureIndicator, EmptyState, FullScreenFeedback, IconButton, InsetSurface, LinkRow, MediaBadge,
  ModalBody, ModalHeader, NoticeCard, PageSection, PillButton, PrimaryButton, QuantityControl, ScreenBody, SecondaryButton,
  SegmentedControl, StatusBadge, StickyActionFooter, TextField, TextLinkButton, TertiaryButton, TopAppBar,
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
    const question = screen.getByRole('button', { name: 'Вопрос' });
    expect(question).toHaveAttribute('aria-controls');
    expect(screen.getByRole('region', { name: 'Вопрос' })).toHaveTextContent('Ответ');
    fireEvent.click(question);
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
    expect(screen.getByRole('group', { name: 'Количество' })).toBeInTheDocument();
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

  it('shares screen spacing, information surfaces and disclosure affordances', () => {
    render(
      <ScreenBody>
        <ContentTitle>Параметры</ContentTitle>
        <InsetSurface data-testid="inset" className="p-4">
          <DetailRow icon="i" label="Адрес" value="Шымкент" />
        </InsetSurface>
        <MediaBadge>logo</MediaBadge>
        <DisclosureIndicator />
        <NoticeCard icon="!" title="Важно">Описание</NoticeCard>
      </ScreenBody>,
    );

    expect(screen.getByText('Параметры')).toHaveClass('text-2xl');
    expect(screen.getByTestId('inset')).toHaveClass('rounded-control', 'bg-surface-soft');
    expect(screen.getByText('Адрес')).toHaveClass('text-ink-muted');
    expect(screen.getByText('logo')).toHaveClass('h-12', 'w-12');
    expect(screen.getByText('Описание')).toHaveClass('text-ink-secondary');
  });

  it('shares compact branded app bars', () => {
    render(<TopAppBar leading={<span>Назад</span>} title="Заведение" trailing={<span>Нравится</span>} />);

    expect(screen.getByRole('banner')).toHaveClass('bg-brand', 'px-page');
    expect(screen.getByText('Заведение')).toHaveClass('truncate', 'text-center');
  });

  it('locks background scrolling and closes the top dialog with Escape', () => {
    const onClose = vi.fn();
    const { unmount } = render(
      <DialogLayer onClose={onClose} closeLabel="Закрыть" ariaLabel="Корзина">
        <button type="button">Первое действие</button>
        <button type="button">Последнее действие</button>
      </DialogLayer>,
    );

    expect(document.body.style.overflow).toBe('hidden');
    fireEvent.keyDown(document, { key: 'Tab', shiftKey: true });
    expect(screen.getByRole('button', { name: 'Последнее действие' })).toHaveFocus();
    fireEvent.keyDown(document, { key: 'Tab' });
    expect(screen.getByRole('button', { name: 'Первое действие' })).toHaveFocus();
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledOnce();
    unmount();
    expect(document.body.style.overflow).toBe('');
  });

  it('provides one confirmation-dialog pattern for normal and destructive actions', () => {
    const onCancel = vi.fn();
    const onConfirm = vi.fn();
    render(
      <ConfirmationDialog
        title="Сбросить данные"
        description="Данные будут удалены"
        cancelLabel="Отмена"
        confirmLabel="Сбросить"
        closeLabel="Закрыть"
        tone="danger"
        onCancel={onCancel}
        onConfirm={onConfirm}
      />,
    );

    expect(screen.getByRole('dialog', { name: 'Сбросить данные' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Сбросить' })).toHaveClass('bg-danger-soft');
    fireEvent.click(screen.getByRole('button', { name: 'Отмена' }));
    fireEvent.click(screen.getByRole('button', { name: 'Сбросить' }));
    expect(onCancel).toHaveBeenCalledOnce();
    expect(onConfirm).toHaveBeenCalledOnce();
  });

  it('does not render empty supporting copy in empty states', () => {
    const { container } = render(<EmptyState icon="♡" title="Корзина пуста" />);
    expect(container.querySelector('p')).toBeNull();
  });
});
