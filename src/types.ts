export enum ErrorType {
  USER_ABORTED = 'ERROR_USER_ABORTED_REQUEST',
  TIMEOUT = 'ERROR_TIMEOUT',
  NETWORK_ERROR = 'ERROR_NETWORK_ERROR',
  INTERNAL_ERROR = 'ERROR_INTERNAL_ERROR',
  INVALID_INPUT = 'ERROR_INVALID_INPUT',
}

export interface ErrorDetails {
  title: string;
  detail: string;
  isRetryable: boolean;
  additionalInfo: Record<string, any>;
}

export interface FormattedError {
  error: ErrorType;
  details: ErrorDetails;
  isExpected: boolean;
}

export interface FormatOptions {
  title?: string;
  detail?: string;
  requestId?: string;
  errorType?: ErrorType;
  isRetryable?: boolean;
  isExpected?: boolean;
  additionalInfo?: Record<string, any>;
  structured?: Record<string, unknown>;
}

export interface CallToolResult {
  isError: true;
  content: Array<{ type: 'text'; text: string }>;
  structuredContent?: Record<string, unknown>;
}
