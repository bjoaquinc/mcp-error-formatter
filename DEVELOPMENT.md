# Development Guide

## Prerequisites

- Node.js (v16+ recommended)
- npm

## Setup

```bash
npm install
```

## Available Commands

### Core Development

```bash
# Build the project
npm run build

# Run tests
npm run test

# Run tests + build (used before publishing)
npm run prepublishOnly
```

### Code Quality

```bash
# Linting
npm run lint              # Check for linting issues
npm run lint:fix          # Automatically fix linting issues

# Formatting
npm run format            # Format all TypeScript and JavaScript files
npm run format:check      # Check if files need formatting (without changing them)
```

## Development Workflow

### During Development
```bash
npm test              # Run tests frequently
npm run lint          # Check for issues
npm run format:check  # Check formatting
```

### Before Committing
```bash
npm run format        # Fix formatting
npm run lint:fix      # Fix auto-fixable issues
npm run lint          # Check remaining issues
npm test              # Run full test suite
npm run build         # Verify build
```

## Configuration

- **ESLint**: `eslint.config.js` (v9 flat config)
- **Prettier**: `.prettierrc` (single quotes, 2-space indent)
- **TypeScript**: `tsconfig.json` (ES2020, outputs to `dist/`)

## File Structure

```
mcp-error-formatter/
├── src/
│   ├── index.ts
│   ├── formatter.ts
│   └── types.ts
├── tests/
│   ├── formatter.test.js
│   └── edge-cases.test.js
├── examples/basic.js
├── dist/ (generated)
└── config files
```

## Common Issues

- **ESLint `any` warnings**: Expected in error handling library
- **Format conflicts**: Run `npm run format`
- **Build failures**: Check `npm run lint` first

## Adding New Features

1. **Write tests first** (`tests/` directory)
2. **Implement feature** (`src/` directory)
3. **Update types** (`src/types.ts`)
4. **Export from index** (`src/index.ts`)
5. **Add examples** (`examples/` directory)
6. **Update documentation** (`README.md`)

## Testing

**Test Files**: `tests/formatter.test.js`, `tests/edge-cases.test.js`

**Coverage**: Error handling, edge cases, output validation

## Publishing Checklist

- [ ] All tests pass (`npm test`)
- [ ] No linting errors (`npm run lint`)
- [ ] Code is formatted (`npm run format:check`)
- [ ] Build succeeds (`npm run build`)
- [ ] Version updated in `package.json`
- [ ] `CHANGELOG.md` updated
- [ ] Documentation updated

## Troubleshooting

```bash
# Clean build
rm -rf dist/ && npm run build

# Check versions
npx eslint --version
npx tsc --version
``` 