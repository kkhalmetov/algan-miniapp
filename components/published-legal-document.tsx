'use client';

import { FileText } from '@/components/icons';
import { InsetSurface } from './ui-kit';
import {
  LEGAL_DOCUMENT_VERSION,
  LEGAL_EFFECTIVE_DATE,
  legalDocumentMeta,
  type PublishedLegalDocument,
} from '@/lib/legal-core';
import { getLegalDocument } from '@/lib/legal-documents';
import type { CopyKey } from '@/lib/translations';
import type { Locale } from '@/lib/types';

const LEGAL_TITLE_KEYS: Record<PublishedLegalDocument, CopyKey> = {
  terms: 'termsTitle',
  personalDataConsent: 'personalDataConsentTitle',
  privacy: 'privacyTitle',
};

export default function PublishedLegalDocumentView({ type, t, locale, subject }: {
  type: PublishedLegalDocument;
  t: (key: CopyKey) => string;
  locale: Locale;
  subject: { fullName: string; telegramId?: number; phone?: string };
}) {
  const document = getLegalDocument(locale, type);
  const meta = legalDocumentMeta[locale];

  return (
    <article className="mt-4 text-sm leading-7 text-ink-secondary" data-legal-document={type}>
      <InsetSurface tone="soft" radius="card" className="p-4">
        <div className="mb-3 flex items-center gap-2 border-b border-brand/10 pb-3 text-brand"><FileText size={18} /><span className="text-xs font-extrabold uppercase tracking-[.06em]">{t(LEGAL_TITLE_KEYS[type])}</span></div>
        <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-xs">
          <dt className="font-black text-ink-muted">{meta.version}</dt><dd className="text-right font-bold text-ink">{LEGAL_DOCUMENT_VERSION}</dd>
          <dt className="font-black text-ink-muted">{meta.effectiveDate}</dt><dd className="text-right font-bold text-ink">{LEGAL_EFFECTIVE_DATE}</dd>
          <dt className="font-black text-ink-muted">{meta.operator}</dt><dd className="text-right font-bold text-ink">{t('companyName')}</dd>
        </dl>
      </InsetSurface>

      {type === 'personalDataConsent' && (
        <InsetSurface tone="panel" className="mt-3 p-4">
          <h3 className="font-black text-brand">{meta.subject}</h3>
          <dl className="mt-3 space-y-2 text-xs">
            <div className="flex items-start justify-between gap-4"><dt className="font-bold text-ink-muted">{meta.fullName}</dt><dd className="text-right font-black text-ink">{subject.fullName}</dd></div>
            <div className="flex items-start justify-between gap-4"><dt className="font-bold text-ink-muted">{meta.telegramId}</dt><dd className="text-right font-black text-ink">{subject.telegramId ?? meta.notProvided}</dd></div>
            <div className="flex items-start justify-between gap-4"><dt className="font-bold text-ink-muted">{meta.phone}</dt><dd className="text-right font-black text-ink">{subject.phone ?? meta.notProvided}</dd></div>
          </dl>
        </InsetSurface>
      )}

      <div className="mt-6 space-y-4 text-ink-secondary">
        {document.introduction.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
      </div>
      <div className="mt-7 space-y-0">
        {document.sections.map((section) => (
          <section key={section.heading} className="border-t border-border py-6 first:border-t-0 first:pt-0">
            <h3 className="text-base font-black leading-6 text-ink">{section.heading}</h3>
            {section.paragraphs && (
              <div className="mt-3 space-y-3">{section.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}</div>
            )}
            {section.items && (
              <ul className="mt-3 list-disc space-y-2 pl-5">{section.items.map((item) => <li key={item}>{item}</li>)}</ul>
            )}
          </section>
        ))}
      </div>
    </article>
  );
}
