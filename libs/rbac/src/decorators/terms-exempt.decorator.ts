import { SetMetadata } from '@nestjs/common';

export const TERMS_EXEMPT_KEY = 'termsExempt';
export const TermsExempt = () => SetMetadata(TERMS_EXEMPT_KEY, true);
