'use client';
/* eslint-disable @next/next/no-img-element */

import { CircleDollarSign, CircleHelp, Leaf, PackageCheck, Phone, RotateCcw, Settings2 } from '@/components/icons';
import { useState } from 'react';
import { ProfileRow } from '@/components/algan/profile-row';
import type { Translator } from '@/components/algan/types';
import { AvatarFrame, BrandHeader, ConfirmationDialog, ContentTitle, DialogLayer, InsetSurface, ModalBody, PageTitle, PrimaryButton, ScreenBody, ScrollArea, SectionTitle, SegmentedControl, SheetHeader, StickyActionFooter, TertiaryButton, TextField } from '@/components/ui-kit';
import { avatarRetryUrl, isDemoFallbackName, localizedFirstName } from '@/lib/app-utils';
import { formatKazakhstanPhoneInput, normalizeKazakhstanPhone } from '@/lib/phone';
import { haptic, telegramProfile } from '@/lib/telegram';
import type { Currency, Locale, Order, UserProfile } from '@/lib/types';
import { boxes } from '@/lib/mock-data';
import { usePriceFormatter } from './price-context';

export function ProfileTab({ t, profile, locale = 'kk', orders = [], currency, currencyLoading, currencyRateError, onToggleCurrency, openSettings, openHelp, openDocuments, resetDemo }: {
  t: Translator;
  profile: UserProfile;
  locale?: Locale;
  orders?: Order[];
  currency: Currency;
  currencyLoading: boolean;
  currencyRateError: boolean;
  onToggleCurrency: () => void;
  openSettings: () => void;
  openHelp: () => void;
  openDocuments: () => void;
  resetDemo: () => void;
}) {
  const telegramUsername = telegramProfile().username.trim().replace(/^@/, '');
  const firstName = localizedFirstName(profile, t('fallbackUser'));
  const fullName = [firstName, isDemoFallbackName(profile.firstName) ? undefined : profile.lastName].filter(Boolean).join(' ');
  const [resetConfirmationOpen, setResetConfirmationOpen] = useState(false);
  const formatPrice = usePriceFormatter(locale);
  const purchasedItems = orders.filter((order) => order.status !== 'cancelled').flatMap((order) => order.items);
  const boxCount = purchasedItems.reduce((sum, item) => sum + item.quantity, 0);
  const saved = purchasedItems.reduce((sum, item) => sum + Math.max(0, (boxes.find((box) => box.id === item.boxId)?.originalPrice ?? item.unitPrice) - item.unitPrice) * item.quantity, 0);
  return (
    <section className="min-h-full bg-canvas pb-8">
      <BrandHeader>
        <PageTitle>{t('profile')}</PageTitle>
        <div className="mt-6 flex items-center gap-4">
          <ProfileAvatar key={profile.photoUrl ?? 'fallback-avatar'} profile={profile} fallbackName={firstName} />
          <div className="min-w-0 flex-1"><ContentTitle className="break-words">{fullName}</ContentTitle><p className="mt-1 truncate text-sm text-ink-muted">{telegramUsername ? `@${telegramUsername}` : 'Telegram'}</p></div>
        </div>
      </BrandHeader>

      <ScreenBody flush>
        <InsetSurface tone="brand" radius="card" className="mb-7 p-5">
          <p className="flex items-center gap-2 text-xs font-bold text-brand"><Leaf size={17} />{t('yourImpact')}</p>
          <div className="mt-4 grid grid-cols-2 divide-x divide-brand/15 tabular-nums"><div className="pr-3"><p className="text-3xl font-extrabold tracking-[-.04em]">{boxCount}</p><p className="mt-1 text-[11px] text-ink-secondary">{t('savedBoxes')}</p></div><div className="pl-4"><p className="text-2xl font-extrabold tracking-[-.04em]">{formatPrice(saved)}</p><p className="mt-1 text-[11px] text-ink-secondary">{t('moneySaved')}</p></div></div>
        </InsetSurface>
        <p className="algan-eyebrow mb-3 text-ink-muted">{t('preferences')}</p>
        <div className="space-y-1.5">
          <ProfileRow icon={<Settings2 size={18} />} label={t('settings')} onClick={openSettings} />
          <ProfileRow icon={<CircleDollarSign size={19} />} label={currencyLoading ? t('currencyLoading') : currency === 'KZT' ? t('showRubles') : t('showTenge')} disabled={currencyLoading} aria-busy={currencyLoading} onClick={onToggleCurrency} />
        </div>
        {currencyRateError && <p role="alert" className="mt-2 text-center text-xs font-bold text-danger">{t('currencyRateError')}</p>}
        <p className="algan-eyebrow mb-3 mt-6 text-ink-muted">{t('service')}</p>
        <div className="space-y-1.5">
          <ProfileRow icon={<CircleHelp size={18} />} label={t('support')} onClick={openHelp} />
          <ProfileRow icon={<PackageCheck size={18} />} label={t('legal')} onClick={openDocuments} />
        </div>
        <TertiaryButton tone="danger" onClick={() => setResetConfirmationOpen(true)} className="mt-6 w-full">{t('signOutDemo')}</TertiaryButton>
      </ScreenBody>
      {resetConfirmationOpen && (
        <ConfirmationDialog title={t('signOutDemo')} description={t('resetDemoConfirm')} confirmLabel={t('signOutDemo')} cancelLabel={t('cancel')} closeLabel={t('close')} icon={<RotateCcw size={24} />} tone="danger" onCancel={() => setResetConfirmationOpen(false)} onConfirm={resetDemo} />
      )}
    </section>
  );
}

