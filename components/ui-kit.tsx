'use client';

import type { AnchorHTMLAttributes, ButtonHTMLAttributes, HTMLAttributes, InputHTMLAttributes, ReactNode } from 'react';
import { useEffect, useId, useRef } from 'react';
import { ArrowLeft, ChevronDown, Minus, Plus, X } from 'lucide-react';

export function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ');
}

const actionButtonBase = 'flex w-full items-center justify-center gap-2 rounded-control px-4 font-black transition duration-150 active:scale-[.99] disabled:cursor-not-allowed disabled:shadow-none disabled:opacity-45';
type ActionButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & { size?: 'md' | 'lg' };
const actionButtonSize = { md: 'min-h-11 text-sm', lg: 'min-h-14 text-[15px]' } as const;

export function PrimaryButton({ className, type = 'button', size = 'lg', ...props }: ActionButtonProps) {
  return <button type={type} className={cx(actionButtonBase, actionButtonSize[size], 'bg-brand text-white shadow-action hover:bg-brand-hover disabled:bg-surface-muted disabled:text-ink-subtle', className)} {...props} />;
}

export function PageTitle({ className, ...props }: HTMLAttributes<HTMLHeadingElement>) {
  return <h1 className={cx('text-page-title text-ink', className)} {...props} />;
}

export function SectionTitle({ className, ...props }: HTMLAttributes<HTMLHeadingElement>) {
  return <h2 className={cx('text-section-title text-ink', className)} {...props} />;
}

export function ContentTitle({ className, ...props }: HTMLAttributes<HTMLHeadingElement>) {
  return <h2 className={cx('text-2xl font-black tracking-[-0.04em] text-ink', className)} {...props} />;
}

export function PageSection({ title, children, className }: {
  title: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cx('px-page pb-7 pt-[max(2rem,env(safe-area-inset-top))]', className)}>
      <PageTitle>{title}</PageTitle>
      {children}
    </section>
  );
}

export function BrandHeader({ className, ...props }: HTMLAttributes<HTMLElement>) {
  return (
    <header
      className={cx('bg-brand px-page-wide pb-8 pt-[max(1.5rem,env(safe-area-inset-top))] text-white', className)}
      {...props}
    />
  );
}

export function TopAppBar({ leading, title, trailing, className, ...props }: HTMLAttributes<HTMLElement> & {
  leading: ReactNode;
  title: ReactNode;
  trailing: ReactNode;
}) {
  return (
    <header className={cx('shrink-0 bg-brand px-page pb-3 pt-[max(.75rem,env(safe-area-inset-top))] text-white', className)} {...props}>
      <div className="flex min-h-11 items-center gap-3">
        {leading}
        <div className="min-w-0 flex-1 truncate text-center text-sm font-black">{title}</div>
        {trailing}
      </div>
    </header>
  );
}

export function ScreenBody({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cx('bg-surface px-page pt-6', className)} {...props} />;
}

export function SecondaryButton({ className, type = 'button', size = 'lg', ...props }: ActionButtonProps) {
  return (
    <button
      type={type}
      className={cx(actionButtonBase, actionButtonSize[size], 'bg-brand-pale text-brand hover:bg-brand-soft', className)}
      {...props}
    />
  );
}

export function DangerButton({ className, type = 'button', size = 'lg', ...props }: ActionButtonProps) {
  return (
    <button
      type={type}
      className={cx(actionButtonBase, actionButtonSize[size], 'bg-danger-soft text-danger', className)}
      {...props}
    />
  );
}

export function TextLinkButton({ className, type = 'button', ...props }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type={type}
      className={cx('font-extrabold text-brand underline decoration-border-strong underline-offset-2 transition hover:text-brand-hover', className)}
      {...props}
    />
  );
}

export function PillButton({ className, type = 'button', tone = 'soft', ...props }: ButtonHTMLAttributes<HTMLButtonElement> & {
  tone?: 'soft' | 'dark';
}) {
  return (
    <button
      type={type}
      className={cx(
        'flex h-11 items-center justify-center gap-1.5 rounded-full px-3 text-xs font-black transition active:scale-95',
        tone === 'dark' ? 'bg-white/12 text-white' : 'bg-surface-soft text-brand',
        className,
      )}
      {...props}
    />
  );
}

