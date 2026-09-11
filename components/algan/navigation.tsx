import { Heart, Home, ShoppingBag, UserRound } from '@/components/icons';
import type { ReactNode } from 'react';
import type { Translator } from '@/components/algan/types';
import { BottomNavigation, BottomNavigationItem } from '@/components/ui-kit';
import { haptic } from '@/lib/telegram';
import type { CopyKey } from '@/lib/translations';
import type { Tab } from '@/lib/types';

export function BottomNav({ tab, setTab, t, activeOrders = 0 }: { tab: Tab; setTab: (tab: Tab) => void; t: Translator; activeOrders?: number }) {
  const items: { id: Tab; icon: ReactNode; label: CopyKey }[] = [
    { id: 'home', icon: <Home size={21} />, label: 'home' },
    { id: 'orders', icon: <ShoppingBag size={21} />, label: 'ordersNav' },
    { id: 'favorites', icon: <Heart size={21} />, label: 'favoritesNav' },
    { id: 'profile', icon: <UserRound size={21} />, label: 'profile' },
  ];
  return (
    <BottomNavigation>
      {items.map((item) => (
        <BottomNavigationItem key={item.id} active={tab === item.id} icon={item.icon} label={t(item.label)} badge={item.id === 'orders' ? activeOrders : 0} onClick={() => { setTab(item.id); haptic('tap'); }} />
      ))}
    </BottomNavigation>
  );
}
