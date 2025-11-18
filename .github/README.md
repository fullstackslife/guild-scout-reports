# GitHub Copilot Configuration

This directory contains configuration files that help GitHub Copilot coding agent work more effectively with the Guild Scout Reports project.

## Files

### `copilot-instructions.md`

Repository-specific instructions that guide GitHub Copilot when working on this project. This file contains:

- **Project Overview**: Architecture, tech stack, and key technologies
- **Code Style & Conventions**: Naming conventions, file structure, and TypeScript requirements
- **Component Patterns**: Server vs Client components, when to use each
- **Server Actions**: Standard patterns for server actions with proper error handling
- **Styling Guidelines**: Dark theme palette and inline CSS patterns
- **Database Guidelines**: Querying best practices, migration patterns, and RLS policies
- **API Routes Structure**: Standard patterns for API endpoint implementation
- **Authentication & Authorization**: Session checking and role-based access
- **OCR Integration**: Anthropic Claude API usage for text extraction
- **Common Patterns**: Error handling, form state, and loading states
- **Environment Variables**: Required and optional configuration
- **Performance Best Practices**: Server components, query optimization, and caching
- **Security Guidelines**: RLS, authentication, and input validation

This file helps Copilot:
- Follow project conventions consistently
- Write code that matches the existing codebase style
- Use the correct patterns for common tasks
- Avoid common mistakes and anti-patterns

### `copilot-setup-steps.yml`

Pre-installation steps that configure the development environment before Copilot starts working. This ensures Copilot can:

- Build the project successfully
- Run tests and linters
- Validate changes immediately

The setup includes:
1. **Node.js 18**: Installs the correct Node.js version with npm caching
2. **Dependencies**: Runs `npm ci` for clean, reproducible installs
3. **TypeScript Verification**: Checks types without blocking
4. **Linting**: Runs ESLint to verify code style

This pre-installation approach is faster and more reliable than having Copilot discover and install dependencies through trial and error.

## Benefits

These configuration files help GitHub Copilot:

1. **Work Faster**: Pre-installed dependencies mean Copilot can start building and testing immediately
2. **Follow Standards**: Clear guidelines ensure consistent code that matches project conventions
3. **Reduce Errors**: Common patterns and best practices prevent typical mistakes
4. **Better Context**: Copilot understands project architecture and can make better decisions
5. **Security**: Guidance on authentication, authorization, and security best practices

## How GitHub Copilot Uses These Files

When assigned an issue or given a task, GitHub Copilot:

1. Reads `copilot-instructions.md` to understand project conventions and patterns
2. Runs steps from `copilot-setup-steps.yml` to prepare the development environment
3. Makes changes following the documented guidelines
4. Validates changes using the pre-installed tools (build, lint, test)

## Maintaining These Files

As the project evolves, keep these files updated:

- **Add new patterns** when you establish new conventions
- **Update dependencies** if the setup process changes
- **Document new features** and their preferred implementation patterns
- **Add examples** of complex or frequently-needed code patterns

## Additional Resources

For more information on GitHub Copilot best practices:
- [Get the best results with Copilot coding agent](https://docs.github.com/en/enterprise-cloud@latest/copilot/tutorials/coding-agent/get-the-best-results)
- [Customizing the development environment](https://docs.github.com/en/enterprise-cloud@latest/copilot/customizing-copilot/customizing-the-development-environment-for-copilot-coding-agent)
- [Creating custom agents](https://docs.github.com/en/enterprise-cloud@latest/copilot/how-tos/use-copilot-agents/coding-agent/create-custom-agents)
