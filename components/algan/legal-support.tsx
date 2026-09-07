'use client';

import { ArrowUpRight, Building2, CircleHelp, FileCheck2, FileText, Headphones, Info, Mail, Phone, ReceiptText, ShieldCheck, ShoppingBag } from 'lucide-react';
import { lazy, type ReactNode, Suspense, useState } from 'react';
import { AlganLogo } from '@/components/algan-logo';
import { ProfileRow } from '@/components/algan/profile-row';
import type { LegalDocument, LegalInformationView, LegalSubject, Translator } from '@/components/algan/types';
import { AccordionItem, DialogLayer, InsetSurface, LinkRow, ModalBody, NoticeCard, PrimaryButton, ScrollArea, SectionTitle, SheetHeader } from '@/components/ui-kit';
import { isPublishedLegalDocument } from '@/lib/legal-core';
import { openTelegramLink } from '@/lib/telegram';
import type { CopyKey } from '@/lib/translations';
import type { Locale } from '@/lib/types';

const SUPPORT_TELEGRAM_URL = 'https://t.me/kkhalmetov';
const LEGAL_TITLE_KEYS: Record<LegalDocument, CopyKey> = {
  terms: 'termsTitle',
  personalDataConsent: 'personalDataConsentTitle',
  privacy: 'privacyTitle',
  orderRules: 'orderRulesTitle',
  publicOffer: 'publicOfferTitle',
};
const LazyPublishedLegalDocument = lazy(() => import('@/components/published-legal-document'));

export function DocumentsModal({ t, locale, subject, onClose }: { t: Translator; locale: Locale; subject: LegalSubject; onClose: () => void }) {
  const [selectedView, setSelectedView] = useState<LegalInformationView | null>(null);
  const documents: { type: LegalDocument; icon: ReactNode }[] = [
    { type: 'terms', icon: <FileText size={18} /> },
    { type: 'personalDataConsent', icon: <FileCheck2 size={18} /> },
    { type: 'privacy', icon: <ShieldCheck size={18} /> },
    { type: 'orderRules', icon: <ShoppingBag size={18} /> },
    { type: 'publicOffer', icon: <ReceiptText size={18} /> },
  ];
  const title = selectedView === 'contacts' ? t('contacts') : selectedView ? t(LEGAL_TITLE_KEYS[selectedView]) : t('legal');

  return (
    <DialogLayer onClose={onClose} closeLabel={t('close')} ariaLabel={t('legal')} sheetHeight="tall">
      <ModalBody className="flex h-full min-h-0 flex-col overflow-hidden">
        <SheetHeader data-testid="documents-modal-header" className="pb-3" title={title} onBack={selectedView ? () => setSelectedView(null) : undefined} backLabel={t('back')} onClose={onClose} closeLabel={t('close')} focusTitleOnChange />
        <ScrollArea data-testid="documents-modal-scroll" className="flex-1 pb-4">
          {selectedView === 'contacts' ? (
            <CompanyContacts t={t} />
          ) : selectedView ? (
            <LegalDocumentView type={selectedView} t={t} locale={locale} subject={subject} />
          ) : (
            <>
              <SectionTitle as="h3" className="mt-4 text-base">{t('agreements')}</SectionTitle>
              <div className="mt-3 space-y-2">
                {documents.map((document) => (
                  <ProfileRow density="compact" key={document.type} icon={document.icon} label={t(LEGAL_TITLE_KEYS[document.type])} onClick={() => setSelectedView(document.type)} />
                ))}
              </div>
              <SectionTitle as="h3" className="mt-4 text-base">{t('companyInformation')}</SectionTitle>
              <div className="mb-1 mt-2"><ProfileRow density="compact" icon={<Building2 size={18} />} label={t('contacts')} onClick={() => setSelectedView('contacts')} /></div>
            </>
          )}
        </ScrollArea>
      </ModalBody>
    </DialogLayer>
  );
}

function CompanyContacts({ t }: { t: Translator }) {
  return (
    <div className="mt-4 space-y-3">
      <InsetSurface tone="brandSolid" radius="card" className="relative overflow-hidden p-5 text-sm">
        <div aria-hidden="true" className="absolute -right-8 -top-10 h-28 w-28 rounded-full bg-brand-hover" />
        <div className="relative"><AlganLogo light markClassName="h-8 w-8" wordmarkClassName="h-6 w-[73px]" /><SectionTitle as="h3" tone="inverse" className="mt-5">{t('companyName')}</SectionTitle><p className="mt-1 font-bold text-white/70">{t('companyId')}</p></div>
      </InsetSurface>
      <InsetSurface tone="panel" radius="card" className="p-4"><p className="text-xs font-black uppercase tracking-[.06em] text-ink-muted">{t('contactLegalAddressLabel')}</p><p className="mt-2 text-sm leading-6 text-ink">{t('companyAddress')}</p></InsetSurface>
      <LinkRow tone="panel" href="mailto:algansupport@gmail.com" icon={<Mail size={18} />} title={t('emailLabel')} subtitle="algansupport@gmail.com" trailing={<ArrowUpRight size={17} className="text-ink-subtle" />} />
      <LinkRow tone="panel" href="tel:+77059768000" icon={<Phone size={18} />} title={t('contactPhoneLabel')} subtitle="+7 705 976 80 00" trailing={<ArrowUpRight size={17} className="text-ink-subtle" />} />
    </div>
  );
}

