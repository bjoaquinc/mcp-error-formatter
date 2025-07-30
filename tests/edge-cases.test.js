const { formatMCPError, createUserAbortedError, createTimeoutError, createNetworkError, ErrorType } = require('../dist');

describe('MCP Error Formatter - Edge Cases', () => {
  
  describe('Null and undefined handling', () => {
    test('handles null error', () => {
      const result = formatMCPError(null);
      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('ERROR_INTERNAL_ERROR');
      expect(result.content[0].text).toContain('Unknown error');
    });

    test('handles undefined error', () => {
      const result = formatMCPError(undefined);
      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('ERROR_INTERNAL_ERROR');
    });

    test('handles error with null message', () => {
      const error = new Error();
      error.message = null;
      const result = formatMCPError(error);
      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('ERROR_INTERNAL_ERROR');
    });
  });

  describe('String and primitive handling', () => {
    test('handles string as error', () => {
      const result = formatMCPError('Simple string error');
      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('Simple string error');
    });

    test('handles number as error', () => {
      const result = formatMCPError(404);
      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('404');
    });

    test('handles boolean as error', () => {
      const result = formatMCPError(false);
      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('false');
    });
  });

  describe('Complex error objects', () => {
    test('handles error with circular reference', () => {
      const error = new Error('Circular error');
      error.self = error; // Create circular reference
      
      const result = formatMCPError(error);
      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('Circular error');
      // Should not crash due to circular reference
    });

    test('handles error with very long message', () => {
      const longMessage = 'A'.repeat(10000);
      const error = new Error(longMessage);
      
      const result = formatMCPError(error);
      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('ERROR_INTERNAL_ERROR');
    });

    test('handles error with special characters', () => {
      const error = new Error('Error with émojis 🚀💥 and spëcial çharacters');
      const result = formatMCPError(error);
      
      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('émojis 🚀💥');
      expect(result.content[0].text).toContain('spëcial çharacters');
    });

    test('handles error with newlines and tabs', () => {
      const error = new Error('Error with\nnewlines\tand\ttabs');
      const result = formatMCPError(error);
      
      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('newlines');
    });
  });

  describe('Error type auto-detection edge cases', () => {
    test('detects network errors with various messages', () => {
      const networkErrors = [
        'ENOTFOUND google.com',
        'connect ECONNREFUSED 127.0.0.1:3000',
        'Request failed with status code 500',
        'Network request failed',
        'fetch failed'
      ];

      networkErrors.forEach(message => {
        const error = new Error(message);
        const result = formatMCPError(error);
        expect(result.content[0].text).toContain('ERROR_NETWORK_ERROR');
      });
    });

    test('detects timeout errors with various patterns', () => {
      const timeoutErrors = [
        'timeout of 5000ms exceeded',
        'Request timeout after 30s',
        'Operation timed out',
        'ETIMEDOUT',
        'The operation was aborted due to timeout'
      ];

      timeoutErrors.forEach(message => {
        const error = new Error(message);
        const result = formatMCPError(error);
        expect(result.content[0].text).toContain('ERROR_TIMEOUT');
      });
    });

    test('detects user abort errors', () => {
      const abortErrors = [
        'The operation was aborted',
        'User aborted request',
        'Request cancelled by user'
      ];

      abortErrors.forEach(message => {
        const error = new Error(message);
        error.name = 'AbortError';
        const result = formatMCPError(error);
        expect(result.content[0].text).toContain('ERROR_USER_ABORTED_REQUEST');
      });
    });
  });

  describe('Options edge cases', () => {
    test('handles null options', () => {
      const error = new Error('Test error');
      const result = formatMCPError(error, null);
      expect(result.isError).toBe(true);
    });

    test('handles empty options object', () => {
      const error = new Error('Test error');
      const result = formatMCPError(error, {});
      expect(result.isError).toBe(true);
    });

    test('handles options with null values', () => {
      const error = new Error('Test error');
      const result = formatMCPError(error, {
        title: null,
        detail: null,
        requestId: null,
        errorType: null,
        isRetryable: null,
        isExpected: null,
        additionalInfo: null
      });
      expect(result.isError).toBe(true);
    });

    test('handles very large additionalInfo', () => {
      const error = new Error('Test error');
      const largeInfo = {};
      for (let i = 0; i < 1000; i++) {
        largeInfo[`key${i}`] = `value${i}`.repeat(100);
      }
      
      const result = formatMCPError(error, {
        additionalInfo: largeInfo
      });
      expect(result.isError).toBe(true);
      // Should handle large objects gracefully
    });

    test('handles circular references in additionalInfo', () => {
      const error = new Error('Test error');
      const circularInfo = { name: 'test' };
      circularInfo.self = circularInfo;
      
      const result = formatMCPError(error, {
        additionalInfo: circularInfo
      });
      expect(result.isError).toBe(true);
      // Should not crash
    });

    test('handles invalid errorType', () => {
      const error = new Error('Test error');
      const result = formatMCPError(error, {
        errorType: 'INVALID_ERROR_TYPE'
      });
      expect(result.isError).toBe(true);
    });
  });

  describe('Helper function edge cases', () => {
    test('createUserAbortedError with null requestId', () => {
      const result = createUserAbortedError(null);
      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('ERROR_USER_ABORTED_REQUEST');
    });

    test('createTimeoutError with invalid timeout', () => {
      const error = new Error('Timeout');
      const result = createTimeoutError(null, 'test-id');
      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('ERROR_TIMEOUT');
    });

    test('createNetworkError with null error', () => {
      const result = createNetworkError(null, 'test-id');
      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('ERROR_NETWORK_ERROR');
    });
  });

  describe('Real-world error scenarios', () => {
    test('handles Axios error structure', () => {
      const axiosError = {
        name: 'AxiosError',
        message: 'Request failed with status code 404',
        response: {
          status: 404,
          statusText: 'Not Found',
          data: { error: 'Resource not found' }
        },
        config: { url: 'https://api.example.com/users/123' }
      };
      
      const result = formatMCPError(axiosError, {
        additionalInfo: {
          status: axiosError.response?.status,
          url: axiosError.config?.url
        }
      });
      
      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('ERROR_NETWORK_ERROR');
    });

    test('handles Node.js filesystem error', () => {
      const fsError = {
        name: 'Error',
        message: "ENOENT: no such file or directory, open '/nonexistent/file.txt'",
        code: 'ENOENT',
        errno: -2,
        syscall: 'open',
        path: '/nonexistent/file.txt'
      };
      
      const result = formatMCPError(fsError, {
        additionalInfo: {
          code: fsError.code,
          path: fsError.path
        }
      });
      
      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('ERROR_INTERNAL_ERROR');
    });

    test('handles JSON parse error', () => {
      let jsonError;
      try {
        JSON.parse('invalid json{');
      } catch (e) {
        jsonError = e;
      }
      
      const result = formatMCPError(jsonError, {
        title: 'JSON Parsing Failed',
        errorType: ErrorType.INVALID_INPUT
      });
      
      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('ERROR_INVALID_INPUT');
    });
  });

  describe('Output format validation', () => {
    test('always returns correct MCP structure', () => {
      const testCases = [
        new Error('Normal error'),
        null,
        undefined,
        'String error',
        { message: 'Object error' },
        42
      ];

      testCases.forEach(testCase => {
        const result = formatMCPError(testCase);
        
        // Check MCP structure
        expect(result).toHaveProperty('isError', true);
        expect(result).toHaveProperty('content');
        expect(Array.isArray(result.content)).toBe(true);
        expect(result.content).toHaveLength(1);
        expect(result.content[0]).toHaveProperty('type', 'text');
        expect(result.content[0]).toHaveProperty('text');
        expect(typeof result.content[0].text).toBe('string');
        
        // Check output format
        const text = result.content[0].text;
        expect(text).toMatch(/Request ID: [0-9a-f-]{36}/); // UUID pattern
        expect(text).toContain('{"error":"ERROR_');
        expect(text).toContain('Error:');
      });
    });

    test('JSON in output is valid', () => {
      const error = new Error('Test error');
      const result = formatMCPError(error, {
        additionalInfo: { test: 'value' }
      });
      
      const text = result.content[0].text;
      const lines = text.split('\n');
      const jsonLine = lines.find(line => line.startsWith('{"error":'));
      
      expect(() => JSON.parse(jsonLine)).not.toThrow();
    });
  });
}); 