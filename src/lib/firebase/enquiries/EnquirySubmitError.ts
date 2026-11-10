export type EnquirySubmitErrorCode =
  'missing_scope' | 'validation' | 'permission' | 'offline' | 'unknown';

export class EnquirySubmitError extends Error {
  readonly code: EnquirySubmitErrorCode;

  constructor(code: EnquirySubmitErrorCode, message: string) {
    super(message);
    this.name = 'EnquirySubmitError';
    this.code = code;
  }
}
