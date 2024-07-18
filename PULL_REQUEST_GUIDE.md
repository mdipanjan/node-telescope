# Pull Request Guide for Node Telescope

This guide outlines the process and requirements for submitting a Pull Request (PR) to the Node Telescope project. Following these guidelines helps maintainers and the community review your contributions more efficiently.

## Pull Request Checklist

Before submitting your Pull Request, please ensure you've completed the following steps:

1. **Use the PR template**: Fill in [the required template](PULL_REQUEST_TEMPLATE.md) completely. This template helps provide context and details about your changes.

2. **PR title format**: Your PR title should be descriptive and concise. Do not include issue numbers in the PR title.

   - Good: "Add support for PostgreSQL queries"
   - Avoid: "#123 - Add PostgreSQL support"

3. **Follow the JavaScript Styleguide**: Ensure your code adheres to our [JavaScript Styleguide](#javascript-styleguide). This maintains consistency across the project.

4. **Include tests**: Add thoughtfully-worded, well-structured [Jest](https://jestjs.io/) specs in the `./spec` folder.

   - Run tests using `npm test` to ensure all tests pass.
   - Tests should cover both expected behavior and edge cases.

5. **Document new code**: Follow the [Documentation Styleguide](#documentation-styleguide) when adding comments and documentation to your code.

   - Document public APIs, important functions, and complex logic.
   - Update relevant README files or wiki pages if necessary.

6. **File formatting**: Ensure all files, including new ones, end with a newline character.

## Best Practices

- Keep your PRs focused on a single feature or bug fix. This makes reviews easier and faster.
- Write clear commit messages that explain the "why" behind your changes.
- If your PR addresses an open issue, reference it in the PR description using GitHub's syntax: "Fixes #123" or "Closes #456".
- Be responsive to comments and questions during the review process.
- If requested changes are extensive, consider creating a new commit for each set of changes rather than force-pushing over your existing commits.

## After Submitting

- Monitor your PR for comments and review feedback.
- Be prepared to make changes based on reviewer suggestions.
- Once approved, a maintainer will merge your PR. Celebrate your contribution!

Thank you for contributing to Node Telescope! Your efforts help improve the project for everyone.
