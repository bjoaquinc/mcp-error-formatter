import { v4 as uuidv4 } from 'uuid';
import {
  ErrorType,
  FormattedError,
  FormatOptions,
  CallToolResult,
} from './types';

export function formatMCPError(
  error: any,
  options: FormatOptions | null = {}
): CallToolResult {
  // Safely handle null/undefined options
  const safeOptions = options || {};

  // Generate request ID
  const requestId = safeOptions.requestId || uuidv4();

  // Normalize error to ensure we have a consistent object
  const normalizedError = normalizeError(error);

  // Auto-detect error type or use provided
  const errorType = safeOptions.errorType || detectErrorType(normalizedError);

  // Build error object exactly like Cursor's format
  const formattedError: FormattedError = {
    error: errorType,
    details: {
      title: safeOptions.title || normalizedError.name || 'Error occurred',
      detail:
        safeOptions.detail ||
        normalizedError.message ||
        'An unexpected error occurred',
      isRetryable: safeOptions.isRetryable ?? isRetryableError(errorType),
      additionalInfo: safeOptions.additionalInfo || {},
    },
    isExpected: safeOptions.isExpected ?? errorType === ErrorType.USER_ABORTED,
  };

  // Build structured content (either user-provided or auto-generated)
  const rawStructuredContent = buildStructuredContent(formattedError, safeOptions);
  const structuredContent = createSafeStructuredContent(rawStructuredContent);

  // Format text exactly like current Cursor style (UNCHANGED)
  const cursorStyleText = formatCursorStyle(
    requestId,
    formattedError,
    normalizedError
  );

  // Return enhanced result with optional structuredContent
  const result: CallToolResult = {
    isError: true,
    content: [
      {
        type: 'text',
        text: cursorStyleText,
      },
    ],
  };

  // Add structuredContent only if it was successfully created
  if (structuredContent) {
    result.structuredContent = structuredContent;
  }

  return result;
}

function buildStructuredContent(
  formattedError: FormattedError,
  options: FormatOptions
): Record<string, unknown> {
  // If user provided explicit structured content, use it
  if (options.structured) {
    return options.structured;
  }

  // Auto-generate structured content from formattedError
  return {
    errorType: formattedError.error,
    title: formattedError.details.title,
    detail: formattedError.details.detail,
    retryable: formattedError.details.isRetryable,
    expected: formattedError.isExpected,
    info: formattedError.details.additionalInfo,
  };
}

function createSafeStructuredContent(
  structuredContent: Record<string, unknown>
): Record<string, unknown> | undefined {
  try {
    // Test if the object can be serialized (detect circular refs)
    JSON.stringify(structuredContent);
    return structuredContent;
  } catch {
    // If structured content has circular refs or other issues,
    // return undefined to fall back to text-only mode
    return undefined;
  }
}

function normalizeError(error: any): {
  name: string;
  message: string;
  stack?: string;
} {
  // Handle null/undefined
  if (error === null || error === undefined) {
    return {
      name: 'Error',
      message: 'Unknown error',
    };
  }

  // Handle strings
  if (typeof error === 'string') {
    return {
      name: 'Error',
      message: error,
    };
  }

  // Handle numbers
  if (typeof error === 'number') {
    return {
      name: 'Error',
      message: error.toString(),
    };
  }

  // Handle booleans
  if (typeof error === 'boolean') {
    return {
      name: 'Error',
      message: error.toString(),
    };
  }

  // Handle Error objects
  if (error instanceof Error) {
    return {
      name: error.name || 'Error',
      message: error.message || 'Unknown error',
      stack: error.stack,
    };
  }

  // Handle objects with message property
  if (typeof error === 'object' && error.message) {
    return {
      name: error.name || 'Error',
      message: String(error.message),
      stack: error.stack,
    };
  }

  // Fallback for any other type
  return {
    name: 'Error',
    message: 'Unknown error occurred',
  };
}

function formatCursorStyle(
  requestId: string,
  formattedError: FormattedError,
  originalError: { name: string; message: string; stack?: string }
): string {
  const parts = [
    `Request ID: ${requestId}`,
    safeJsonStringify(formattedError), // Safe JSON stringify to handle circular refs
    '',
    formatStackTrace(originalError),
  ];

  return parts.join('\n');
}

function safeJsonStringify(obj: any): string {
  try {
    return JSON.stringify(obj, null, 0);
  } catch {
    // Handle circular references by using a replacer
    const seen = new WeakSet();
    return JSON.stringify(
      obj,
      (key, value) => {
        if (typeof value === 'object' && value !== null) {
          if (seen.has(value)) {
            return '[Circular Reference]';
          }
          seen.add(value);
        }
        return value;
      },
      0
    );
  }
}

function formatStackTrace(error: {
  name: string;
  message: string;
  stack?: string;
}): string {
  if (!error.stack) {
    return `${error.name}: ${error.message}`;
  }
  return error.stack;
}

function detectErrorType(error: {
  name: string;
  message: string;
  stack?: string;
}): ErrorType {
  const message = (error.message || '').toLowerCase();
  const name = (error.name || '').toLowerCase();

  // Check timeout patterns first (before abort) since some timeout messages contain "abort"
  if (
    name.includes('timeout') ||
    message.includes('timeout') ||
    message.includes('timed out') ||
    message.includes('etimedout')
  ) {
    return ErrorType.TIMEOUT;
  }
  if (name.includes('abort') || message.includes('abort')) {
    return ErrorType.USER_ABORTED;
  }
  if (
    message.includes('network') ||
    message.includes('fetch') ||
    message.includes('connection') ||
    message.includes('enotfound') ||
    message.includes('econnrefused') ||
    message.includes('status code') ||
    name.includes('axios')
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
