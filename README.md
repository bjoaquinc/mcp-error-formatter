# MCP Error Formatter

mcp‑error‑formatter is a lightweight npm package designed to **standardize error formatting for Model Context Protocol (MCP) tool calls**, inspired by Cursor's clean and LLM‑friendly approach. If you've built MCP servers for LLM integrations and struggled with cryptic error messages that confuse models or hinder debugging, this utility simplifies the process by transforming JavaScript `Error`s into structured `CallToolResult` objects. It auto‑detects error types (timeouts, user aborts, network faults), tags each error with a request‑ID for easy tracing, and sets flags such as `isRetryable` so LLMs (and agents) can behave intelligently—reducing vague "something went wrong" outputs and speeding up development. With **zero runtime dependencies beyond `uuid`** and seamless compatibility with the official MCP SDK, FastMCP, or bare JSON‑RPC servers, it's a drop‑in upgrade that makes your MCP tools more robust and user‑friendly.

---

## Installation

```bash
npm install @bjoaquinc/mcp-error-formatter
```

## Usage

### Basic Usage

```typescript
import { formatMCPError } from "@bjoaquinc/mcp-error-formatter";

export async function myTool(_args) {
  try {
    const result = await someOperation();
    return { content: [{ type: "text", text: result }] };
  } catch (err) {
    // Minimum call – auto‑detects type, adds requestId, structuredContent
    return formatMCPError(err, { title: "Operation failed" });
  }
}
```

### Advanced Usage (structuredContent override)

```typescript
import { formatMCPError, ErrorType } from "@bjoaquinc/mcp-error-formatter";

export async function githubTool(args) {
  try {
    const res = await github.api.repos.get(args.repo);
    return { content: [{ type: "text", text: JSON.stringify(res) }] };
  } catch (err) {
    return formatMCPError(err, {
      title: "GitHub API request failed",
      detail: `Failed to fetch repository: ${args.repo}`,
      errorType: ErrorType.NETWORK_ERROR,
      isRetryable: true,
      additionalInfo: {
        repo: args.repo,
        statusCode: err.status,
        rateLimitRemaining: err.headers?.["x-ratelimit-remaining"]
      },
      // NEW — full structured payload override (optional)
      structured: {
        service: "github",
        repo: args.repo,
        statusCode: err.status,
        retryable: true
      }
    });
  }
}
```

---

## Response / Return Values

`formatMCPError()` always returns a **valid MCP `CallToolResult`** with the following structure:

```jsonc
{
  "isError": true,
  "structuredContent": {         // ⇠ JSON object (auto‑generated or your override)
    "errorType": "ERROR_NETWORK_ERROR",
    "title": "GitHub API request failed",
    "detail": "...",
    "retryable": true,
    "expected": false,
    "info": { "statusCode": 503 }
  },
  "content": [                   // ⇠ Legacy/LLM‑friendly text block
    {
      "type": "text",
      "text": "Request ID: 4de1...\\n{...same JSON...}\\nError: ...\\n  at ..."
    }
  ]
}
```

* **`structuredContent`** – machine‑readable JSON for modern clients.
* **`content`** – single text item duplicating the JSON plus full stack trace for Cursor & other UIs.

---

## API Overview

| Function                                        | Description                                             |
| ----------------------------------------------- | ------------------------------------------------------- |
| **`formatMCPError(error, options?)`**           | Convert any `Error` into a structured `CallToolResult`. |
| **`createUserAbortedError(requestId?)`**        | Convenience: pre‑built user‑cancelled error.            |
| **`createTimeoutError(timeoutMs, requestId?)`** | Convenience: pre‑built timeout error.                   |
| **`createNetworkError(error, requestId?)`**     | Convenience: wraps fetch/axios errors.                  |

### `FormatOptions`

```typescript
interface FormatOptions {
  title?: string;
  detail?: string;
  requestId?: string;                 // Defaults to uuid.v4()
  errorType?: ErrorType;              // Auto‑detected if omitted
  isRetryable?: boolean;
  isExpected?: boolean;
  additionalInfo?: Record<string, any>;
  structured?: Record<string, unknown>; // NEW: full override of structuredContent
}
```

### `ErrorType`

```typescript
enum ErrorType {
  USER_ABORTED   = "ERROR_USER_ABORTED_REQUEST",
  TIMEOUT        = "ERROR_TIMEOUT",
  NETWORK_ERROR  = "ERROR_NETWORK_ERROR",
  INTERNAL_ERROR = "ERROR_INTERNAL_ERROR",
  INVALID_INPUT  = "ERROR_INVALID_INPUT"
}
```

---

## Output Examples

<details>
<summary>Default (auto‑generated structuredContent)</summary>

```
Request ID: 4de16c8d‑...‑6a9c
{"errorType":"ERROR_NETWORK_ERROR","title":"GitHub API request failed","detail":"Failed to fetch repository","retryable":true,"expected":false,"info":{"statusCode":503}}
Error: Request failed with status code 503
    at githubTool (/path/to/file.js:12:18)
    ...
```

</details>

<details>
<summary>Custom structuredContent override</summary>

```
Request ID: 2f3a08e1‑...‑d212
{"service":"github","repo":"octocat/Hello-World","statusCode":503,"retryable":true}
Error: Request failed with status code 503
    at githubTool (/path/to/file.js:12:18)
    ...
```

</details>

---

**That's it!** Drop `formatMCPError` into any MCP tool, get rich JSON for agents and readable stacks for humans—no extra setup required.

 