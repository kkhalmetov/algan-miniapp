import { ChevronRight } from '@/components/icons';
import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { ListRow } from '@/components/ui-kit';

export function ProfileRow({ icon, label, value, valueWrap = false, onClick, className, density = 'default', disabled, ...props }: Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'onClick'> & {
  icon: ReactNode;
  label: string;
  value?: string;
  valueWrap?: boolean;
  onClick?: () => void;
  className?: string;
  density?: 'default' | 'compact';
}) {
  return (
    <ListRow
      icon={icon}
      title={label}
      subtitle={value}
      subtitleWrap={valueWrap}
      onClick={onClick}
      disabled={disabled || !onClick}
      trailing={onClick ? <ChevronRight size={17} className="text-ink-subtle" /> : undefined}
      className={className}
      density={density}
      {...props}
    />
  );
}
