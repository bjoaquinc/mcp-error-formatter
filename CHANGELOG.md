# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.1.4] - 2024-12-19

### Fixed
- CI/CD workflow test failures due to incorrect build order
- Tests now run after TypeScript compilation, not before
- Fixed `prepublishOnly` script order to build before testing
- Resolved "Cannot find module '../dist'" errors in test suite

### Changed
- GitHub Actions workflow now runs: build → lint → test (was: lint → test → build)
- Package.json `prepublishOnly` script now runs: build → test (was: test → build)

## [1.1.3] - 2024-12-19

### Fixed
- GitHub Packages publishing configuration and authentication
- Enhanced workflow with explicit registry configuration for dual publishing
- Added proper scope mapping for GitHub Packages registry
- Added `publishConfig` with public access for both registries

### Changed
- Improved CI/CD workflow with explicit npm registry configuration
- Enhanced GitHub Packages publishing job with proper scope setup
- Added registry-specific configuration steps to prevent publishing conflicts

## [1.1.2] - 2024-12-19

### Added
- GitHub Packages publishing support in CI/CD workflow
- Dual registry publishing: packages now published to both npm and GitHub Packages
- Enhanced GitHub Actions workflow with parallel publishing jobs

### Changed
- Updated GitHub Actions workflow to publish to both npm registry and GitHub Packages registry
- Added proper permissions for GitHub Packages publishing

### Technical Details
- Added `publish-github` job to workflow for GitHub Packages registry
- Configured `npm.pkg.github.com` registry URL for GitHub publishing
- Uses `GITHUB_TOKEN` for GitHub Packages authentication
- Maintains backward compatibility with existing npm publishing

## [1.1.1] - 2024-12-19

### Added
- Repository, bugs, and homepage links to package.json for better npm page integration
- GitHub repository now visible on npm package page

## [1.1.0] - 2024-12-19

### Added
- **NEW**: `structuredContent` field in `CallToolResult` for modern MCP clients
- **NEW**: `structured` option in `FormatOptions` for explicit structured content override
- Auto-generation of structured content when not explicitly provided
- Safe handling of circular references in structured content with graceful fallback
- Dual-format error output: machine-readable JSON + human-readable text

### Changed
- Extended `CallToolResult` interface with optional `structuredContent` field
- Extended `FormatOptions` interface with optional `structured` field for custom payloads
- Enhanced all helper functions (`createUserAbortedError`, `createTimeoutError`, `createNetworkError`) to include structured content

### Enhanced
- Comprehensive test coverage with 37 test cases (up from 30)
- Updated documentation with structured content examples and API reference
- Improved developer experience with rich JSON for modern clients

### Backward Compatibility
- **BREAKING**: None - 100% backward compatible
- Text output format remains identical to v1.0.1
- All existing APIs unchanged and fully preserved
- Legacy clients see no difference in behavior
- Existing code works without modification

### Technical Details
- Zero additional runtime dependencies
- Type-safe implementation with full TypeScript support
- Automatic error type detection preserved
- Request ID generation unchanged
- Stack trace formatting identical

## [1.0.1] - Previous Release

### Fixed
- Various bug fixes and improvements
- Improved error handling edge cases

## [1.0.0] - Initial Release

### Added
- Initial implementation of MCP error formatting
- Auto-detection of error types (timeout, network, user aborted, etc.)
- Request ID generation for error tracing
- Helper functions for common error scenarios
- Cursor-style text output formatting
- TypeScript support with full type definitions 