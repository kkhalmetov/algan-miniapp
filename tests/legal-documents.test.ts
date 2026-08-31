import { describe, expect, it } from 'vitest';
import {
  createLegalAcceptance, getLegalDocument, hasCurrentLegalAcceptance,
  LEGAL_DOCUMENT_VERSION, LEGAL_EFFECTIVE_DATE,
} from '../lib/legal-documents';

describe('legal documents', () => {
  it('publishes complete Russian and Kazakh versions of all three documents', () => {
    for (const locale of ['ru', 'kk'] as const) {
      for (const type of ['terms', 'personalDataConsent', 'privacy'] as const) {
        const document = getLegalDocument(locale, type);
        expect(document.introduction.length).toBeGreaterThanOrEqual(2);
        expect(document.sections.length).toBeGreaterThanOrEqual(8);
        expect(document.sections.every((section) => Boolean(section.heading))).toBe(true);
      }
    }
    expect(LEGAL_DOCUMENT_VERSION).toBe('1.0');
    expect(LEGAL_EFFECTIVE_DATE).toBe('30.08.2026');
  });

  it('requires renewed acceptance after a version or Telegram-account change', () => {
    const acceptance = createLegalAcceptance('ru', 123, new Date('2026-08-30T12:00:00.000Z'));
    expect(hasCurrentLegalAcceptance(acceptance, 123)).toBe(true);
    expect(hasCurrentLegalAcceptance({ ...acceptance, version: '0.9' }, 123)).toBe(false);
    expect(hasCurrentLegalAcceptance(acceptance, 456)).toBe(false);
    expect(hasCurrentLegalAcceptance(undefined, 123)).toBe(false);
  });
});
