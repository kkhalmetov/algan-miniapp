'use client';

import type { AnchorHTMLAttributes, ButtonHTMLAttributes, HTMLAttributes, InputHTMLAttributes, ReactNode } from 'react';
import { useEffect, useId, useRef } from 'react';
import { ArrowLeft, ChevronDown, Minus, Plus, X } from 'lucide-react';

export function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ');
}

type InertLock = {
  count: number;
  inert: boolean;
  ariaHidden: string | null;
};

const inertLocks = new WeakMap<HTMLElement, InertLock>();

function lockElement(element: HTMLElement) {
  const existing = inertLocks.get(element);
  if (existing) {
    existing.count += 1;
    return;
  }
  inertLocks.set(element, {
    count: 1,
    inert: element.hasAttribute('inert'),
    ariaHidden: element.getAttribute('aria-hidden'),
  });
  element.inert = true;
  element.setAttribute('inert', '');
  element.setAttribute('aria-hidden', 'true');
}

function unlockElement(element: HTMLElement) {
  const lock = inertLocks.get(element);
  if (!lock) return;
  lock.count -= 1;
  if (lock.count > 0) return;
  inertLocks.delete(element);
  element.inert = lock.inert;
  if (lock.inert) element.setAttribute('inert', '');
  else element.removeAttribute('inert');
  if (lock.ariaHidden === null) element.removeAttribute('aria-hidden');
  else element.setAttribute('aria-hidden', lock.ariaHidden);
}

const actionButtonBase = 'flex w-full items-center justify-center gap-2 rounded-control px-4 text-center font-extrabold leading-5 transition duration-[var(--motion-fast)] active:scale-[.985] disabled:cursor-not-allowed disabled:shadow-none disabled:opacity-45';
type ActionButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & { size?: 'md' | 'lg' };
const actionButtonSize = { md: 'min-h-11 text-sm', lg: 'min-h-13 text-[15px]' } as const;

type PrimaryButtonTone = 'brand' | 'highlight' | 'warning';
const primaryButtonTone: Record<PrimaryButtonTone, string> = {
  brand: 'bg-brand-hover text-white shadow-action hover:bg-brand',
  highlight: 'bg-highlight text-brand-deep shadow-none hover:brightness-95',
  warning: 'bg-warning-ink text-white shadow-none hover:brightness-95',
};

export function PrimaryButton({ className, type = 'button', size = 'lg', tone = 'brand', ...props }: ActionButtonProps & { tone?: PrimaryButtonTone }) {
  return <button type={type} className={cx(actionButtonBase, actionButtonSize[size], primaryButtonTone[tone], 'disabled:bg-surface-muted disabled:text-ink-subtle', className)} {...props} />;
}

type TitleTone = 'default' | 'inverse' | 'muted';
const titleTone: Record<TitleTone, string> = {
  default: 'text-ink',
  inverse: 'text-white',
  muted: 'text-ink-muted',
};

export function PageTitle({ className, tone = 'default', ...props }: HTMLAttributes<HTMLHeadingElement> & { tone?: TitleTone }) {
  return <h1 className={cx('text-page-title', titleTone[tone], className)} {...props} />;
}

export function SectionTitle({ as: Component = 'h2', className, tone = 'default', ...props }: HTMLAttributes<HTMLHeadingElement> & {
  as?: 'h2' | 'h3';
  tone?: TitleTone;
}) {
  return <Component className={cx('text-section-title', titleTone[tone], className)} {...props} />;
}

export function ContentTitle({ as: Component = 'h2', className, tone = 'default', ...props }: HTMLAttributes<HTMLHeadingElement> & { as?: 'h1' | 'h2'; tone?: TitleTone }) {
  return <Component className={cx('text-2xl font-extrabold tracking-[-0.03em]', titleTone[tone], className)} {...props} />;
}

export function CardTitle({ className, tone = 'default', ...props }: HTMLAttributes<HTMLHeadingElement> & { tone?: TitleTone }) {
  return <h2 className={cx('truncate text-lg font-extrabold tracking-[-0.025em]', titleTone[tone], className)} {...props} />;
}

export function PageSection({ title, children, className }: {
  title: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cx('min-h-full bg-canvas px-page pb-8 pt-[max(1.5rem,env(safe-area-inset-top))] sm:px-page-wide', className)}>
      <PageTitle>{title}</PageTitle>
      {children}
    </section>
  );
}

