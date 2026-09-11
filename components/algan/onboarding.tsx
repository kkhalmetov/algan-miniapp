/* eslint-disable @next/next/no-img-element */
import { FileCheck2, FileText, Languages, ShieldCheck } from '@/components/icons';
import { useState, type ReactNode } from 'react';
import { AlganLogo } from '@/components/algan-logo';
import { ProfileRow } from '@/components/algan/profile-row';
import type { LegalDocument, Translator } from '@/components/algan/types';
import { ContentTitle, IconBadge, PageTitle, PillButton, PrimaryButton, ScrollArea, TextField, TextLinkButton } from '@/components/ui-kit';
import { formatKazakhstanPhoneInput, normalizeKazakhstanPhone } from '@/lib/phone';
import type { Locale } from '@/lib/types';

export function Splash({ t }: { t: Translator }) {
  return (
    <PhoneShell>
      <main className="algan-splash algan-full-screen relative flex flex-col items-center justify-center overflow-hidden px-page py-12" aria-label={`Algan — ${t('loading')}`}>
        <span aria-hidden="true" className="absolute -right-24 -top-24 h-80 w-80 rounded-full border border-brand-deep/10" />
        <span aria-hidden="true" className="absolute -bottom-44 -left-32 h-96 w-96 rounded-full border-[50px] border-brand-deep/5" />
        <div className="relative flex flex-col items-center text-center">
          <AlganLogo tone="ink" className="algan-logo-float flex-col gap-2" markClassName="h-28 w-28" wordmarkClassName="h-20 w-[185px]" />
          <p className="mt-2 text-sm font-semibold">{t('loadingTagline')}</p>
          <span className="algan-loader mt-12" role="status"><span className="sr-only">{t('loading')}</span></span>
        </div>
      </main>
    </PhoneShell>
  );
}

export function PhoneShell({ children }: { children: ReactNode }) {
  return (
    <div className="algan-shell pl-[var(--algan-safe-area-left)] pr-[var(--algan-safe-area-right)] text-ink">
      <div className="algan-shell-panel">{children}</div>
    </div>
  );
}

interface OnboardingProps {
  t: Translator;
  locale: Locale;
  setLocale: (locale: Locale) => void;
  phone: string;
  setPhone: (value: string) => void;
  openLegal: (type: LegalDocument) => void;
  onContinue: () => void;
}

