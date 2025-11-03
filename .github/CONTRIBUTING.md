# Contributing to ProBuilder

Thank you for your interest in contributing to ProBuilder! This document provides guidelines and information for contributors.

## Code of Conduct

This project and everyone participating in it is governed by our Code of Conduct. By participating, you are expected to uphold this code.

## How to Contribute

### Reporting Bugs

- Use the [bug report template](.github/ISSUE_TEMPLATE/bug_report.md)
- Include steps to reproduce the issue
- Provide system information and screenshots if relevant

### Suggesting Features

- Use the [feature request template](.github/ISSUE_TEMPLATE/feature_request.md)
- Describe the problem you're trying to solve
- Explain why this feature would be useful

### Pull Requests

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Add tests for your changes
5. Ensure all tests pass
6. Commit your changes (`git commit -m 'Add amazing feature'`)
7. Push to your branch (`git push origin feature/amazing-feature`)
8. Open a Pull Request

## Development Setup

### Prerequisites

- Node.js 18+
- pnpm 8+
- Docker (optional)

### Installation

```bash
# Clone the repository
git clone https://github.com/construction-master/probuilder.git
cd probuilder

# Install dependencies
pnpm install

# Start development servers
pnpm dev
```

### Project Structure

```
probuilder/
├── apps/
│   ├── client/          # Next.js frontend
│   └── server/          # Express backend
├── packages/            # Shared packages
├── docs/               # Documentation
└── scripts/            # Build and utility scripts
```

## Coding Standards

### TypeScript

- Use strict TypeScript configuration
- Define types for all data structures
- Use interfaces for object shapes
- Avoid `any` type

### React

- Use functional components with hooks
- Follow React best practices
- Use TypeScript for all components
- Implement proper error boundaries

### Styling

- Use TailwindCSS for styling
- Follow mobile-first approach
- Use CSS variables for theming
- Implement dark mode support

### Testing

- Write unit tests for all functions
- Write integration tests for API endpoints
- Write E2E tests for critical user flows
- Maintain test coverage above 80%

## Commit Message Format

We use conventional commits:

```
type(scope): description

[optional body]

[optional footer]
```

Types:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes
- `refactor`: Code refactoring
- `test`: Test changes
- `chore`: Build process or auxiliary tool changes

## Pull Request Guidelines

- Keep PRs small and focused
- Include tests for new features
- Update documentation if needed
- Ensure CI passes
- Request review from maintainers

## Release Process

1. Update version numbers
2. Update CHANGELOG.md
3. Create release notes
4. Tag the release
5. Deploy to production

## Questions?

- Join our [Discord community](https://discord.gg/probuilder)
- Check our [documentation](https://docs.probuilder.app)
- Open an issue for questions

Thank you for contributing to ProBuilder! 🏗️
