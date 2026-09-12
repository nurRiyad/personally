export class AppError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly status: 400 | 401 | 409 | 500,
    public readonly fields?: Record<string, string[]>,
  ) {
    super(message);
  }
}

export class ConflictError extends AppError {
  constructor() {
    super(
      'ACCOUNT_CONFLICT',
      'Unable to create account with those details.',
      409,
    );
  }
}

export class InvalidCredentialsError extends AppError {
  constructor() {
    super('INVALID_CREDENTIALS', 'Invalid credentials.', 401);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Authentication required.') {
    super('UNAUTHORIZED', message, 401);
  }
}
