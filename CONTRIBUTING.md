# Contributing to QuickLocalize

First off, thank you for considering contributing to QuickLocalize! It's people like you that make QuickLocalize such a great tool.

## Code of Conduct

This project and everyone participating in it is governed by our Code of Conduct. By participating, you are expected to uphold this code.

## How Can I Contribute?

### Reporting Bugs

Before creating bug reports, please check the issue list as you might find out that you don't need to create one. When you are creating a bug report, please include as many details as possible:

- **Use a clear and descriptive title**
- **Describe the exact steps which reproduce the problem**
- **Provide specific examples to demonstrate the steps**
- **Describe the behavior you observed after following the steps**
- **Explain which behavior you expected to see instead and why**
- **Include screenshots if possible**
- **Include your environment** (OS, Node.js version, browser, etc.)

### Suggesting Enhancements

Enhancement suggestions are tracked as GitHub issues. Please include:

- **Use a clear and descriptive title**
- **Provide a step-by-step description of the suggested enhancement**
- **Provide specific examples to demonstrate the steps**
- **Describe the current behavior and expected behavior**
- **Explain why this enhancement would be useful**

### Pull Requests

- Follow the existing code style
- Add tests for new functionality
- Update documentation as needed
- End all files with a newline
- Include appropriate commit messages

## Development Setup

1. Fork the repository
2. Clone your fork: `git clone https://github.com/your-username/quicklocalize.git`
3. Add the upstream repository: `git remote add upstream https://github.com/original-owner/quicklocalize.git`
4. Create a new branch: `git checkout -b feature/your-feature-name`
5. Install dependencies: `npm install`
6. Make your changes
7. Test locally: `npm run dev`
8. Commit your changes with clear messages
9. Push to your fork: `git push origin feature/your-feature-name`
10. Open a Pull Request

## Styleguides

### Git Commit Messages

- Use the present tense ("Add feature" not "Added feature")
- Use the imperative mood ("Move cursor to..." not "Moves cursor to...")
- Limit the first line to 72 characters or less
- Reference issues and pull requests liberally after the first line
- Example:

  ```
  Add context-aware translation for German language

  - Implement tone detection based on app context
  - Add support for formal/informal German variants
  - Fixes #123
  ```

### JavaScript/TypeScript

- Use 2 spaces for indentation
- Use semicolons at the end of statements
- Use camelCase for variable names
- Use PascalCase for component and class names
- Write JSDoc comments for functions and components

### Documentation

- Use Markdown for all documentation
- Reference external links with proper attribution
- Keep line length to 100 characters where possible
- Use code blocks for examples

## Additional Notes

### Issue and Pull Request Labels

This section lists the labels we use to help organize and categorize issues and pull requests.

- `bug` - Something isn't working
- `enhancement` - New feature or request
- `documentation` - Improvements or additions to documentation
- `good first issue` - Good for newcomers
- `help wanted` - Extra attention is needed
- `question` - Further information is requested

## Questions?

Feel free to open an issue with the label `question` or reach out to the maintainers.

Thank you for contributing! 🎉
