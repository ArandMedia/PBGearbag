# Contributing to Paintball Community App

Thank you for your interest in contributing to the Paintball Community App! This document provides guidelines and instructions for contributing.

## Code of Conduct

- Be respectful and inclusive
- Welcome newcomers and encourage diverse perspectives
- Focus on constructive feedback
- Respect differing opinions and experiences

## How to Contribute

### Reporting Bugs

1. Check if the bug has already been reported in [Issues](https://github.com/ArandMedia/PBG/issues)
2. If not, create a new issue with:
   - Clear, descriptive title
   - Steps to reproduce
   - Expected vs actual behavior
   - Screenshots if applicable
   - Environment details (OS, device, versions)

### Suggesting Features

1. Check existing issues and discussions
2. Create a new issue with:
   - Clear description of the feature
   - Use cases and benefits
   - Potential implementation approach
   - Any relevant mockups or examples

### Pull Requests

1. **Fork the repository**

2. **Create a feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   # or
   git checkout -b fix/bug-description
   ```

3. **Make your changes**
   - Follow the coding standards
   - Write tests for new features
   - Update documentation as needed

4. **Commit your changes**
   ```bash
   git add .
   git commit -m "feat: add user profile editing"
   ```

   Follow [Conventional Commits](https://www.conventionalcommits.org/):
   - `feat:` - New feature
   - `fix:` - Bug fix
   - `docs:` - Documentation changes
   - `style:` - Code style changes (formatting, etc.)
   - `refactor:` - Code refactoring
   - `test:` - Adding or updating tests
   - `chore:` - Maintenance tasks

5. **Push to your fork**
   ```bash
   git push origin feature/your-feature-name
   ```

6. **Create a Pull Request**
   - Use a clear, descriptive title
   - Reference related issues
   - Describe your changes in detail
   - Include screenshots for UI changes
   - List any breaking changes

## Development Guidelines

### Code Style

#### TypeScript
- Use TypeScript for all new code
- Define proper types (avoid `any`)
- Use interfaces for object shapes
- Use enums for fixed sets of values

#### React Native / React
- Use functional components with hooks
- Keep components small and focused
- Extract reusable logic into custom hooks
- Use proper prop types

#### NestJS
- Follow NestJS conventions and architecture
- Use decorators appropriately
- Implement proper DTOs for validation
- Write modular, testable code

### Naming Conventions

- **Files**: kebab-case (e.g., `user-profile.component.tsx`)
- **Components**: PascalCase (e.g., `UserProfile`)
- **Functions/Variables**: camelCase (e.g., `getUserProfile`)
- **Constants**: UPPER_SNAKE_CASE (e.g., `MAX_FILE_SIZE`)
- **Types/Interfaces**: PascalCase (e.g., `UserProfile`)

### Testing

- Write unit tests for business logic
- Write integration tests for API endpoints
- Test error cases and edge cases
- Aim for >80% code coverage on new code

```bash
# Run tests
npm run test

# Run tests with coverage
cd backend && npm run test:cov
```

### Documentation

- Document complex functions with JSDoc comments
- Update README.md for significant changes
- Add API endpoint documentation
- Include inline comments for complex logic

### Performance

- Optimize database queries
- Implement pagination for large datasets
- Use caching where appropriate
- Lazy load images and heavy components
- Profile and optimize slow operations

### Security

- Never commit secrets or credentials
- Validate and sanitize all user input
- Use prepared statements for database queries
- Implement proper authentication and authorization
- Follow OWASP security best practices

## Project-Specific Guidelines

### Mobile App

- Test on both iOS and Android
- Ensure responsive design works on various screen sizes
- Optimize for performance on lower-end devices
- Follow platform-specific design guidelines
- Handle offline scenarios gracefully

### Backend API

- Follow RESTful API conventions
- Implement proper error handling
- Use appropriate HTTP status codes
- Validate all input with DTOs
- Document endpoints with Swagger decorators

### Database

- Create migrations for schema changes
- Never modify existing migrations
- Include rollback logic
- Seed essential data appropriately

## Review Process

1. **Automated Checks**
   - Linting must pass
   - Tests must pass
   - Build must succeed

2. **Code Review**
   - At least one maintainer approval required
   - Address all review comments
   - Keep discussions focused and professional

3. **Testing**
   - Manually test your changes
   - Verify on multiple devices/browsers
   - Check for regressions

4. **Merge**
   - Squash commits if requested
   - Ensure branch is up to date with main
   - Maintainer will merge once approved

## Getting Help

- Join our Discord/Slack community (link TBD)
- Ask questions in GitHub Discussions
- Tag maintainers in issues for urgent matters
- Review existing documentation and issues first

## Recognition

Contributors will be:
- Listed in CONTRIBUTORS.md
- Mentioned in release notes
- Credited in the app (for significant contributions)

## License

By contributing, you agree that your contributions will be licensed under the same license as the project.

---

Thank you for contributing to the Paintball Community! 🎨🔫
