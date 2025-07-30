const {
  formatMCPError,
  createUserAbortedError,
  ErrorType,
} = require('../dist');

describe('formatMCPError', () => {
  test('formats basic error correctly', () => {
    const error = new Error('Test error message');
    const result = formatMCPError(error);

    expect(result.isError).toBe(true);
    expect(result.content[0].type).toBe('text');
    expect(result.content[0].text).toContain('Request ID:');
    expect(result.content[0].text).toContain('ERROR_INTERNAL_ERROR');
    expect(result.content[0].text).toContain('Test error message');
  });

  test('creates user aborted error like Cursor', () => {
    const result = createUserAbortedError('test-id-123');
    const text = result.content[0].text;

    expect(text).toContain('Request ID: test-id-123');
    expect(text).toContain('ERROR_USER_ABORTED_REQUEST');
    expect(text).toContain('"isExpected":true');
    expect(text).toContain('"isRetryable":false');
  });

  test('auto-detects timeout errors', () => {
    const error = new Error('Request timeout after 5000ms');
    const result = formatMCPError(error);

    expect(result.content[0].text).toContain('ERROR_TIMEOUT');
  });
});