export function Onboarding({ t, locale, setLocale, phone, setPhone, openLegal, onContinue }: OnboardingProps) {
  const canContinue = Boolean(normalizeKazakhstanPhone(phone));
  const [phoneTouched, setPhoneTouched] = useState(false);
  const showError = phoneTouched && phone.replace(/\D/g, '').length > 1 && !canContinue;
  return (
    <main className="algan-app-frame bg-canvas">
      <ScrollArea className="flex h-full flex-col">
      <div className="shrink-0 px-page pb-6 pt-[max(1.25rem,var(--algan-safe-area-top))] sm:px-page-wide">
        <div className="flex items-center justify-between"><AlganLogo markClassName="h-10 w-10" wordmarkClassName="h-9 w-[91px]" /><LanguagePill locale={locale} setLocale={setLocale} /></div>
        <div className="relative mt-6 min-h-56 overflow-hidden">
          <p className="algan-eyebrow text-brand">{t('intro')}</p>
          <h1 className="relative z-10 mt-3 text-display">{t('onboardingHeadline')}<br /><span className="text-brand">{t('onboardingAccent')}</span></h1>
          <p className="relative z-10 mt-4 max-w-[64%] text-sm leading-6 text-ink-secondary">{t('onboardingDescription')}</p>
          <img src="/images/algan-good-bag.svg" alt="" aria-hidden="true" width={180} height={220} className="absolute -bottom-4 -right-3 w-[112px] rotate-[8deg] min-[360px]:w-[136px]" />
        </div>
        <ol className="mt-4 grid grid-cols-3 gap-2 border-t border-border pt-4">{(['stepChoose', 'stepPay', 'stepCollect'] as const).map((step, index) => <li key={step} className="flex items-center gap-1.5 text-[10px] font-bold"><span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-brand-deep text-white">{index + 1}</span>{t(step)}</li>)}</ol>
      </div>

      <form className="relative flex flex-1 shrink-0 flex-col rounded-t-sheet border-t border-border bg-surface px-page pb-[max(1.5rem,var(--algan-safe-area-bottom))] pt-6 sm:px-page-wide" onSubmit={(event) => { event.preventDefault(); if (canContinue) onContinue(); }}>
        <ContentTitle>{t('askName')}</ContentTitle>
        <p className="mt-2 text-sm leading-6 text-ink-secondary">{t('nameHelp')}</p>
        <TextField label={t('phone')} required value={phone} onValueChange={(value) => setPhone(formatKazakhstanPhoneInput(value))} placeholder="+7 700 000 00 00" autoComplete="tel" type="tel" inputMode="tel" onBlur={() => setPhoneTouched(true)} aria-invalid={showError} aria-describedby={showError ? 'onboarding-phone-error' : undefined} />
        {showError && <p id="onboarding-phone-error" role="alert" className="mt-2 text-xs font-semibold text-danger">{t('invalidPhone')}</p>}
        <PrimaryButton type="submit" disabled={!canContinue} className="mt-5">{t('continue')}</PrimaryButton>
        <LegalAcceptanceSentence t={t} openLegal={openLegal} className="mt-auto pt-4" />
      </form>
      </ScrollArea>
    </main>
  );
}

function LegalAcceptanceSentence({ t, openLegal, className = '', prefix }: {
  t: Translator;
  openLegal: (type: LegalDocument) => void;
  className?: string;
  prefix?: string;
}) {
  return (
    <p className={`${className} text-center text-xs leading-5 text-ink-muted`}>
      {prefix ?? t('onboardingLegalPrefix')}
      <TextLinkButton onClick={() => openLegal('terms')}>{t('onboardingTermsLink')}</TextLinkButton>
      {t('onboardingLegalAfterTerms')}
      <TextLinkButton onClick={() => openLegal('personalDataConsent')}>{t('onboardingConsentLink')}</TextLinkButton>
      {t('onboardingLegalAfterConsent')}
      <TextLinkButton onClick={() => openLegal('privacy')}>{t('onboardingPrivacyLink')}</TextLinkButton>
      {t('onboardingLegalSuffix')}
    </p>
  );
}

export function LegalAcceptanceScreen({ t, locale, setLocale, openLegal, onAccept }: {
  t: Translator;
  locale: Locale;
  setLocale: (locale: Locale) => void;
  openLegal: (type: LegalDocument) => void;
  onAccept: () => void;
}) {
  return (
    <main className="algan-app-frame flex flex-col overflow-hidden bg-canvas">
      <div className="px-page pb-8 pt-[max(1.5rem,var(--algan-safe-area-top))] sm:px-page-wide">
        <div className="flex items-start justify-between gap-4"><AlganLogo /><LanguagePill locale={locale} setLocale={setLocale} /></div>
        <IconBadge className="mt-10 rotate-[-6deg]" tone="highlight" size="hero"><ShieldCheck size={30} /></IconBadge>
      </div>
      <ScrollArea className="-mt-4 flex flex-1 flex-col rounded-t-sheet bg-surface px-page pb-[max(1.5rem,var(--algan-safe-area-bottom))] pt-8 sm:px-page-wide">
        <PageTitle>{t('legalUpdateTitle')}</PageTitle>
        <p className="mt-3 text-sm leading-6 text-ink-secondary">{t('legalUpdateText')}</p>
        <div className="mt-6 space-y-3">
          <ProfileRow icon={<FileText size={18} />} label={t('termsTitle')} onClick={() => openLegal('terms')} />
          <ProfileRow icon={<FileCheck2 size={18} />} label={t('personalDataConsentTitle')} onClick={() => openLegal('personalDataConsent')} />
          <ProfileRow icon={<ShieldCheck size={18} />} label={t('privacyTitle')} onClick={() => openLegal('privacy')} />
        </div>
        <div className="mt-auto shrink-0 pt-6">
          <PrimaryButton onClick={onAccept}>{t('acceptAndContinue')}</PrimaryButton>
        </div>
      </ScrollArea>
    </main>
  );
}

function LanguagePill({ locale, setLocale, dark = false }: { locale: Locale; setLocale: (locale: Locale) => void; dark?: boolean }) {
  return (
    <PillButton tone={dark ? 'dark' : 'soft'} onClick={() => setLocale(locale === 'ru' ? 'kk' : 'ru')} className="uppercase" aria-label="Русский / Қазақша">
      <Languages size={15} /> {locale === 'ru' ? 'Қаз' : 'Рус'}
    </PillButton>
  );
}
