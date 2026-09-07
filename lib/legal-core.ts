import type { LegalAcceptance, Locale } from './types';

export const LEGAL_DOCUMENT_VERSION = '1.1';
export const LEGAL_EFFECTIVE_DATE = '07.09.2026';

export const createLegalAcceptance = (
  locale: Locale,
  telegramId?: number,
  acceptedAt = new Date(),
): LegalAcceptance => ({
  version: LEGAL_DOCUMENT_VERSION,
  acceptedAt: acceptedAt.toISOString(),
  locale,
  telegramId,
  method: 'continue_button',
});

export const hasCurrentLegalAcceptance = (acceptance?: LegalAcceptance, telegramId?: number) =>
  acceptance?.version === LEGAL_DOCUMENT_VERSION
  && (!telegramId || acceptance.telegramId === telegramId);

export type PublishedLegalDocument = 'terms' | 'personalDataConsent' | 'privacy';

export interface LegalSection {
  heading: string;
  paragraphs?: string[];
  items?: string[];
}

export interface LegalDocumentContent {
  introduction: string[];
  sections: LegalSection[];
}

export const legalDocumentMeta: Record<Locale, {
  version: string;
  effectiveDate: string;
  operator: string;
  subject: string;
  fullName: string;
  telegramId: string;
  phone: string;
  notProvided: string;
}> = {
  ru: {
    version: 'Версия',
    effectiveDate: 'Дата вступления в силу',
    operator: 'Оператор',
    subject: 'Субъект персональных данных',
    fullName: 'Имя и фамилия',
    telegramId: 'Telegram ID',
    phone: 'Телефон',
    notProvided: 'Не указан',
  },
  kk: {
    version: 'Нұсқа',
    effectiveDate: 'Күшіне енген күні',
    operator: 'Оператор',
    subject: 'Дербес деректер субъектісі',
    fullName: 'Аты және тегі',
    telegramId: 'Telegram ID',
    phone: 'Телефон',
    notProvided: 'Көрсетілмеген',
  },
};

export const isPublishedLegalDocument = (type: string): type is PublishedLegalDocument =>
  type === 'terms' || type === 'personalDataConsent' || type === 'privacy';
