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