function ProfileAvatar({ profile, fallbackName, compact = false }: { profile: UserProfile; fallbackName: string; compact?: boolean }) {
  const [imageFailed, setImageFailed] = useState(false);
  const [reloadAttempt, setReloadAttempt] = useState(0);
  const initial = fallbackName.trim().charAt(0).toUpperCase() || 'A';
  const photoSource = profile.photoUrl
    ? reloadAttempt === 0 ? profile.photoUrl : avatarRetryUrl(profile.photoUrl, reloadAttempt)
    : undefined;

  const retryImage = () => {
    if (reloadAttempt < 2) setReloadAttempt((attempt) => attempt + 1);
    else setImageFailed(true);
  };

  return (
    <AvatarFrame size={compact ? 'sm' : 'lg'}>
      {photoSource && !imageFailed
        ? <img src={photoSource} alt="" referrerPolicy="no-referrer" className="h-full w-full object-cover" onError={retryImage} />
        : initial}
    </AvatarFrame>
  );
}

export function PhoneEditor({ currentPhone, t, onClose, onSave }: {
  currentPhone?: string;
  t: Translator;
  onClose: () => void;
  onSave: (phone: string) => void;
}) {
  const [value, setValue] = useState(formatKazakhstanPhoneInput(currentPhone ?? '+7'));
  const normalizedPhone = normalizeKazakhstanPhone(value);
  const showError = value.replace(/\D/g, '').length > 1 && !normalizedPhone;

  return (
    <DialogLayer className="z-[1200]" onClose={onClose} closeLabel={t('close')} ariaLabel={t('changePhone')}>
      <form className="flex min-h-0 flex-col" onSubmit={(event) => {
          event.preventDefault();
          if (normalizedPhone) onSave(normalizedPhone);
        }}>
        <ModalBody className="flex min-h-0 flex-1 flex-col pb-0">
          <SheetHeader title={t('changePhone')} onClose={onClose} closeLabel={t('close')} />
          <ScrollArea className="flex-1 pb-5">
            <p className="mt-4 text-sm leading-6 text-ink-muted">{t('nameHelp')}</p>
            <TextField label={t('phone')} required value={value} onValueChange={(phone) => setValue(formatKazakhstanPhoneInput(phone))} placeholder="+7 700 000 00 00" autoComplete="tel" type="tel" aria-invalid={showError} aria-describedby={showError ? 'phone-error' : undefined} />
            {showError && <p id="phone-error" className="mt-2 text-xs font-bold text-danger" role="alert">{t('invalidPhone')}</p>}
          </ScrollArea>
        </ModalBody>
        <StickyActionFooter><PrimaryButton type="submit" disabled={!normalizedPhone}>{t('savePhone')}</PrimaryButton></StickyActionFooter>
      </form>
    </DialogLayer>
  );
}

export function SettingsModal({ t, locale, setLocale, phone, onEditPhone, onClose }: {
  t: Translator;
  locale: Locale;
  setLocale: (locale: Locale) => void;
  phone?: string;
  onEditPhone: () => void;
  onClose: () => void;
}) {
  return (
    <DialogLayer onClose={onClose} closeLabel={t('close')} ariaLabel={t('settings')}>
      <ModalBody className="flex min-h-0 flex-col">
        <SheetHeader title={t('settings')} onClose={onClose} closeLabel={t('close')} />
        <ScrollArea className="pb-2">
          <p className="mt-3 text-sm leading-6 text-ink-muted">{t('settingsIntro')}</p>
          <SectionTitle as="h3" className="mt-6">{t('languageChoice')}</SectionTitle>
          <div className="mt-3"><SegmentedControl value={locale} label={t('languageChoice')} items={[{ value: 'ru', label: t('russianLanguage') }, { value: 'kk', label: t('kazakhLanguage') }]} onChange={(nextLocale) => { if (nextLocale !== locale) { setLocale(nextLocale); haptic('tap'); } }} /></div>
          <SectionTitle as="h3" className="mt-6">{t('accountDetails')}</SectionTitle>
          <div className="mt-3"><ProfileRow icon={<Phone size={18} />} label={t('phoneNumber')} value={phone ? formatKazakhstanPhoneInput(phone) : undefined} onClick={onEditPhone} /></div>
        </ScrollArea>
      </ModalBody>
    </DialogLayer>
  );
}
