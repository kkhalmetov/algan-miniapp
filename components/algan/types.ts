import type { CopyKey } from '@/lib/translations';

export type Translator = (key: CopyKey) => string;

export type LegalDocument = 'terms' | 'personalDataConsent' | 'privacy' | 'orderRules' | 'publicOffer';
export type LegalInformationView = LegalDocument | 'contacts';

export interface LegalSubject {
  fullName: string;
  telegramId?: number;
  phone?: string;
}
