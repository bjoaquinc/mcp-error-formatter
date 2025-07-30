import { formatMCPError, createUserAbortedError } from '@bjoaquinc/mcp-error-formatter';

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

// NEW: Modern structured content examples
export async function modernGithubTool({ repo, action }) {
  try {
    const result = await github.api.call(repo, action);
    return {
      content: [{ type: "text", text: JSON.stringify(result) }]
    };
  } catch (error) {
    return formatMCPError(error, {
      title: "GitHub API Error",
      detail: `Failed to ${action} on ${repo}`,
      structured: {
        service: "github",
        operation: action,
        repository: repo,
        error_code: error.status,
        rate_limit_remaining: error.headers?.['x-ratelimit-remaining'],
        documentation: "https://docs.github.com/en/rest"
      }
    });
  }
}

// Auto-generated structured content example
export async function databaseTool({ query }) {
  try {
    const result = await database.execute(query);
    return { content: [{ type: "text", text: JSON.stringify(result) }] };
  } catch (error) {
    // No explicit structured content - will auto-generate
    return formatMCPError(error, {
      title: "Database Query Failed",
      detail: `Query execution failed: ${query}`,
      additionalInfo: {
        query,
        errorCode: error.code,
        severity: error.severity
      }
    });
  }
} 