export function TertiaryButton({ className, type = 'button', tone = 'brand', ...props }: ButtonHTMLAttributes<HTMLButtonElement> & {
  tone?: 'brand' | 'danger';
}) {
  return (
    <button
      type={type}
      className={cx(
        'inline-flex min-h-11 items-center justify-center rounded-control px-3 text-xs font-black transition active:bg-surface-muted',
        tone === 'danger' ? 'text-danger' : 'text-brand',
        className,
      )}
      {...props}
    />
  );
}

export function TextField({
  label,
  optional,
  required,
  value,
  onValueChange,
  className,
  ...props
}: Omit<InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange'> & {
  label: string;
  optional?: string;
  value: string;
  onValueChange: (value: string) => void;
}) {
  return (
    <label className="mt-5 block min-w-0 text-sm font-extrabold">
      <span>{label} {required && <span className="text-accent">*</span>}</span>
      {optional && <span className="ml-1 text-[11px] font-medium text-ink-subtle">({optional})</span>}
      <input
        {...props}
        required={required}
        value={value}
        onChange={(event) => onValueChange(event.target.value)}
        className={cx(
          'mt-2 h-13 w-full rounded-control border border-border bg-panel px-4 text-[15px] outline-none transition placeholder:text-ink-subtle focus:border-brand-hover focus:ring-4 focus:ring-brand-hover/10',
          className,
        )}
      />
    </label>
  );
}

type IconButtonTone = 'muted' | 'dark' | 'brand' | 'accent';

const iconButtonTone: Record<IconButtonTone, string> = {
  muted: 'bg-surface-muted text-ink',
  dark: 'bg-white/12 text-white',
  brand: 'bg-brand text-white',
  accent: 'bg-accent-soft text-accent',
};