export function BrandHeader({ className, ...props }: HTMLAttributes<HTMLElement>) {
  return (
    <header
      className={cx('relative overflow-hidden bg-brand px-page pb-6 pt-[max(1.25rem,env(safe-area-inset-top))] text-white sm:px-page-wide', className)}
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
    <header className={cx('shrink-0 border-b border-border bg-surface/96 px-page pb-2.5 pt-[max(.625rem,env(safe-area-inset-top))] text-ink backdrop-blur-xl sm:px-page-wide', className)} {...props}>
      <div className="flex min-h-11 items-center gap-3">
        {leading}
        <div className="min-w-0 flex-1 truncate text-center text-sm font-extrabold">{title}</div>
        {trailing}
      </div>
    </header>
  );
}

export function ScreenBody({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cx('bg-canvas px-page pt-5 sm:px-page-wide', className)} {...props} />;
}

export function SecondaryButton({ className, type = 'button', size = 'lg', ...props }: ActionButtonProps) {
  return (
    <button
      type={type}
      className={cx(actionButtonBase, actionButtonSize[size], 'border border-border bg-surface text-brand hover:border-brand/30 hover:bg-brand-pale', className)}
      {...props}
    />
  );
}

export function DangerButton({ className, type = 'button', size = 'lg', ...props }: ActionButtonProps) {
  return (
    <button
      type={type}
      className={cx(actionButtonBase, actionButtonSize[size], 'bg-danger-soft text-danger hover:bg-danger/20', className)}
      {...props}
    />
  );
}

export function TextLinkButton({ className, type = 'button', ...props }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type={type}
      className={cx('inline-flex min-h-6 items-center align-baseline font-bold text-brand-hover underline decoration-brand-hover/35 underline-offset-2 transition hover:text-brand', className)}
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
        tone === 'dark' ? 'border border-white/20 bg-white/12 text-white hover:bg-white/18' : 'border border-border bg-surface text-brand hover:bg-brand-pale',
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
        'inline-flex min-h-11 items-center justify-center rounded-control px-3 text-xs font-black transition',
        tone === 'danger'
          ? 'text-danger hover:bg-danger-soft active:bg-danger-soft'
          : 'text-brand hover:bg-brand-pale active:bg-brand-pale',
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
          'mt-2 h-13 w-full rounded-control border border-border bg-panel px-4 text-[15px] outline-none transition placeholder:text-ink-subtle focus:border-brand-hover focus:ring-4 focus:ring-brand-hover/12',
          className,
        )}
      />
    </label>
  );
}

type IconButtonTone = 'muted' | 'dark' | 'brand' | 'accent' | 'floating' | 'floatingAccent';

const iconButtonTone: Record<IconButtonTone, string> = {
  muted: 'border border-border bg-surface text-ink',
  dark: 'bg-white/12 text-white',
  brand: 'bg-brand-hover text-white',
  accent: 'bg-accent-soft text-accent-strong',
  floating: 'border border-white/50 bg-surface/95 text-ink shadow-control backdrop-blur-md',
  floatingAccent: 'border border-white/50 bg-accent-soft text-accent-strong shadow-control backdrop-blur-md',
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
        'hover:brightness-95',
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
  focusTitleOnChange = false,
}: {
  title: ReactNode;
  onBack?: () => void;
  backLabel?: string;
  onClose: () => void;
  closeLabel: string;
  focusTitleOnChange?: boolean;
}) {
  const titleRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    if (focusTitleOnChange) titleRef.current?.focus({ preventScroll: true });
  }, [focusTitleOnChange, title]);

  return (
    <div className="flex min-h-11 items-center gap-3">
      {onBack && (
        <IconButton onClick={onBack} label={backLabel ?? closeLabel}>
          <ArrowLeft size={18} />
        </IconButton>
      )}
      <h2 ref={titleRef} tabIndex={focusTitleOnChange ? -1 : undefined} className="min-w-0 flex-1 text-xl font-extrabold tracking-[-0.025em]">{title}</h2>
      <IconButton onClick={onClose} label={closeLabel}>
        <X size={18} />
      </IconButton>
    </div>
  );
}

