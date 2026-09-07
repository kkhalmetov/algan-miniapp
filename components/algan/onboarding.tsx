import { FileCheck2, FileText, Languages, ShieldCheck } from 'lucide-react';
import type { ReactNode } from 'react';
import { AlganLogo } from '@/components/algan-logo';
import { ProfileRow } from '@/components/algan/profile-row';
import type { LegalDocument, Translator } from '@/components/algan/types';
import { ContentTitle, PageTitle, PillButton, PrimaryButton, ScrollArea, TextField, TextLinkButton } from '@/components/ui-kit';
import { formatKazakhstanPhoneInput, normalizeKazakhstanPhone } from '@/lib/phone';
import type { Locale } from '@/lib/types';

export function Splash({ t }: { t: Translator }) {
  return (
    <main className="relative grid min-h-[var(--algan-viewport-height)] place-items-center overflow-hidden bg-canvas px-page text-brand sm:px-page-wide" aria-label={`Algan — ${t('loading')}`}>
      <div aria-hidden="true" className="absolute -right-18 top-14 h-48 w-48 rounded-full bg-brand-soft/55 blur-[1px]" />
      <div aria-hidden="true" className="absolute -bottom-24 -left-20 h-64 w-64 rounded-full border-[46px] border-accent/12" />
      <div className="relative flex flex-col items-center text-center">
        <AlganLogo className="algan-logo-float flex-col gap-4" markClassName="h-24 w-24" wordmarkClassName="h-10 w-[122px]" />
        <span className="algan-loader mt-8" role="status"><span className="sr-only">{t('loading')}</span></span>
      </div>
    </main>
  );
}

export function PhoneShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-[var(--algan-viewport-height)] bg-canvas pl-[var(--algan-safe-area-left)] pr-[var(--algan-safe-area-right)] text-ink sm:grid sm:place-items-center sm:px-8 sm:py-6">
      <div className="relative mx-auto min-h-[var(--algan-viewport-height)] w-full max-w-[460px] overflow-hidden bg-surface sm:min-h-[780px] sm:rounded-shell sm:shadow-shell">{children}</div>
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
  return (
    <main className="flex min-h-[var(--algan-viewport-height)] flex-col bg-canvas sm:min-h-[780px]">
      <div className="relative overflow-hidden bg-brand px-page pb-10 pt-[max(1.25rem,var(--algan-safe-area-top))] text-white sm:px-page-wide">
        <div className="absolute -right-14 -top-10 h-48 w-48 rounded-full bg-brand-hover" />
        <div className="absolute -bottom-18 -left-10 h-40 w-40 rounded-full border-[32px] border-highlight/25" />
        <div className="relative flex items-start justify-between"><AlganLogo light /><LanguagePill locale={locale} setLocale={setLocale} dark /></div>
        <div className="relative mt-14">
          <p className="inline-flex rounded-full bg-highlight px-3 py-1.5 text-xs font-extrabold text-brand">{t('slogan')}</p>
          <h1 className="mt-4 max-w-[360px] text-display">{t('hero')}</h1>
        </div>
      </div>

      <form className="relative -mt-4 flex flex-1 flex-col rounded-t-sheet bg-surface px-page pb-[max(1.5rem,var(--algan-safe-area-bottom))] pt-8 sm:px-page-wide" onSubmit={(event) => { event.preventDefault(); onContinue(); }}>
        <p className="text-xs font-extrabold uppercase tracking-[.08em] text-accent-strong">{t('intro')}</p>
        <ContentTitle className="mt-2">{t('askName')}</ContentTitle>
        <p className="mt-2 text-sm leading-6 text-ink-secondary">{t('nameHelp')}</p>
        <TextField label={t('phone')} required value={phone} onValueChange={(value) => setPhone(formatKazakhstanPhoneInput(value))} placeholder="+7 700 000 00 00" autoComplete="tel" type="tel" />
        <PrimaryButton type="submit" disabled={!canContinue} className="mt-7">{t('continue')}</PrimaryButton>
        <LegalAcceptanceSentence t={t} openLegal={openLegal} className="mt-auto pt-4" />
      </form>
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
    <main className="flex min-h-[var(--algan-viewport-height)] flex-col overflow-hidden bg-canvas sm:min-h-[780px]">
      <div className="relative overflow-hidden bg-brand px-page pb-8 pt-[max(1.5rem,var(--algan-safe-area-top))] text-white sm:px-page-wide">
        <div aria-hidden="true" className="absolute -right-14 -top-16 h-48 w-48 rounded-full bg-brand-hover" />
        <div aria-hidden="true" className="absolute -bottom-20 -left-12 h-44 w-44 rounded-full border-[34px] border-highlight/20" />
        <div className="relative flex items-start justify-between gap-4"><AlganLogo light /><LanguagePill locale={locale} setLocale={setLocale} dark /></div>
        <div className="relative mt-10 grid h-16 w-16 place-items-center rounded-[20px] bg-highlight text-brand shadow-action"><ShieldCheck size={30} /></div>
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
