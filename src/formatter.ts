import { v4 as uuidv4 } from 'uuid';
import {
  ErrorType,
  FormattedError,
  FormatOptions,
  CallToolResult,
} from './types';

export function formatMCPError(
  error: Error,
  options: FormatOptions = {}
): CallToolResult {
  // Generate request ID
  const requestId = options.requestId || uuidv4();

  // Auto-detect error type or use provided
  const errorType = options.errorType || detectErrorType(error);

  // Build error object exactly like Cursor's format
  const formattedError: FormattedError = {
    error: errorType,
    details: {
      title: options.title || error.name || 'Error occurred',
      detail: options.detail || error.message || 'An unexpected error occurred',
      isRetryable: options.isRetryable ?? isRetryableError(errorType),
      additionalInfo: options.additionalInfo || {},
    },
    isExpected: options.isExpected ?? errorType === ErrorType.USER_ABORTED,
  };

  // Format exactly like Cursor
  const cursorStyleText = formatCursorStyle(requestId, formattedError, error);

  return {
    isError: true,
    content: [
      {
        type: 'text',
        text: cursorStyleText,
      },
    ],
  };
}

function formatCursorStyle(
  requestId: string,
  formattedError: FormattedError,
  originalError: Error
): string {
  const parts = [
    `Request ID: ${requestId}`,
    JSON.stringify(formattedError, null, 0), // No indentation like Cursor
    '',
    formatStackTrace(originalError),
  ];

  return parts.join('\n');
}

function formatStackTrace(error: Error): string {
  if (!error.stack) {
    return `${error.name}: ${error.message}`;
  }
  return error.stack;
}

function detectErrorType(error: Error): ErrorType {
  const message = error.message.toLowerCase();
  const name = error.name.toLowerCase();

  if (name.includes('abort') || message.includes('abort')) {
    return ErrorType.USER_ABORTED;
  }
  if (name.includes('timeout') || message.includes('timeout')) {
    return ErrorType.TIMEOUT;
  }
  if (
    message.includes('network') ||
    message.includes('fetch') ||
    message.includes('connection')
  ) {
    return ErrorType.NETWORK_ERROR;
  }
  if (message.includes('invalid') || message.includes('validation')) {
    return ErrorType.INVALID_INPUT;
  }

  return ErrorType.INTERNAL_ERROR;
}

function isRetryableError(errorType: ErrorType): boolean {
  return [ErrorType.TIMEOUT, ErrorType.NETWORK_ERROR].includes(errorType);
}
