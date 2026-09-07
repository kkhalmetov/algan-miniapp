'use client';
/* eslint-disable @next/next/no-img-element */

import { CircleDollarSign, CircleHelp, PackageCheck, Phone, RotateCcw, Settings2 } from 'lucide-react';
import { useState } from 'react';
import { ProfileRow } from '@/components/algan/profile-row';
import type { Translator } from '@/components/algan/types';
import { AvatarFrame, BrandHeader, ConfirmationDialog, ContentTitle, DangerButton, DialogLayer, ModalBody, PrimaryButton, ScreenBody, ScrollArea, SecondaryButton, SectionTitle, SegmentedControl, SheetHeader, StickyActionFooter, TextField } from '@/components/ui-kit';
import { avatarRetryUrl, isDemoFallbackName, localizedFirstName } from '@/lib/app-utils';
import { formatKazakhstanPhoneInput, normalizeKazakhstanPhone } from '@/lib/phone';
import { haptic, telegramProfile } from '@/lib/telegram';
import type { Currency, Locale, UserProfile } from '@/lib/types';

export function ProfileTab({ t, profile, currency, currencyLoading, currencyRateError, onToggleCurrency, openSettings, openHelp, openDocuments, resetDemo }: {
  t: Translator;
  profile: UserProfile;
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
  return (
    <section className="min-h-full bg-canvas pb-8">
      <BrandHeader>
        <div aria-hidden="true" className="absolute -right-12 -top-12 h-44 w-44 rounded-full bg-brand-hover" />
        <div className="relative flex items-center gap-4">
          <ProfileAvatar key={profile.photoUrl ?? 'fallback-avatar'} profile={profile} fallbackName={firstName} />
          <div><ContentTitle as="h1" tone="inverse">{fullName}</ContentTitle><p className="mt-1 text-sm text-white/70">{telegramUsername ? `@${telegramUsername}` : 'Telegram'}</p></div>
        </div>
      </BrandHeader>

      <ScreenBody>
        <SectionTitle className="mb-3">{t('profile')}</SectionTitle>
        <div className="space-y-3">
          <ProfileRow icon={<Settings2 size={18} />} label={t('settings')} onClick={openSettings} />
          <ProfileRow icon={<CircleHelp size={18} />} label={t('support')} onClick={openHelp} />
          <ProfileRow icon={<PackageCheck size={18} />} label={t('legal')} onClick={openDocuments} />
        </div>
        <DangerButton onClick={() => setResetConfirmationOpen(true)} className="mt-6">{t('signOutDemo')}</DangerButton>
        <SecondaryButton onClick={onToggleCurrency} disabled={currencyLoading} aria-busy={currencyLoading} className="mt-2">
          <CircleDollarSign size={19} />{currencyLoading ? t('currencyLoading') : currency === 'KZT' ? t('showRubles') : t('showTenge')}
        </SecondaryButton>
        {currencyRateError && <p role="alert" className="mt-2 text-center text-xs font-bold text-danger">{t('currencyRateError')}</p>}
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
    <DialogLayer className="z-[1200]" onClose={onClose} closeLabel={t('close')} ariaLabel={t('changePhone')} sheetHeight="medium">
      <form className="flex h-full min-h-0 flex-col" onSubmit={(event) => {
          event.preventDefault();
          if (normalizedPhone) onSave(normalizedPhone);
        }}>
        <ModalBody className="flex min-h-0 flex-1 flex-col pb-0">
          <SheetHeader title={t('changePhone')} onClose={onClose} closeLabel={t('close')} />
          <ScrollArea className="flex-1 pb-5">
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
      <ModalBody>
        <SheetHeader title={t('settings')} onClose={onClose} closeLabel={t('close')} />
        <div className="pb-1">
          <SectionTitle as="h3" className="mt-4 text-base">{t('accountDetails')}</SectionTitle>
          <div className="mt-3"><ProfileRow icon={<Phone size={18} />} label={t('phoneNumber')} value={phone ? formatKazakhstanPhoneInput(phone) : undefined} onClick={onEditPhone} /></div>
          <SectionTitle as="h3" className="mt-6 text-base">{t('languageChoice')}</SectionTitle>
          <div className="mt-3"><SegmentedControl value={locale} label={t('languageChoice')} items={[{ value: 'ru', label: t('russianLanguage') }, { value: 'kk', label: t('kazakhLanguage') }]} onChange={(nextLocale) => { if (nextLocale !== locale) { setLocale(nextLocale); haptic('tap'); } }} /></div>
        </div>
      </ModalBody>
    </DialogLayer>
  );
}
