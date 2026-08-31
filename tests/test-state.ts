import { LEGAL_DOCUMENT_VERSION } from '../lib/legal-documents';
import type { LegalAcceptance } from '../lib/types';

export const acceptedLegalDocuments: LegalAcceptance = {
  version: LEGAL_DOCUMENT_VERSION,
  acceptedAt: '2026-08-30T00:00:00.000Z',
  locale: 'ru',
  telegramId: 123456,
  method: 'continue_button',
};
