# Simple MCP Error Formatter - Minimal Implementation Plan

## Project Goal
Create a single utility function that formats MCP tool errors exactly like Cursor's output format.

**Input**: JavaScript Error + optional metadata  
**Output**: MCP `CallToolResult` with Cursor-style formatted text

## Project Structure (Minimal)
```
mcp-error-formatter/
├── src/
│   ├── index.ts           # Main export
│   ├── types.ts           # Simple types
│   └── formatter.ts       # Core function
├── examples/
│   └── basic.js           # Simple usage example
├── tests/
│   └── formatter.test.js  # Basic tests
├── package.json
├── tsconfig.json
├── README.md
└── .gitignore
```

## Core Implementation

### 1. Types (`src/types.ts`)
```typescript
export enum ErrorType {
  USER_ABORTED = "ERROR_USER_ABORTED_REQUEST",
  TIMEOUT = "ERROR_TIMEOUT", 
  NETWORK_ERROR = "ERROR_NETWORK_ERROR",
  INTERNAL_ERROR = "ERROR_INTERNAL_ERROR",
  INVALID_INPUT = "ERROR_INVALID_INPUT"
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
}

export interface CallToolResult {
  isError: true;
  content: Array<{ type: "text"; text: string }>;
}
```

### 2. Main Formatter (`src/formatter.ts`)
```typescript
import { v4 as uuidv4 } from 'uuid';
import { ErrorType, FormattedError, FormatOptions, CallToolResult } from './types';

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
      title: options.title || error.name || "Error occurred",
      detail: options.detail || error.message || "An unexpected error occurred",
      isRetryable: options.isRetryable ?? isRetryableError(errorType),
      additionalInfo: options.additionalInfo || {}
    },
    isExpected: options.isExpected ?? (errorType === ErrorType.USER_ABORTED)
  };

  // Format exactly like Cursor
  const cursorStyleText = formatCursorStyle(requestId, formattedError, error);

  return {
    isError: true,
    content: [
      {
        type: "text",
        text: cursorStyleText
      }
    ]
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
    formatStackTrace(originalError)
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
  if (message.includes('network') || message.includes('fetch') || message.includes('connection')) {
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
```

### 3. Main Export (`src/index.ts`)
```typescript
export { formatMCPError } from './formatter';
export { ErrorType } from './types';
export type { FormatOptions, CallToolResult } from './types';

// Convenience functions for common errors
export const createUserAbortedError = (requestId?: string) => 
  formatMCPError(new Error('User aborted request'), { 
    errorType: ErrorType.USER_ABORTED,
    title: "User aborted request.",
    detail: "Tool call ended before result was received",
    requestId 
  });

export const createTimeoutError = (timeoutMs: number, requestId?: string) =>
  formatMCPError(new Error(`Operation timed out after ${timeoutMs}ms`), {
    errorType: ErrorType.TIMEOUT,
    title: `Request timed out after ${timeoutMs}ms`,
    detail: "The operation took too long to complete",
    requestId
  });

export const createNetworkError = (originalError: Error, requestId?: string) =>
  formatMCPError(originalError, {
    errorType: ErrorType.NETWORK_ERROR,
    title: "Network connection failed",
    detail: `Failed to establish connection: ${originalError.message}`,
    requestId
  });
```

## Usage Examples

### Basic Usage (`examples/basic.js`)
```javascript
import { formatMCPError, createUserAbortedError } from 'mcp-error-formatter';

// Example MCP tool handler
export async function githubTool({ repo, action }) {
  try {
    const result = await github.api.call(repo, action);
    return {
      content: [{ type: "text", text: JSON.stringify(result) }]
    };
  } catch (error) {
    // Simple error formatting
    return formatMCPError(error, {
      title: "GitHub API Error",
      detail: `Failed to ${action} on ${repo}`
    });
  }
}

// Specific error types
export async function longRunningTool() {
  try {
    const result = await someSlowOperation();
    return { content: [{ type: "text", text: result }] };
  } catch (error) {
    if (error.name === 'AbortError') {
      return createUserAbortedError();
    }
    return formatMCPError(error);
  }
}
```

## Package Configuration

### package.json (Minimal)
```json
{
  "name": "mcp-error-formatter",
  "version": "1.0.0",
  "description": "Simple utility to format MCP tool errors like Cursor",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "files": ["dist"],
  "scripts": {
    "build": "tsc",
    "test": "jest",
    "prepublishOnly": "npm run build"
  },
  "keywords": ["mcp", "error", "cursor", "anthropic", "llm"],
  "author": "Your Name",
  "license": "MIT",
  "dependencies": {
    "uuid": "^10.0.0"
  },
  "devDependencies": {
    "@types/uuid": "^10.0.0",
    "@types/jest": "^29.5.0",
    "jest": "^29.5.0",
    "typescript": "^5.0.0"
  }
}
```

### tsconfig.json
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "declaration": true,
    "sourceMap": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "tests"]
}
```

## Testing

### Basic Test (`tests/formatter.test.js`)
```javascript
import { formatMCPError, createUserAbortedError, ErrorType } from '../src';

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
```

## README.md (Simple)
```markdown
# MCP Error Formatter

Format MCP tool errors exactly like Cursor's style for better LLM understanding.

## Installation
```bash
npm install mcp-error-formatter
```

## Usage
```javascript
import { formatMCPError } from 'mcp-error-formatter';

// In your MCP tool
export async function myTool(args) {
  try {
    const result = await someOperation();
    return { content: [{ type: "text", text: result }] };
  } catch (error) {
    return formatMCPError(error, {
      title: "Operation failed",
      detail: "Something went wrong"
    });
  }
}
```

## Output Format
Creates Cursor-style error output:
```
Request ID: c90ead25-5c07-4f28-a972-baa17ddb6eaa
{"error":"ERROR_NETWORK_ERROR","details":{"title":"GitHub API Error","detail":"Failed to fetch repository","isRetryable":true,"additionalInfo":{}},"isExpected":false}
Error: Failed to fetch repository
    at githubTool (/path/to/file.js:10:15)
    ...
```

## API
- `formatMCPError(error, options?)` - Main formatting function
- `createUserAbortedError(requestId?)` - User cancellation
- `createTimeoutError(timeoutMs, requestId?)` - Timeout errors  
- `createNetworkError(error, requestId?)` - Network failures
```

## Implementation Steps

### Week 1: Build & Test
1. [ ] Create TypeScript project structure
2. [ ] Implement core `formatMCPError` function
3. [ ] Add error type detection logic
4. [ ] Write basic tests
5. [ ] Create simple example

### Week 2: Polish & Publish
1. [ ] Verify output matches Cursor exactly
2. [ ] Add convenience functions
3. [ ] Write documentation
4. [ ] Publish to npm
5. [ ] Test with real MCP servers

## Success Criteria
- **Exact match** with Cursor's error format
- **Zero dependencies** except uuid
- **Sub-10ms** formatting performance
- **100+ downloads** in first month

---

**For AI Implementation:** Build exactly this scope - nothing more, nothing less. Focus on replicating Cursor's output format perfectly. The entire package is essentially one function that takes an Error and returns a formatted CallToolResult.