export function SheetHandle({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div aria-hidden="true" className={cx('mx-auto h-1 w-9 rounded-full bg-border-strong', className)} {...props} />;
}

export function SheetHeader({
  title,
  onBack,
  backLabel,
  onClose,
  closeLabel,
  compact = false,
  focusTitleOnChange = false,
  className,
  ...props
}: Omit<HTMLAttributes<HTMLDivElement>, 'title'> & {
  title?: ReactNode;
  onBack?: () => void;
  backLabel?: string;
  onClose: () => void;
  closeLabel: string;
  compact?: boolean;
  focusTitleOnChange?: boolean;
}) {
  return (
    <div className={cx('shrink-0 bg-surface', className)} {...props}>
      <SheetHandle />
      <div className={compact ? 'mt-2' : 'mt-4'}>
        {title !== undefined ? (
          <ModalHeader title={title} onBack={onBack} backLabel={backLabel} onClose={onClose} closeLabel={closeLabel} focusTitleOnChange={focusTitleOnChange} />
        ) : (
          <div className="flex min-h-11 justify-end">
            <IconButton onClick={onClose} label={closeLabel}><X size={18} /></IconButton>
          </div>
        )}
      </div>
    </div>
  );
}

export function MediaSheetHeader({ children, onClose, closeLabel, className, ...props }: HTMLAttributes<HTMLDivElement> & {
  children: ReactNode;
  onClose: () => void;
  closeLabel: string;
}) {
  return (
    <div className={cx('relative h-[220px] w-full shrink-0 overflow-hidden bg-canvas sm:h-60', className)} {...props}>
      {children}
      <div aria-hidden="true" className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-brand-deep/30 to-transparent" />
      <SheetHandle className="absolute left-1/2 top-3 z-20 -translate-x-1/2 bg-white/85 shadow-control" />
      <IconButton
        onClick={onClose}
        label={closeLabel}
        tone="floating"
        className="absolute right-page top-4 z-20 sm:right-page-wide"
      >
        <X size={18} />
      </IconButton>
    </div>
  );
}

export function ModalBody({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cx('px-page pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-4 sm:px-page-wide', className)} {...props} />;
}

export function ScrollArea({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cx('hide-scrollbar min-h-0 overflow-y-auto overscroll-contain', className)} {...props} />;
}

export function SurfaceCard({ className, tone = 'panel', ...props }: HTMLAttributes<HTMLElement> & { tone?: 'panel' | 'muted' }) {
  return <article className={cx('rounded-card border', tone === 'muted' ? 'border-border bg-surface-muted' : 'border-border/90 bg-panel shadow-card', className)} {...props} />;
}

type InsetTone = 'soft' | 'panel' | 'brand' | 'brandSolid' | 'warning' | 'danger' | 'allergen';

const insetTone: Record<InsetTone, string> = {
  soft: 'border border-border/70 bg-surface-soft',
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
        'block w-full text-left transition duration-[var(--motion-fast)] hover:bg-surface-soft/50 focus-visible:!outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-hover',
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
  accentSolid: 'bg-accent text-ink',
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
    <span className={cx('inline-flex items-center gap-1.5 whitespace-nowrap rounded-full font-extrabold', statusTone[tone], statusSize[size], className)} {...props}>
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
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}) {
  return (
    <span className={cx(
      'grid shrink-0 place-items-center overflow-hidden rounded-[14px] border bg-panel shadow-card',
      size === 'lg' ? 'h-17 w-17 border-4 border-surface' : size === 'sm' ? 'h-9 w-9 rounded-[10px] border-border' : 'h-12 w-12 border-border',
      className,
    )}>
      {children}
    </span>
  );
}

