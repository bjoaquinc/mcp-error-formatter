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

  describe('structured content', () => {
    test('auto-generates structured content when not provided', () => {
      const error = new Error('Test error');
      const result = formatMCPError(error, {
        title: 'Test Title',
        detail: 'Test Detail',
      });

      expect(result.structuredContent).toBeDefined();
      expect(result.structuredContent.errorType).toBe('ERROR_INTERNAL_ERROR');
      expect(result.structuredContent.title).toBe('Test Title');
      expect(result.structuredContent.detail).toBe('Test Detail');
      expect(result.structuredContent.retryable).toBe(false);
      expect(result.structuredContent.expected).toBe(false);
      expect(result.structuredContent.info).toEqual({});
    });

    test('uses explicit structured content when provided', () => {
      const error = new Error('Test error');
      const customStructured = {
        customField: 'custom value',
        errorCode: 'CUSTOM_ERROR',
      };

      const result = formatMCPError(error, {
        structured: customStructured,
      });

      expect(result.structuredContent).toEqual(customStructured);
    });

    test('preserves text content alongside structured content', () => {
      const error = new Error('Test error');
      const result = formatMCPError(error, {
        title: 'Custom Title',
        structured: { custom: 'data' },
      });

      expect(result.structuredContent).toEqual({ custom: 'data' });
      expect(result.content[0].text).toContain('Custom Title');
      expect(result.content[0].text).toContain('Test error');
    });

    test('falls back gracefully when structured content has circular refs', () => {
      const error = new Error('Test error');
      const circularStructured = { name: 'test' };
      circularStructured.self = circularStructured;

      const result = formatMCPError(error, {
        structured: circularStructured,
      });

      expect(result.structuredContent).toBeUndefined();
      expect(result.content[0].text).toContain('Test error');
    });
  });
});
