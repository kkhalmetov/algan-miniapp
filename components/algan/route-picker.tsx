'use client';
/* eslint-disable @next/next/no-img-element */

import { ArrowUpRight } from 'lucide-react';
import type { Translator } from '@/components/algan/types';
import { DialogLayer, ListRow, ModalBody, ScrollArea, SheetHeader } from '@/components/ui-kit';
import { getRouteOptions, type RouteProvider } from '@/lib/maps';
import { haptic, openExternalLink } from '@/lib/telegram';

const routeProviderLogo: Record<RouteProvider, string> = {
  '2gis': '/images/map-providers/2gis.webp',
  yandex: '/images/map-providers/yandex-maps.webp',
  google: '/images/map-providers/google-maps.webp',
  apple: '/images/map-providers/apple-maps.webp',
};

export function RoutePicker({ lat, lng, t, onClose }: {
  lat: number;
  lng: number;
  t: Translator;
  onClose: () => void;
}) {
  const options = getRouteOptions(lat, lng, true);
  return (
    <DialogLayer onClose={onClose} closeLabel={t('close')} ariaLabel={t('chooseMap')} className="z-[1200]" sheetHeight="medium">
      <ModalBody className="flex h-full min-h-0 flex-col pt-4">
        <SheetHeader title={t('chooseMap')} onClose={onClose} closeLabel={t('close')} />
        <ScrollArea className="mt-4 flex-1 pb-1">
          <div className="space-y-3">
            {options.map((option) => (
              <ListRow
                key={option.id}
                icon={<img src={routeProviderLogo[option.id]} alt="" className="h-10 w-10 rounded-control object-cover" />}
                title={option.label}
                tone="panel"
                trailing={<span className="flex items-center gap-1 text-xs font-extrabold text-brand">{t('openInMap')}<ArrowUpRight size={16} /></span>}
                onClick={() => { openExternalLink(option.url); haptic('tap'); }}
              />
            ))}
          </div>
        </ScrollArea>
      </ModalBody>
    </DialogLayer>
  );
}
