'use client';

import type { ButtonHTMLAttributes, HTMLAttributes, InputHTMLAttributes, ReactNode } from 'react';
import { ArrowLeft, X } from 'lucide-react';

export function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ');
}

export function PrimaryButton({ className, type = 'button', ...props }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button type={type} className={cx('primary-button', className)} {...props} />;
}

export function PageTitle({ className, ...props }: HTMLAttributes<HTMLHeadingElement>) {
  return <h1 className={cx('text-page-title text-ink', className)} {...props} />;
}

export function SectionTitle({ className, ...props }: HTMLAttributes<HTMLHeadingElement>) {
  return <h2 className={cx('text-section-title text-ink', className)} {...props} />;
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

export function SecondaryButton({ className, type = 'button', ...props }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type={type}
      className={cx('flex min-h-12 w-full items-center justify-center gap-2 rounded-control bg-brand-pale px-4 text-sm font-black text-brand transition active:scale-[.99] disabled:opacity-45', className)}
      {...props}
    />
  );
}

export function DangerButton({ className, type = 'button', ...props }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type={type}
      className={cx('flex min-h-14 w-full items-center justify-center rounded-control bg-accent-soft px-4 text-sm font-black text-accent-strong transition active:scale-[.99] disabled:opacity-45', className)}
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

export function SurfaceCard({ className, ...props }: HTMLAttributes<HTMLElement>) {
  return <article className={cx('rounded-card border border-border bg-panel shadow-card', className)} {...props} />;
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
  tone?: 'brand' | 'accent' | 'soft';
  className?: string;
}) {
  const tones = {
    brand: 'bg-brand-pale text-brand',
    accent: 'bg-accent-soft text-accent-strong',
    soft: 'bg-surface-soft text-brand',
  };

  return (
    <span className={cx('grid h-10 w-10 shrink-0 place-items-center rounded-full', tones[tone], className)}>
      {children}
    </span>
  );
}

export function ListRow({
  icon,
  title,
  subtitle,
  trailing,
  className,
  type = 'button',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  icon: ReactNode;
  title: ReactNode;
  subtitle?: ReactNode;
  trailing?: ReactNode;
}) {
  return (
    <button
      type={type}
      className={cx('flex min-h-17 w-full items-center gap-3 rounded-control bg-surface-soft p-4 text-left transition active:scale-[.99] disabled:opacity-100', className)}
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

export function EmptyState({ icon, title, description, tone = 'brand' }: {
  icon: ReactNode;
  title: ReactNode;
  description: ReactNode;
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
      <p className="mx-auto mt-2 max-w-[290px] text-sm leading-6 text-ink-secondary">{description}</p>
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

export function DialogLayer({ children, onClose, closeLabel, full = false, ariaLabel, className }: {
  children: ReactNode;
  onClose: () => void;
  closeLabel: string;
  full?: boolean;
  ariaLabel?: string;
  className?: string;
}) {
  return (
    <div className={cx('absolute inset-0 z-[1000] flex items-end bg-brand-deep/40 backdrop-blur-[2px]', className)} role="dialog" aria-modal="true" aria-label={ariaLabel}>
      <button type="button" onClick={onClose} className="absolute inset-0" aria-label={`${closeLabel} (${ariaLabel ?? 'dialog'})`} />
      <section className={cx('relative z-10 w-full overflow-hidden bg-surface', full ? 'min-h-full' : 'max-h-[92%] rounded-t-sheet shadow-sheet')}>
        {children}
      </section>
    </div>
  );
}
