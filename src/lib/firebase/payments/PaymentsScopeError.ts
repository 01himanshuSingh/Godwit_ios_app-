/** Thrown when Payments fetches run without adminId / clientId. */
export class PaymentsScopeError extends Error {
  readonly code = 'missing_scope';

  constructor() {
    super('Missing adminId or clientId');
    this.name = 'PaymentsScopeError';
  }
}
