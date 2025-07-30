import { formatMCPError } from './formatter';
import { ErrorType, CallToolResult } from './types';

export { formatMCPError } from './formatter';
export { ErrorType } from './types';
export type { FormatOptions, CallToolResult } from './types';

// Convenience functions for common errors
export const createUserAbortedError = (requestId?: string): CallToolResult =>
  formatMCPError(new Error('User aborted request'), {
    errorType: ErrorType.USER_ABORTED,
    title: 'User aborted request.',
    detail: 'Tool call ended before result was received',
    requestId,
  });

export const createTimeoutError = (
  timeoutMs: number,
  requestId?: string
): CallToolResult =>
  formatMCPError(new Error(`Operation timed out after ${timeoutMs}ms`), {
    errorType: ErrorType.TIMEOUT,
    title: `Request timed out after ${timeoutMs}ms`,
    detail: 'The operation took too long to complete',
    requestId,
  });

export const createNetworkError = (
  originalError: Error,
  requestId?: string
): CallToolResult =>
  formatMCPError(originalError, {
    errorType: ErrorType.NETWORK_ERROR,
    title: 'Network connection failed',
    detail: `Failed to establish connection: ${originalError.message}`,
    requestId,
  });