export function IconButton({
  label,
  tone = 'muted',
  className,
  type = 'button',
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { label: string; tone?: IconButtonTone }) {
  return (
    <button
      type={type}
      aria-label={label}
      className={cx(
        'grid h-11 w-11 shrink-0 place-items-center rounded-full transition active:scale-95 disabled:opacity-45',
        iconButtonTone[tone],
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}

export function ModalHeader({
  title,
  onBack,
  backLabel,
  onClose,
  closeLabel,
}: {
  title: ReactNode;
  onBack?: () => void;
  backLabel?: string;
  onClose: () => void;
  closeLabel: string;
}) {
  return (
    <div className="flex min-h-11 items-center gap-3">
      {onBack && (
        <IconButton onClick={onBack} label={backLabel ?? closeLabel}>
          <ArrowLeft size={18} />
        </IconButton>
      )}
      <h2 className="min-w-0 flex-1 text-xl font-black tracking-[-0.035em]">{title}</h2>
      <IconButton onClick={onClose} label={closeLabel}>
        <X size={18} />
      </IconButton>
    </div>
  );
}

export function SheetHandle() {
  return <div aria-hidden="true" className="mx-auto h-1.5 w-10 rounded-full bg-border-strong" />;
}

export function ModalBody({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cx('px-page-wide pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-5', className)} {...props} />;
}

export function SurfaceCard({ className, ...props }: HTMLAttributes<HTMLElement>) {
  return <article className={cx('rounded-card border border-border bg-panel shadow-card', className)} {...props} />;
}

type InsetTone = 'soft' | 'panel' | 'brand' | 'brandSolid' | 'warning' | 'danger' | 'allergen';

const insetTone: Record<InsetTone, string> = {
  soft: 'bg-surface-soft',
  panel: 'border border-border bg-panel',
  brand: 'border border-brand/15 bg-brand-pale',
  brandSolid: 'bg-brand text-white',
  warning: 'bg-warning-surface text-warning-ink',
  danger: 'bg-danger-soft text-danger',
  allergen: 'border border-allergen-border bg-allergen-surface',
};

export function InsetSurface({ tone = 'soft', radius = 'control', className, ...props }: HTMLAttributes<HTMLDivElement> & {
  tone?: InsetTone;
  radius?: 'control' | 'card';
}) {
  return <div className={cx(radius === 'card' ? 'rounded-card' : 'rounded-control', insetTone[tone], className)} {...props} />;
}

export function CardPressable({ className, type = 'button', ...props }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type={type}
      className={cx(
        'block w-full text-left transition focus-visible:!outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-hover',
        className,
      )}
      {...props}
    />
  );
}

type StatusTone = 'brand' | 'dark' | 'accent' | 'accentSolid' | 'danger' | 'warning' | 'neutral';
type StatusSize = 'sm' | 'md' | 'lg';

const statusTone: Record<StatusTone, string> = {
  brand: 'bg-brand-pale text-brand',
  dark: 'bg-brand-deep/92 text-white',
  accent: 'bg-accent-soft text-accent-strong',
  accentSolid: 'bg-accent text-white',
  danger: 'bg-danger-soft text-danger',
  warning: 'bg-warning-surface text-warning-ink',
  neutral: 'bg-surface-muted text-ink-secondary',
};

const statusSize: Record<StatusSize, string> = {
  sm: 'min-h-6 px-2 py-1 text-[10px]',
  md: 'min-h-7 px-2.5 py-1 text-[11px]',
  lg: 'min-h-9 px-3 py-2 text-xs',
};

export function StatusBadge({ children, icon, tone = 'brand', size = 'md', className, ...props }: HTMLAttributes<HTMLSpanElement> & {
  icon?: ReactNode;
  tone?: StatusTone;
  size?: StatusSize;
}) {
  return (
    <span className={cx('inline-flex items-center gap-1.5 rounded-full font-black', statusTone[tone], statusSize[size], className)} {...props}>
      {icon}{children}
    </span>
  );
}

export function IconBadge({ children, tone = 'brand', className }: {
  children: ReactNode;
  tone?: 'brand' | 'accent' | 'soft' | 'warning' | 'danger';
  className?: string;
}) {
  const tones = {
    brand: 'bg-brand-pale text-brand',
    accent: 'bg-accent-soft text-accent-strong',
    soft: 'bg-surface-soft text-brand',
    warning: 'bg-warning-surface text-warning-ink',
    danger: 'bg-danger-soft text-danger',
  };

  return (
    <span className={cx('grid h-10 w-10 shrink-0 place-items-center rounded-full', tones[tone], className)}>
      {children}
    </span>
  );
}

export function MediaBadge({ children, size = 'md', className }: {
  children: ReactNode;
  size?: 'md' | 'lg';
  className?: string;
}) {
  return (
    <span className={cx(
      'grid shrink-0 place-items-center overflow-hidden rounded-full border bg-panel shadow-card',
      size === 'lg' ? 'h-17 w-17 border-4 border-surface' : 'h-12 w-12 border-border',
      className,
    )}>
      {children}
    </span>
  );
}

export function DisclosureIndicator({ className }: { className?: string }) {
  return (
    <span className={cx('grid h-9 w-9 shrink-0 place-items-center rounded-full bg-brand-pale text-brand', className)} aria-hidden="true">
      <ChevronDown size={18} strokeWidth={2.5} className="-rotate-90" />
    </span>
  );
}

export function DetailRow({ icon, label, value, divided = false, className, ...props }: HTMLAttributes<HTMLDivElement> & {
  icon: ReactNode;
  label: ReactNode;
  value: ReactNode;
  divided?: boolean;
}) {
  return (
    <div className={cx('flex items-start gap-3', divided && 'border-t border-border pt-4', className)} {...props}>
      <IconBadge tone="soft">{icon}</IconBadge>
      <div className="min-w-0">
        <p className="text-xs font-bold text-ink-muted">{label}</p>
        <div className="mt-1 text-sm font-black leading-5 text-ink">{value}</div>
      </div>
    </div>
  );
}

type NoticeTone = 'brand' | 'warning' | 'danger' | 'allergen';

const noticeTextTone: Record<NoticeTone, { title: string; body: string; icon: 'soft' | 'warning' | 'danger' | 'accent' }> = {
  brand: { title: 'text-brand', body: 'text-ink-secondary', icon: 'soft' },
  warning: { title: 'text-warning-ink', body: 'text-warning-ink', icon: 'warning' },
  danger: { title: 'text-danger', body: 'text-danger', icon: 'danger' },
  allergen: { title: 'text-allergen-ink', body: 'text-allergen-body', icon: 'accent' },
};

export function NoticeCard({ icon, title, children, tone = 'brand', className, ...props }: Omit<HTMLAttributes<HTMLDivElement>, 'title'> & {
  icon: ReactNode;
  title?: ReactNode;
  children: ReactNode;
  tone?: NoticeTone;
}) {
  const styles = noticeTextTone[tone];
  return (
    <InsetSurface tone={tone} className={cx('p-4', className)} {...props}>
      <div className="flex items-start gap-3">
        <IconBadge tone={styles.icon}>{icon}</IconBadge>
        <div className="min-w-0 text-sm leading-6">
          {title && <h3 className={cx('font-black', styles.title)}>{title}</h3>}
          <div className={cx(Boolean(title) && 'mt-1.5', styles.body)}>{children}</div>
        </div>
      </div>
    </InsetSurface>
  );
}

export function ListRow({
  icon,
  title,
  subtitle,
  trailing,
  tone = 'soft',
  className,
  type = 'button',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  icon: ReactNode;
  title: ReactNode;
  subtitle?: ReactNode;
  trailing?: ReactNode;
  tone?: 'soft' | 'panel';
}) {
  return (
    <button
      type={type}
      className={cx(
        'flex min-h-17 w-full items-center gap-3 rounded-control p-4 text-left transition active:scale-[.99] disabled:opacity-100',
        tone === 'panel' ? 'border border-border bg-panel' : 'bg-surface-soft',
        className,
      )}
      {...props}
    >
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-panel text-brand">{icon}</span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-black">{title}</span>
        {subtitle && <span className="mt-0.5 block truncate text-xs text-ink-muted">{subtitle}</span>}
      </span>
      {trailing}
    </button>
  );
}

export function LinkRow({ icon, title, subtitle, trailing, tone = 'soft', className, ...props }: AnchorHTMLAttributes<HTMLAnchorElement> & {
  icon: ReactNode;
  title: ReactNode;
  subtitle?: ReactNode;
  trailing?: ReactNode;
  tone?: 'soft' | 'panel';
}) {
  return (
    <a className={cx(
      'flex min-h-17 w-full items-center gap-3 rounded-control p-4 text-left text-ink transition active:scale-[.99]',
      tone === 'panel' ? 'border border-border bg-panel' : 'bg-surface-soft',
      className,
    )} {...props}>
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-panel text-brand">{icon}</span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-black">{title}</span>
        {subtitle && <span className="mt-0.5 block truncate text-xs text-ink-muted">{subtitle}</span>}
      </span>
      {trailing}
    </a>
  );
}

export function AccordionItem({ title, expanded, onToggle, children }: {
  title: ReactNode;
  expanded: boolean;
  onToggle: () => void;
  children: ReactNode;
}) {
  const buttonId = useId();
  const contentId = useId();
  return (
    <div className="overflow-hidden rounded-control bg-surface-soft">
      <button id={buttonId} type="button" aria-expanded={expanded} aria-controls={contentId} onClick={onToggle} className="flex min-h-14 w-full items-center gap-3 p-4 text-left transition focus-visible:!outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-hover">
        <span className="min-w-0 flex-1 text-sm font-black leading-5">{title}</span>
        <ChevronDown size={18} className={cx('shrink-0 text-ink-subtle transition', expanded && 'rotate-180')} />
      </button>
      {expanded && <div id={contentId} role="region" aria-labelledby={buttonId} className="px-4 pb-4 text-sm leading-6 text-ink-secondary">{children}</div>}
    </div>
  );
}

export function QuantityControl({ quantity, max, label, addLabel, addText, onChange }: {
  quantity: number;
  max: number;
  label: string;
  addLabel: string;
  addText: ReactNode;
  onChange: (quantity: number) => void;
}) {
  if (quantity < 1) {
    if (max < 1) return null;
    return <PrimaryButton size="md" onClick={() => onChange(1)} aria-label={addLabel}>{addText}</PrimaryButton>;
  }

  return (
    <div className="flex min-h-12 items-center justify-between rounded-control bg-brand-soft px-1.5" role="group" aria-label={label}>
      <button type="button" onClick={() => onChange(quantity - 1)} aria-label={`${label} −`} className="grid h-11 w-11 shrink-0 place-items-center">
        <span className="grid h-8 w-8 place-items-center rounded-full bg-surface-muted text-ink transition active:scale-95"><Minus size={16} /></span>
      </button>
      <span className="text-base font-black text-brand" aria-live="polite" aria-atomic="true">{quantity}</span>
      <button type="button" onClick={() => onChange(quantity + 1)} aria-label={`${label} +`} disabled={quantity >= max} className="grid h-11 w-11 shrink-0 place-items-center disabled:opacity-45">
        <span className="grid h-8 w-8 place-items-center rounded-full bg-brand text-white transition active:scale-95"><Plus size={16} /></span>
      </button>
    </div>
  );
}

export function EmptyState({ icon, title, description, tone = 'brand' }: {
  icon: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  tone?: 'brand' | 'accent';
}) {
  return (
    <div className="mt-20 text-center">
      <span className={cx(
        'mx-auto grid h-20 w-20 place-items-center rounded-full',
        tone === 'accent' ? 'bg-accent-soft text-accent' : 'bg-brand-pale text-brand',
      )}>
        {icon}
      </span>
      <h2 className="mx-auto mt-6 max-w-[290px] text-xl font-black">{title}</h2>
      {description && <p className="mx-auto mt-2 max-w-[290px] text-sm leading-6 text-ink-secondary">{description}</p>}
    </div>
  );
}

export function SegmentedControl<T extends string>({
  value,
  items,
  onChange,
  label,
}: {
  value: T;
  items: Array<{ value: T; label: ReactNode }>;
  onChange: (value: T) => void;
  label: string;
}) {
  return (
    <div className="grid grid-cols-2 rounded-control bg-surface-muted p-1" role="group" aria-label={label}>
      {items.map((item) => (
        <button
          key={item.value}
          type="button"
          aria-pressed={value === item.value}
          onClick={() => onChange(item.value)}
          className={cx(
            'min-h-11 rounded-xl px-3 text-sm font-black transition',
            value === item.value ? 'bg-panel text-brand shadow-sm' : 'text-ink-muted',
          )}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}

export function CardActionButton({ className, type = 'button', ...props }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type={type}
      className={cx('flex min-h-12 w-full items-center justify-center gap-2 border-t border-border px-4 text-sm font-black text-brand transition active:bg-brand-pale disabled:text-ink-subtle', className)}
      {...props}
    />
  );
}

export function StickyActionFooter({ className, ...props }: HTMLAttributes<HTMLElement>) {
  return (
    <footer
      className={cx('shrink-0 border-t border-border bg-surface/96 px-page pb-[max(.75rem,env(safe-area-inset-bottom))] pt-3 backdrop-blur-xl', className)}
      {...props}
    />
  );
}

export function BottomNavigation({ children }: { children: ReactNode }) {
  return (
    <nav className="z-[800] shrink-0 border-t border-border bg-surface/95 px-1 pb-[max(.4rem,env(safe-area-inset-bottom))] pt-1.5 backdrop-blur-xl">
      <div className="grid grid-cols-4">{children}</div>
    </nav>
  );
}

export function BottomNavigationItem({ active, icon, label, ...props }: ButtonHTMLAttributes<HTMLButtonElement> & {
  active: boolean;
  icon: ReactNode;
  label: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-current={active ? 'page' : undefined}
      className={cx(
        'flex min-h-12 min-w-0 flex-col items-center justify-center gap-0.5 rounded-lg text-[9px] font-extrabold tracking-[-0.02em] transition',
        active ? 'text-brand' : 'text-ink-subtle',
      )}
      {...props}
    >
      <span aria-hidden="true" className={cx('grid h-7 w-11 shrink-0 place-items-center rounded-full', active && 'bg-brand-soft')}>{icon}</span>
      <span className="whitespace-nowrap text-center leading-none">{label}</span>
    </button>
  );
}

export function FullScreenFeedback({ icon, title, description, children, centered = false, tone = 'brand' }: {
  icon: ReactNode;
  title: ReactNode;
  description: ReactNode;
  children: ReactNode;
  centered?: boolean;
  tone?: 'brand' | 'danger';
}) {
  return (
    <div className={cx(
      'flex min-h-dvh flex-col overflow-y-auto px-page-wide pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-[max(1.5rem,env(safe-area-inset-top))] text-center sm:min-h-[780px]',
      centered && 'justify-center',
    )}>
      <div className={cx(
        'relative mx-auto grid h-16 w-16 shrink-0 place-items-center rounded-full',
        tone === 'danger' ? 'bg-danger-soft text-danger' : 'bg-highlight text-brand',
      )}>{icon}</div>
      <PageTitle className="mt-5">{title}</PageTitle>
      <p className="mx-auto mt-3 max-w-[320px] text-sm leading-6 text-ink-secondary">{description}</p>
      {children}
    </div>
  );
}

export function DialogLayer({ children, onClose, closeLabel, full = false, variant, ariaLabel, className }: {
  children: ReactNode;
  onClose: () => void;
  closeLabel: string;
  full?: boolean;
  variant?: 'sheet' | 'center' | 'full';
  ariaLabel?: string;
  className?: string;
}) {
  const resolvedVariant = full ? 'full' : variant ?? 'sheet';
  const panelRef = useRef<HTMLElement>(null);
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    const previouslyFocused = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    panelRef.current?.focus();
    const handleDialogKeys = (event: KeyboardEvent) => {
      const dialogs = document.querySelectorAll('[role="dialog"]');
      const isTopDialog = panelRef.current?.parentElement === dialogs.item(dialogs.length - 1);
      if (!isTopDialog) return;
      if (event.key === 'Escape') {
        event.preventDefault();
        onCloseRef.current();
        return;
      }
      if (event.key !== 'Tab' || !panelRef.current) return;
      const focusable = Array.from(panelRef.current.querySelectorAll<HTMLElement>(
        'button:not(:disabled), a[href], input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex]:not([tabindex="-1"])',
      )).filter((element) => !element.hasAttribute('hidden') && element.getAttribute('aria-hidden') !== 'true');
      if (focusable.length === 0) {
        event.preventDefault();
        panelRef.current.focus();
        return;
      }
      const first = focusable[0];
      const last = focusable.at(-1)!;
      if (event.shiftKey && (document.activeElement === first || document.activeElement === panelRef.current)) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', handleDialogKeys);
    return () => {
      document.removeEventListener('keydown', handleDialogKeys);
      document.body.style.overflow = previousOverflow;
      if (previouslyFocused instanceof HTMLElement) previouslyFocused.focus();
    };
  }, []);

  return (
    <div className={cx(
      'algan-dialog-backdrop absolute inset-0 z-[1000] flex bg-brand-deep/40 backdrop-blur-[2px]',
      resolvedVariant === 'center' ? 'items-center p-page' : 'items-end',
      className,
    )} role="dialog" aria-modal="true" aria-label={ariaLabel}>
      {resolvedVariant !== 'full' && <button type="button" onClick={onClose} className="absolute inset-0" aria-label={`${closeLabel} (${ariaLabel ?? 'dialog'})`} />}
      <section ref={panelRef} tabIndex={-1} data-dialog-variant={resolvedVariant} className={cx(
        'algan-dialog-panel relative z-10 w-full overflow-hidden bg-surface outline-none',
        resolvedVariant === 'full' && 'h-full min-h-0',
        resolvedVariant === 'sheet' && 'max-h-[92%] rounded-t-sheet shadow-sheet',
        resolvedVariant === 'center' && 'mx-auto max-w-sm rounded-card shadow-floating',
      )}>
        {children}
      </section>
    </div>
  );
}

export function ConfirmationDialog({ title, description, confirmLabel, cancelLabel, closeLabel, onConfirm, onCancel, tone = 'brand', className }: {
  title: string;
  description: ReactNode;
  confirmLabel: ReactNode;
  cancelLabel: ReactNode;
  closeLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
  tone?: 'brand' | 'danger';
  className?: string;
}) {
  const ConfirmButton = tone === 'danger' ? DangerButton : PrimaryButton;
  return (
    <DialogLayer variant="center" onClose={onCancel} closeLabel={closeLabel} ariaLabel={title} className={className}>
      <ModalBody>
        <ModalHeader title={title} onClose={onCancel} closeLabel={closeLabel} />
        <p className="mt-3 text-sm leading-6 text-ink-secondary">{description}</p>
        <div className="mt-5 flex flex-col gap-3">
          <ConfirmButton onClick={onConfirm}>{confirmLabel}</ConfirmButton>
          <SecondaryButton onClick={onCancel}>{cancelLabel}</SecondaryButton>
        </div>
      </ModalBody>
    </DialogLayer>
  );
}
