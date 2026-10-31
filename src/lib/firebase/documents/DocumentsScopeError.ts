/** Thrown when Documents fetches run without adminId / clientId. */
export class DocumentsScopeError extends Error {
  readonly code = 'missing_scope';

  constructor() {
    super('Missing adminId or clientId');
    this.name = 'DocumentsScopeError';
  }
}