export function HelpModal({ t, onClose }: { t: Translator; onClose: () => void }) {
  const [view, setView] = useState<'menu' | 'faq'>('menu');
  const [openQuestion, setOpenQuestion] = useState<number | null>(null);
  const faqItems: { question: CopyKey; answer: CopyKey }[] = [
    { question: 'faqBuyQuestion', answer: 'faqBuyAnswer' },
    { question: 'faqPickupQuestion', answer: 'faqPickupAnswer' },
    { question: 'faqContentsQuestion', answer: 'faqContentsAnswer' },
    { question: 'faqOrdersQuestion', answer: 'faqOrdersAnswer' },
    { question: 'faqProblemQuestion', answer: 'faqProblemAnswer' },
  ];
  const title = view === 'faq' ? t('faq') : t('support');

  return (
    <DialogLayer onClose={onClose} closeLabel={t('close')} ariaLabel={t('support')} sheetHeight="tall">
      <ModalBody className="flex h-full min-h-0 flex-col overflow-hidden">
        <SheetHeader className="pb-3" title={title} onBack={view !== 'menu' ? () => setView('menu') : undefined} backLabel={t('back')} onClose={onClose} closeLabel={t('close')} focusTitleOnChange />
        <ScrollArea className="flex-1 pb-1">
          {view === 'menu' && (
            <>
              <InsetSurface tone="brandSolid" radius="card" className="relative mt-3 overflow-hidden p-5 text-white">
                <div aria-hidden="true" className="absolute -right-8 -top-12 h-32 w-32 rounded-full bg-brand-hover" />
                <span className="relative grid h-12 w-12 place-items-center rounded-[16px] bg-highlight text-brand"><Headphones size={23} /></span>
                <p className="relative mt-5 text-xl font-extrabold tracking-[-0.025em] text-white">{t('support')}</p>
                <p className="relative mt-2 text-sm leading-6 text-white/75">{t('supportIntro')}</p>
                <PrimaryButton aria-label={`${t('contactSupport')}. ${t('workingHours')}`} onClick={() => openTelegramLink(SUPPORT_TELEGRAM_URL)} className="relative mt-5" tone="highlight">
                  <TelegramIcon /><span>{t('contactSupport')}</span>
                </PrimaryButton>
                <p className="relative mt-3 text-center text-xs font-bold text-white/70">{t('workingHours')}</p>
              </InsetSurface>
              <div className="mt-4"><ProfileRow icon={<CircleHelp size={18} />} label={t('faq')} onClick={() => setView('faq')} /></div>
            </>
          )}
          {view === 'faq' && (
            <div className="mt-3"><div className="space-y-3">
              {faqItems.map((item, index) => {
                const expanded = openQuestion === index;
                return (
                  <AccordionItem key={item.question} title={<span className="flex items-start gap-3"><span aria-hidden="true" className="grid h-6 w-6 shrink-0 place-items-center rounded-[8px] bg-brand-pale text-[11px] font-black text-brand">{index + 1}</span><span>{t(item.question)}</span></span>} expanded={expanded} onToggle={() => setOpenQuestion(expanded ? null : index)}>
                    {t(item.answer)}
                  </AccordionItem>
                );
              })}
            </div></div>
          )}
        </ScrollArea>
      </ModalBody>
    </DialogLayer>
  );
}

function TelegramIcon() {
  return (
    <svg viewBox="0 0 24 24" width="19" height="19" aria-hidden="true" fill="currentColor">
      <path d="M21.7 3.4a1.2 1.2 0 0 0-1.25-.17L2.9 10.18c-1.2.48-1.18 1.17-.22 1.46l4.5 1.4 1.73 5.24c.22.62.11.87.76.87.5 0 .72-.23 1-.5l2.16-2.1 4.5 3.32c.83.46 1.43.22 1.64-.77l3-14.14c.31-1.23-.47-1.8-.27-1.56ZM8.36 12.72l9.8-6.18c.49-.3.94-.14.57.2l-8.1 7.3-.32 3.4-1.95-4.72Z" />
    </svg>
  );
}

function LegalDocumentNotice({ t }: { t: Translator }) {
  return <NoticeCard className="mt-5" tone="warning" icon={<Info size={20} />}>{t('placeholderLegal')}</NoticeCard>;
}

function LegalDocumentView({ type, t, locale, subject }: { type: LegalDocument; t: Translator; locale: Locale; subject: LegalSubject }) {
  if (!isPublishedLegalDocument(type)) return <LegalDocumentNotice t={t} />;
  return (
    <Suspense fallback={<p role="status" className="mt-6 text-center text-sm font-bold text-ink-muted">{t('loading')}</p>}>
      <LazyPublishedLegalDocument type={type} t={t} locale={locale} subject={subject} />
    </Suspense>
  );
}

export function LegalModal({ type, t, locale, subject, onClose }: { type: LegalDocument; t: Translator; locale: Locale; subject: LegalSubject; onClose: () => void }) {
  return (
    <DialogLayer onClose={onClose} closeLabel={t('close')} ariaLabel={t(LEGAL_TITLE_KEYS[type])} sheetHeight="tall">
      <ModalBody className="flex h-full min-h-0 flex-col overflow-hidden">
        <SheetHeader data-testid="legal-modal-header" className="pb-3" title={t(LEGAL_TITLE_KEYS[type])} onClose={onClose} closeLabel={t('close')} />
        <ScrollArea data-testid="legal-modal-scroll" className="flex-1 pb-4">
          <LegalDocumentView type={type} t={t} locale={locale} subject={subject} />
          {!isPublishedLegalDocument(type) && <PrimaryButton onClick={onClose} className="mt-5">{t('back')}</PrimaryButton>}
        </ScrollArea>
      </ModalBody>
    </DialogLayer>
  );
}
