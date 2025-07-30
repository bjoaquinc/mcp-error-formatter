# MCP Error Formatter

Format MCP tool errors exactly like Cursor's style for better LLM understanding.

## Installation
```bash
npm install mcp-error-formatter
```

## Usage

### Basic Usage
```javascript
import { formatMCPError } from 'mcp-error-formatter';

// Simple error formatting
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

### Advanced Usage with Options
```javascript
import { formatMCPError, ErrorType } from 'mcp-error-formatter';

// Network error with retry logic
export async function githubTool(args) {
  try {
    const result = await github.api.repos.get(args.repo);
    return { content: [{ type: "text", text: JSON.stringify(result) }] };
  } catch (error) {
    return formatMCPError(error, {
      title: "GitHub API request failed",
      detail: `Failed to fetch repository: ${args.repo}`,
      errorType: ErrorType.NETWORK_ERROR,
      isRetryable: true, // This error can be retried
      isExpected: false, // This is an unexpected error
      additionalInfo: {
        repo: args.repo,
        statusCode: error.status,
        rateLimitRemaining: error.headers?.['x-ratelimit-remaining'],
        suggestion: "Check your network connection and GitHub API limits"
      }
    });
  }
}

// Expected user cancellation
export async function longRunningTool(args) {
  try {
    const result = await performLongOperation(args);
    return { content: [{ type: "text", text: result }] };
  } catch (error) {
    if (error.name === 'AbortError') {
      return formatMCPError(error, {
        title: "Operation cancelled",
        detail: "User cancelled the long-running operation",
        errorType: ErrorType.USER_ABORTED,
        isRetryable: false, // User cancellations shouldn't be retried
        isExpected: true,   // This is an expected behavior
        additionalInfo: {
          operationDuration: Date.now() - error.startTime,
          completionPercentage: error.progress || 0
        }
      });
    }
    return formatMCPError(error);
  }
}

// Validation error with detailed info
export async function validateDataTool(args) {
  try {
    const validatedData = validateInput(args.data);
    return { content: [{ type: "text", text: "Data is valid" }] };
  } catch (error) {
    return formatMCPError(error, {
      title: "Data validation failed",
      detail: "The provided data does not meet requirements",
      errorType: ErrorType.INVALID_INPUT,
      isRetryable: false, // Invalid input won't be fixed by retrying
      isExpected: true,   // Validation failures are expected
      additionalInfo: {
        validationErrors: error.validationErrors,
        providedFields: Object.keys(args.data),
        requiredFields: error.requiredFields,
        suggestion: "Please check the data format and try again"
      }
    });
  }
}
```

## Output Format

### Basic Error Output
Creates Cursor-style error output:
```
Request ID: c90ead25-5c07-4f28-a972-baa17ddb6eaa
{"error":"ERROR_NETWORK_ERROR","details":{"title":"GitHub API Error","detail":"Failed to fetch repository","isRetryable":true,"additionalInfo":{}},"isExpected":false}
Error: Failed to fetch repository
    at githubTool (/path/to/file.js:10:15)
    ...
```

### Enhanced Error Output with Options
With `isRetryable`, `isExpected`, and `additionalInfo`:
```
Request ID: b12f8c45-9d3e-4a67-8f1b-2c9e6d4a8b7f
{"error":"ERROR_NETWORK_ERROR","details":{"title":"GitHub API request failed","detail":"Failed to fetch repository: microsoft/vscode","isRetryable":true,"additionalInfo":{"repo":"microsoft/vscode","statusCode":503,"rateLimitRemaining":"0","suggestion":"Check your network connection and GitHub API limits"}},"isExpected":false}
Error: Request failed with status code 503
    at githubTool (/path/to/file.js:10:15)
    ...
```

### User Cancellation Example
```
Request ID: f7e9d2a1-4b6c-8e3f-9a2d-1c8b5e7f4a9b
{"error":"ERROR_USER_ABORTED_REQUEST","details":{"title":"Operation cancelled","detail":"User cancelled the long-running operation","isRetryable":false,"additionalInfo":{"operationDuration":15420,"completionPercentage":65}},"isExpected":true}
Error: User aborted request
    at longRunningTool (/path/to/file.js:25:12)
    ...
```

## API

### Main Functions
- `formatMCPError(error, options?)` - Main formatting function
- `createUserAbortedError(requestId?)` - User cancellation
- `createTimeoutError(timeoutMs, requestId?)` - Timeout errors  
- `createNetworkError(error, requestId?)` - Network failures

### FormatOptions Interface
```typescript
interface FormatOptions {
  title?: string;           // Custom error title (defaults to error.name)
  detail?: string;          // Custom error detail (defaults to error.message)
  requestId?: string;       // Custom request ID (defaults to generated UUID)
  errorType?: ErrorType;    // Override auto-detected error type
  isRetryable?: boolean;    // Whether the operation can be retried
  isExpected?: boolean;     // Whether this error is expected behavior
  additionalInfo?: Record<string, any>; // Extra context data
}
```

### Error Types
```typescript
enum ErrorType {
  USER_ABORTED = "ERROR_USER_ABORTED_REQUEST",
  TIMEOUT = "ERROR_TIMEOUT",
  NETWORK_ERROR = "ERROR_NETWORK_ERROR", 
  INTERNAL_ERROR = "ERROR_INTERNAL_ERROR",
  INVALID_INPUT = "ERROR_INVALID_INPUT"
}
```

### When to Use Each Option

**`isRetryable`**
- `true`: Network errors, timeouts, rate limits
- `false`: Validation errors, user cancellations, authorization failures

**`isExpected`** 
- `true`: User cancellations, validation failures, known business logic errors
- `false`: Unexpected system errors, network failures, bugs

**`additionalInfo`**
- Include relevant context: user input, error codes, suggestions
- Help LLMs understand the error and provide better responses
- Examples: API status codes, validation details, operation progress 