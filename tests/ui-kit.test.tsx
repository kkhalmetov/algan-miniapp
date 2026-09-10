import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  AccordionItem, BottomNavigation, BottomNavigationItem, BrandHeader, CardActionButton, CardPressable, CardTitle, ConfirmationDialog, DangerButton, DialogLayer,
  ContentTitle, DetailRow, DisclosureIndicator, EmptyState, FullScreenFeedback, IconBadge, IconButton, InsetSurface, LinkRow, ListRow, MediaBadge, MediaSheetHeader,
  AvatarFrame, ModalBody, ModalHeader, NoticeCard, PageSection, PageTitle, PillButton, PrimaryButton, QuantityControl, ScreenBody, SecondaryButton, SectionTitle, SheetHeader,
  ScrollArea, SegmentedControl, StatusBadge, StickyActionFooter, SurfaceCard, TextField, TextLinkButton, TertiaryButton, TopAppBar,
} from '../components/ui-kit';

describe('Algan UI kit', () => {
  afterEach(cleanup);

  it('uses one primary action style and preserves native button state', () => {
    render(<>
      <PrimaryButton disabled>Продолжить</PrimaryButton>
      <PrimaryButton tone="highlight">Поддержка</PrimaryButton>
      <SecondaryButton>Маршрут</SecondaryButton>
      <DangerButton>Выйти</DangerButton>
      <TertiaryButton tone="danger">Удалить</TertiaryButton>
    </>);
    const button = screen.getByRole('button', { name: 'Продолжить' });

    expect(button).toBeDisabled();
    expect(button).toHaveClass('min-h-13', 'bg-brand-hover', 'text-center', 'leading-5');
    expect(screen.getByRole('button', { name: 'Поддержка' })).toHaveClass('bg-highlight', 'text-brand-deep', 'shadow-none');
    expect(screen.getByRole('button', { name: 'Маршрут' })).toHaveClass('min-h-13', 'bg-surface');
    expect(screen.getByRole('button', { name: 'Выйти' })).toHaveClass('min-h-13', 'bg-danger-soft');
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

  it('provides one sheet header with handle, title navigation and close-only mode', () => {
    const onBack = vi.fn();
    const onClose = vi.fn();
    const { rerender } = render(<SheetHeader title="Документы" onBack={onBack} backLabel="Назад" onClose={onClose} closeLabel="Закрыть" />);

    expect(screen.getByRole('heading', { name: 'Документы' })).toBeInTheDocument();
    expect(document.querySelector('[aria-hidden="true"]')).toHaveClass('w-9', 'bg-border-strong');
    fireEvent.click(screen.getByRole('button', { name: 'Назад' }));
    fireEvent.click(screen.getByRole('button', { name: 'Закрыть' }));
    expect(onBack).toHaveBeenCalledOnce();
    expect(onClose).toHaveBeenCalledOnce();

    rerender(<SheetHeader compact onClose={onClose} closeLabel="Закрыть" />);
    expect(screen.queryByRole('heading')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Закрыть' })).toBeInTheDocument();
  });

  it('provides one media sheet header with a contrasting handle and close action', () => {
    const onClose = vi.fn();
    render(<MediaSheetHeader data-testid="media-header" onClose={onClose} closeLabel="Закрыть"><span aria-label="Бокс" /></MediaSheetHeader>);

    expect(screen.getByTestId('media-header')).toHaveClass('h-[220px]', 'overflow-hidden');
    expect(document.querySelector('[aria-hidden="true"].w-9')).toHaveClass('bg-white/85', 'shadow-control');
    fireEvent.click(screen.getByRole('button', { name: 'Закрыть' }));
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

  it('owns semantic icon colors and sizes', () => {
    render(<>
      <IconBadge tone="highlight" size="hero">✓</IconBadge>
      <IconBadge tone="danger" size="lg">!</IconBadge>
    </>);

    expect(screen.getByText('✓')).toHaveClass('h-16', 'w-16', 'rounded-[20px]', 'bg-highlight', 'text-brand');
    expect(screen.getByText('!')).toHaveClass('h-12', 'w-12', 'rounded-[16px]', 'bg-danger-soft', 'text-danger');
  });

  it('moves focus to a changed sheet title and supports nested heading levels', () => {
    const onClose = vi.fn();
    const { rerender } = render(<SheetHeader title="Документы" onClose={onClose} closeLabel="Закрыть" />);

    rerender(<SheetHeader title="Условия" onClose={onClose} closeLabel="Закрыть" focusTitleOnChange />);
    expect(screen.getByRole('heading', { name: 'Условия', level: 2 })).toHaveFocus();

    rerender(<SectionTitle as="h3">Раздел окна</SectionTitle>);
    expect(screen.getByRole('heading', { name: 'Раздел окна', level: 3 })).toHaveClass('text-section-title');
  });

  it('owns semantic visual variants inside the kit', () => {
    render(<>
      <PageTitle tone="inverse">Светлый заголовок</PageTitle>
      <CardTitle tone="muted">Недоступный бокс</CardTitle>
      <SurfaceCard tone="muted">Приглушённая карточка</SurfaceCard>
      <MediaBadge size="sm">S</MediaBadge>
      <MediaBadge tone="floating">F</MediaBadge>
      <IconButton label="В избранном" tone="floatingAccent">♡</IconButton>
      <StickyActionFooter density="compact">Действие</StickyActionFooter>
    </>);

    expect(screen.getByRole('heading', { name: 'Светлый заголовок' })).toHaveClass('text-white');
    expect(screen.getByRole('heading', { name: 'Недоступный бокс' })).toHaveClass('text-ink-muted');
    expect(screen.getByText('Приглушённая карточка')).toHaveClass('bg-surface-muted');
    expect(screen.getByText('S')).toHaveClass('h-9', 'w-9');
    expect(screen.getByText('F')).toHaveClass('border-3', 'border-panel');
    expect(screen.getByRole('button', { name: 'В избранном' })).toHaveClass('bg-accent-soft', 'shadow-control');
    expect(screen.getByText('Действие')).toHaveClass('pt-2.5');
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
    fireEvent.click(screen.getByRole('dialog', { name: 'Корзина' }).firstElementChild as HTMLButtonElement);
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('provides a shell-relative tall sheet', () => {
    render(
      <DialogLayer sheetHeight="tall" onClose={vi.fn()} closeLabel="Закрыть" ariaLabel="Длинный экран">
        <ModalBody>Содержимое</ModalBody>
      </DialogLayer>,
    );

    expect(screen.getByRole('dialog', { name: 'Длинный экран' }).querySelector('section')).toHaveClass('h-[92%]', 'max-h-[92%]');
  });

  it('provides a shell-relative medium sheet', () => {
    render(
      <DialogLayer sheetHeight="medium" onClose={vi.fn()} closeLabel="Закрыть" ariaLabel="Средний экран">
        <ModalBody>Содержимое</ModalBody>
      </DialogLayer>,
    );

    expect(screen.getByRole('dialog', { name: 'Средний экран' }).querySelector('section')).toHaveClass('h-[82%]', 'max-h-[92%]');
  });

  it('shares modal spacing, inline links and accordion behavior', () => {
    const onToggle = vi.fn();
    render(
      <ModalBody data-testid="modal-body">
        <TextLinkButton>Политика</TextLinkButton>
        <ScrollArea data-testid="scroll-area">Содержимое</ScrollArea>
        <LinkRow tone="panel" href="mailto:test@example.com" icon="@" title="Email" subtitle="test@example.com" />
        <ListRow icon="?" title="Поддержка" subtitle="Ежедневно с 09:00 до 21:00" subtitleWrap />
        <ListRow density="compact" icon="!" title="Компактная строка" />
        <AccordionItem title="Вопрос" expanded onToggle={onToggle}>Ответ</AccordionItem>
      </ModalBody>,
    );

    expect(screen.getByTestId('modal-body')).toHaveClass('px-page', 'sm:px-page-wide');
    expect(screen.getByRole('button', { name: 'Политика' })).toHaveClass('underline', 'min-h-6');
    expect(screen.getByTestId('scroll-area')).toHaveClass('hide-scrollbar', 'overflow-y-auto', 'overscroll-contain');
    expect(screen.getByRole('link', { name: /Email/ })).toHaveClass('border-border', 'bg-panel');
    expect(screen.getByText('Ежедневно с 09:00 до 21:00')).toHaveClass('whitespace-normal', 'leading-5');
    expect(screen.getByText('Ежедневно с 09:00 до 21:00')).not.toHaveClass('truncate');
    expect(screen.getByRole('button', { name: /Компактная строка/ })).toHaveClass('min-h-14', 'px-3', 'py-2');
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
    expect(screen.getByRole('button', { name: 'Главная' })).toHaveClass('text-[10px]');
    expect(screen.getByRole('heading', { name: 'Ошибка' })).toHaveClass('text-page-title');
    expect(screen.getByText('!')).toHaveClass('bg-danger-soft');
  });

  it('supports the coral feedback state and warning confirmation treatment', () => {
    const { unmount } = render(
      <FullScreenFeedback icon="!" title="Оплата не прошла" description="Корзина сохранена" tone="coral" centered>
        <PrimaryButton>Назад</PrimaryButton>
      </FullScreenFeedback>,
    );
    expect(screen.getByText('!')).toHaveClass('bg-accent', 'text-brand-deep');
    expect(screen.getByText('Оплата не прошла').closest('div')).toHaveClass('bg-accent-soft');
    unmount();

    render(
      <ConfirmationDialog
        title="Новая корзина"
        description="Текущая корзина будет очищена"
        cancelLabel="Отмена"
        confirmLabel="Продолжить"
        closeLabel="Закрыть"
        icon="!"
        tone="warning"
        showClose={false}
        onCancel={vi.fn()}
        onConfirm={vi.fn()}
      />,
    );
    expect(screen.getByText('!')).toHaveClass('bg-warning-surface', 'text-warning-ink');
    expect(screen.getByRole('button', { name: 'Продолжить' })).toHaveClass('bg-warning-ink');
  });

  it('supports a centered confirmation dialog variant', () => {
    render(<DialogLayer variant="center" onClose={vi.fn()} closeLabel="Закрыть" ariaLabel="Подтверждение">Текст</DialogLayer>);

    const dialog = screen.getByRole('dialog', { name: 'Подтверждение' });
    expect(dialog.firstElementChild).toHaveClass('absolute');
    expect(dialog.firstElementChild).toHaveAttribute('aria-hidden', 'true');
    expect(dialog.firstElementChild).toHaveAttribute('tabindex', '-1');
    expect(dialog.querySelector('section')).toHaveClass('rounded-sheet', 'max-w-sm');
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
        <ContentTitle as="h1">Параметры</ContentTitle>
        <CardTitle>Заведение</CardTitle>
        <InsetSurface data-testid="inset" className="p-4">
          <DetailRow icon="i" label="Адрес" value="Шымкент" />
        </InsetSurface>
        <MediaBadge>logo</MediaBadge>
        <DisclosureIndicator />
        <NoticeCard icon="!" title="Важно" titleAs="h2">Описание</NoticeCard>
        <NoticeCard data-testid="compact-notice" density="compact" icon="i" title="Короткое сообщение" titleAs="p" />
      </ScreenBody>,
    );

    expect(screen.getByText('Параметры')).toHaveClass('text-2xl');
    expect(screen.getByRole('heading', { name: 'Параметры', level: 1 })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Заведение', level: 2 })).toHaveClass('text-lg');
    expect(screen.getByTestId('inset')).toHaveClass('rounded-control', 'bg-surface-soft');
    expect(screen.getByText('Адрес')).toHaveClass('text-ink-muted');
    expect(screen.getByText('logo')).toHaveClass('h-12', 'w-12');
    expect(screen.getByText('Описание')).toHaveClass('text-ink-secondary');
    expect(screen.getByRole('heading', { name: 'Важно', level: 2 })).toBeInTheDocument();
    expect(screen.getByTestId('compact-notice')).toHaveClass('p-3');
    expect(screen.getByText('Короткое сообщение').parentElement?.previousElementSibling).toHaveClass('h-7', 'w-7');
  });

  it('shares user avatar sizing and fallback treatment', () => {
    const { rerender } = render(<AvatarFrame>Қ</AvatarFrame>);
    expect(screen.getByText('Қ')).toHaveClass('h-12', 'w-12', 'bg-highlight');

    rerender(<AvatarFrame size="lg">K</AvatarFrame>);
    expect(screen.getByText('K')).toHaveClass('h-16', 'w-16', 'text-2xl');
  });

  it('shares compact branded app bars', () => {
    render(<TopAppBar leading={<span>Назад</span>} title="Заведение" trailing={<span>Нравится</span>} />);

    expect(screen.getByRole('banner')).toHaveClass('bg-surface/96', 'px-page', 'sm:px-page-wide');
    expect(screen.getByText('Заведение')).toHaveClass('truncate', 'text-center');
  });

  it('contains focus without changing page scroll state and closes the top dialog with Escape', () => {
    const onClose = vi.fn();
    const { unmount } = render(
      <DialogLayer onClose={onClose} closeLabel="Закрыть" ariaLabel="Корзина">
        <button type="button">Первое действие</button>
        <button type="button">Последнее действие</button>
      </DialogLayer>,
    );

    expect(document.body.style.overflow).toBe('');
    fireEvent.keyDown(document, { key: 'Tab', shiftKey: true });
    expect(screen.getByRole('button', { name: 'Последнее действие' })).toHaveFocus();
    fireEvent.keyDown(document, { key: 'Tab' });
    expect(screen.getByRole('button', { name: 'Первое действие' })).toHaveFocus();
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledOnce();
    unmount();
    expect(document.body.style.overflow).toBe('');
  });

  it('makes content behind a dialog inert and restores it after closing', () => {
    const { unmount } = render(
      <div>
        <button type="button" data-testid="background-action">Фоновое действие</button>
        <DialogLayer onClose={vi.fn()} closeLabel="Закрыть" ariaLabel="Корзина">
          <button type="button">Действие в окне</button>
        </DialogLayer>
      </div>,
    );

    const background = screen.getByTestId('background-action');
    expect(background).toHaveAttribute('inert');
    expect(background).toHaveAttribute('aria-hidden', 'true');
    unmount();
    expect(background).not.toHaveAttribute('inert');
    expect(background).not.toHaveAttribute('aria-hidden');
  });

  it('releases layered dialog locks when multiple sheets are replaced at once', () => {
    const { rerender } = render(
      <>
        <button type="button" data-testid="app-action">Приложение</button>
        <DialogLayer onClose={vi.fn()} closeLabel="Закрыть" ariaLabel="Заведение">Заведение</DialogLayer>
        <DialogLayer onClose={vi.fn()} closeLabel="Закрыть" ariaLabel="Корзина">Корзина</DialogLayer>
      </>,
    );

    const appAction = screen.getByTestId('app-action');
    expect(appAction).toHaveAttribute('inert');

    rerender(
      <>
        <button type="button" data-testid="app-action">Приложение</button>
        <DialogLayer onClose={vi.fn()} closeLabel="Закрыть" ariaLabel="Заказ оформлен">Заказ оформлен</DialogLayer>
      </>,
    );
    expect(screen.getByTestId('app-action')).toHaveAttribute('inert');
    expect(screen.getByRole('dialog', { name: 'Заказ оформлен' })).not.toHaveAttribute('inert');

    rerender(<button type="button" data-testid="app-action">Приложение</button>);
    expect(screen.getByTestId('app-action')).not.toHaveAttribute('inert');
    expect(screen.getByTestId('app-action')).not.toHaveAttribute('aria-hidden');
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