export function AvatarFrame({ children, size = 'sm', className, ...props }: HTMLAttributes<HTMLDivElement> & {
  children: ReactNode;
  size?: 'sm' | 'lg';
}) {
  return (
    <div
      className={cx(
        'grid shrink-0 place-items-center overflow-hidden rounded-[16px] bg-highlight font-extrabold text-ink',
        size === 'lg' ? 'h-16 w-16 text-2xl' : 'h-12 w-12 text-lg',
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function DisclosureIndicator({ className }: { className?: string }) {
  return (
    <span className={cx('grid h-9 w-9 shrink-0 place-items-center rounded-control bg-brand-pale text-brand', className)} aria-hidden="true">
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
        <p className="text-xs font-semibold text-ink-muted">{label}</p>
        <div className="mt-1 text-sm font-extrabold leading-5 text-ink">{value}</div>
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

export function NoticeCard({ icon, title, titleAs: Title = 'h3', children, tone = 'brand', className, ...props }: Omit<HTMLAttributes<HTMLDivElement>, 'title'> & {
  icon: ReactNode;
  title?: ReactNode;
  titleAs?: 'h2' | 'h3' | 'p';
  children: ReactNode;
  tone?: NoticeTone;
}) {
  const styles = noticeTextTone[tone];
  return (
    <InsetSurface tone={tone} className={cx('p-4', className)} {...props}>
      <div className="flex items-start gap-3">
        <IconBadge tone={styles.icon}>{icon}</IconBadge>
        <div className="min-w-0 text-sm leading-6">
          {title && <Title className={cx('font-extrabold', styles.title)}>{title}</Title>}
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
  density = 'default',
  subtitleWrap = false,
  className,
  type = 'button',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  icon: ReactNode;
  title: ReactNode;
  subtitle?: ReactNode;
  trailing?: ReactNode;
  tone?: 'soft' | 'panel';
  density?: 'default' | 'compact';
  subtitleWrap?: boolean;
}) {
  return (
    <button
      type={type}
      className={cx(
        'flex w-full items-center gap-3 rounded-card text-left transition active:scale-[.99] disabled:opacity-100',
        density === 'compact' ? 'min-h-14 px-3 py-2' : 'min-h-17 p-4',
        tone === 'panel' ? 'border border-border bg-panel hover:bg-surface-soft' : 'border border-border/70 bg-surface-soft hover:bg-surface-muted',
        className,
      )}
      {...props}
    >
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-control bg-brand-pale text-brand">{icon}</span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-extrabold">{title}</span>
        {subtitle && (
          <span className={cx('mt-0.5 block text-xs text-ink-muted', subtitleWrap ? 'whitespace-normal leading-5' : 'truncate')}>
            {subtitle}
          </span>
        )}
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
      'flex min-h-17 w-full items-center gap-3 rounded-card p-4 text-left text-ink transition active:scale-[.99]',
      tone === 'panel' ? 'border border-border bg-panel hover:bg-surface-soft' : 'border border-border/70 bg-surface-soft hover:bg-surface-muted',
      className,
    )} {...props}>
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-control bg-brand-pale text-brand">{icon}</span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-extrabold">{title}</span>
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
    <div className="overflow-hidden rounded-card border border-border/70 bg-surface-soft">
      <button id={buttonId} type="button" aria-expanded={expanded} aria-controls={contentId} onClick={onToggle} className="flex min-h-14 w-full items-center gap-3 p-4 text-left transition hover:bg-surface-muted focus-visible:!outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-hover">
        <span className="min-w-0 flex-1 text-sm font-extrabold leading-5">{title}</span>
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

  return <QuantityStepper quantity={quantity} min={0} max={max} label={label} onChange={onChange} />;
}

export function QuantityStepper({ quantity, min = 1, max, label, onChange }: {
  quantity: number;
  min?: number;
  max: number;
  label: string;
  onChange: (quantity: number) => void;
}) {
  return (
    <div className="flex min-h-12 items-center justify-between rounded-control bg-brand-pale px-1.5" role="group" aria-label={label}>
      <button type="button" onClick={() => onChange(quantity - 1)} aria-label={`${label} −`} disabled={quantity <= min} className="grid h-11 w-11 shrink-0 place-items-center disabled:opacity-45">
        <span className="grid h-8 w-8 place-items-center rounded-[10px] bg-surface text-ink transition active:scale-95"><Minus size={16} /></span>
      </button>
      <span className="text-base font-extrabold text-brand" aria-live="polite" aria-atomic="true">{quantity}</span>
      <button type="button" onClick={() => onChange(quantity + 1)} aria-label={`${label} +`} disabled={quantity >= max} className="grid h-11 w-11 shrink-0 place-items-center disabled:opacity-45">
        <span className="grid h-8 w-8 place-items-center rounded-[10px] bg-brand-hover text-white transition active:scale-95"><Plus size={16} /></span>
      </button>
    </div>
  );
}

export function EmptyState({ icon, title, description, children, tone = 'brand' }: {
  icon: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  children?: ReactNode;
  tone?: 'brand' | 'accent';
}) {
  return (
    <div className="mt-16 text-center">
      <span className={cx(
        'mx-auto grid h-20 w-20 rotate-[-3deg] place-items-center rounded-[24px]',
        tone === 'accent' ? 'bg-accent-soft text-accent' : 'bg-brand-pale text-brand',
      )}>
        {icon}
      </span>
      <h2 className="mx-auto mt-6 max-w-[290px] text-xl font-extrabold">{title}</h2>
      {description && <p className="mx-auto mt-2 max-w-[290px] text-sm leading-6 text-ink-secondary">{description}</p>}
      {children && <div className="mx-auto mt-6 max-w-[280px]">{children}</div>}
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
    <div className="grid grid-cols-2 rounded-control border border-border bg-surface p-1" role="group" aria-label={label}>
      {items.map((item) => (
        <button
          key={item.value}
          type="button"
          aria-pressed={value === item.value}
          onClick={() => onChange(item.value)}
          className={cx(
            'min-h-11 rounded-[10px] px-3 text-sm font-extrabold transition',
            value === item.value ? 'bg-brand-pale text-brand shadow-sm' : 'text-ink-muted hover:bg-surface-soft',
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
      className={cx('flex min-h-12 w-full items-center justify-center gap-2 border-t border-border px-4 text-sm font-extrabold text-brand transition hover:bg-brand-pale active:bg-brand-pale disabled:text-ink-subtle', className)}
      {...props}
    />
  );
}

export function StickyActionFooter({ className, density = 'default', ...props }: HTMLAttributes<HTMLElement> & { density?: 'default' | 'compact' }) {
  return (
    <footer
      className={cx(
        'shrink-0 border-t border-border bg-surface/96 px-page backdrop-blur-xl sm:px-page-wide',
        density === 'compact' ? 'pb-[max(.625rem,env(safe-area-inset-bottom))] pt-2.5' : 'pb-[max(.75rem,env(safe-area-inset-bottom))] pt-3',
        className,
      )}
      {...props}
    />
  );
}

export function BottomNavigation({ children }: { children: ReactNode }) {
  return (
    <nav className="z-[800] shrink-0 border-t border-border bg-surface/96 px-2 pb-[max(.4rem,env(safe-area-inset-bottom))] pt-1.5 backdrop-blur-xl">
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
        'flex min-h-12 min-w-0 flex-col items-center justify-center gap-0.5 rounded-control text-[10px] font-bold tracking-[-0.02em] transition hover:bg-surface-soft',
        active ? 'text-brand' : 'text-ink-subtle',
      )}
      {...props}
    >
      <span aria-hidden="true" className={cx('grid h-7 w-11 shrink-0 place-items-center rounded-[10px]', active && 'bg-brand-soft')}>{icon}</span>
      <span className="whitespace-nowrap text-center leading-none">{label}</span>
    </button>
  );
}

export function FullScreenFeedback({ icon, title, description, children, centered = false, tone = 'brand', className }: {
  icon: ReactNode;
  title: ReactNode;
  description: ReactNode;
  children: ReactNode;
  centered?: boolean;
  tone?: 'brand' | 'coral' | 'danger';
  className?: string;
}) {
  return (
    <div className={cx(
      'hide-scrollbar flex min-h-dvh flex-col overflow-y-auto overscroll-contain px-page pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-[max(1.5rem,env(safe-area-inset-top))] text-center sm:min-h-[780px] sm:px-page-wide',
      tone === 'coral' && 'bg-accent-soft',
      tone === 'danger' && 'bg-danger-soft/30',
      centered && 'justify-center',
      className,
    )}>
      <div className={cx(
        'relative mx-auto grid h-18 w-18 shrink-0 rotate-[-3deg] place-items-center rounded-[24px]',
        tone === 'danger' && 'bg-danger-soft text-danger',
        tone === 'coral' && 'bg-accent text-brand-deep',
        tone === 'brand' && 'bg-highlight text-brand',
      )}>{icon}</div>
      <PageTitle className="mt-5">{title}</PageTitle>
      <p className="mx-auto mt-3 max-w-[320px] text-sm leading-6 text-ink-secondary">{description}</p>
      {children}
    </div>
  );
}

export function DialogLayer({ children, onClose, closeLabel, full = false, variant, ariaLabel, className, sheetHeight = 'content' }: {
  children: ReactNode;
  onClose: () => void;
  closeLabel: string;
  full?: boolean;
  variant?: 'sheet' | 'center' | 'full';
  ariaLabel?: string;
  className?: string;
  sheetHeight?: 'content' | 'medium' | 'tall';
}) {
  const resolvedVariant = full ? 'full' : variant ?? 'sheet';
  const overlayRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLElement>(null);
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    const previouslyFocused = document.activeElement;
    const overlay = overlayRef.current;
    const siblings = overlay?.parentElement
      ? Array.from(overlay.parentElement.children).filter((element): element is HTMLElement => element instanceof HTMLElement && element !== overlay)
      : [];
    siblings.forEach(lockElement);
    panelRef.current?.focus({ preventScroll: true });
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
        panelRef.current.focus({ preventScroll: true });
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
      siblings.forEach(unlockElement);
      if (previouslyFocused instanceof HTMLElement) previouslyFocused.focus({ preventScroll: true });
    };
  }, []);

  return (
    <div ref={overlayRef} className={cx(
      'algan-dialog-backdrop absolute inset-0 z-[1000] flex overscroll-contain bg-brand-deep/45 backdrop-blur-[3px]',
      resolvedVariant === 'center' ? 'items-center p-page' : 'items-end',
      className,
    )} role="dialog" aria-modal="true" aria-label={ariaLabel}>
      {resolvedVariant !== 'full' && <button type="button" onClick={onClose} className="absolute inset-0" aria-label={`${closeLabel} (${ariaLabel ?? 'dialog'})`} aria-hidden="true" tabIndex={-1} />}
      <section ref={panelRef} tabIndex={-1} data-dialog-variant={resolvedVariant} className={cx(
        'algan-dialog-panel relative z-10 w-full overflow-hidden bg-surface outline-none',
        resolvedVariant === 'full' && 'h-full min-h-0',
        resolvedVariant === 'sheet' && 'max-h-[92%] rounded-t-sheet shadow-sheet',
        resolvedVariant === 'sheet' && sheetHeight === 'medium' && 'h-[82%]',
        resolvedVariant === 'sheet' && sheetHeight === 'tall' && 'h-[92%]',
        resolvedVariant === 'center' && 'mx-auto max-w-sm rounded-sheet shadow-floating',
      )}>
        {children}
      </section>
    </div>
  );
}

export function ConfirmationDialog({ title, description, confirmLabel, cancelLabel, closeLabel, onConfirm, onCancel, icon, tone = 'brand', className, showClose = true }: {
  title: string;
  description: ReactNode;
  confirmLabel: ReactNode;
  cancelLabel: ReactNode;
  closeLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
  icon?: ReactNode;
  tone?: 'brand' | 'warning' | 'danger';
  className?: string;
  showClose?: boolean;
}) {
  const iconTone = tone === 'danger' ? 'bg-danger-soft text-danger' : tone === 'warning' ? 'bg-warning-surface text-warning-ink' : 'bg-brand-pale text-brand';
  return (
    <DialogLayer variant="center" onClose={onCancel} closeLabel={closeLabel} ariaLabel={title} className={className}>
      <ModalBody>
        {showClose ? (
          <ModalHeader title={title} onClose={onCancel} closeLabel={closeLabel} />
        ) : (
          <div className="min-h-2" />
        )}
        {icon && <span className={cx('mt-3 grid h-14 w-14 place-items-center rounded-[18px]', iconTone)}>{icon}</span>}
        {!showClose && <h2 className={cx('text-xl font-extrabold tracking-[-0.025em]', Boolean(icon) && 'mt-4')}>{title}</h2>}
        <p className={cx('text-sm leading-6 text-ink-secondary', showClose && !icon ? 'mt-3' : 'mt-2')}>{description}</p>
        <div className="mt-5 flex flex-col gap-3">
          {tone === 'danger'
            ? <DangerButton onClick={onConfirm}>{confirmLabel}</DangerButton>
            : <PrimaryButton onClick={onConfirm} tone={tone === 'warning' ? 'warning' : 'brand'}>{confirmLabel}</PrimaryButton>}
          <SecondaryButton onClick={onCancel}>{cancelLabel}</SecondaryButton>
        </div>
      </ModalBody>
    </DialogLayer>
  );
}
