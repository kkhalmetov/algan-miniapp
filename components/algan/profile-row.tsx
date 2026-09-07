import { ChevronRight } from 'lucide-react';
import type { ReactNode } from 'react';
import { ListRow } from '@/components/ui-kit';

export function ProfileRow({ icon, label, value, valueWrap = false, onClick, className, density = 'default' }: {
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
      disabled={!onClick}
      trailing={onClick ? <ChevronRight size={17} className="text-ink-subtle" /> : undefined}
      className={className}
      density={density}
    />
  );
}
