'use client';

import type { ButtonHTMLAttributes, HTMLAttributes, InputHTMLAttributes, ReactNode } from 'react';
import { ArrowLeft, X } from 'lucide-react';

export function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ');
}

export function PrimaryButton({ className, type = 'button', ...props }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button type={type} className={cx('primary-button', className)} {...props} />;
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

export function SurfaceCard({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cx('rounded-card border border-border bg-panel shadow-card', className)} {...props} />;
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
