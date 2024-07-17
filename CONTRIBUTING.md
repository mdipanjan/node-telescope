# Contributing to Node Telescope

First off, thank you for considering contributing to Node Telescope! It's people like you that make Node Telescope such a great tool.

## Code of Conduct

By participating in this project, you are expected to uphold our [Code of Conduct](CODE_OF_CONDUCT.md).

## What do I need to know before I get started?

### Project Structure

Node Telescope is a monorepo managed with Lerna. It consists of the following packages:

- `packages/node-telescope`: The core Node Telescope library
- `packages/node-telescope-frontend`: The frontend dashboard for Node Telescope
- `packages/examples`: Example projects demonstrating Node Telescope usage

### Design Decisions

When we make a significant decision in how we maintain the project and what we can or cannot support, we will document it in the [project wiki](https://github.com/your-username/node-telescope/wiki). If you have a question around how we do things, check to see if it is documented there. If it is not documented there, please open a new issue and ask your question.

## How Can I Contribute?

### Reporting Bugs

This section guides you through submitting a bug report for Node Telescope. Following these guidelines helps maintainers and the community understand your report, reproduce the behavior, and find related reports.

**Before Submitting A Bug Report:**

- Check the [debugging guide](https://github.com/your-username/node-telescope/wiki/Debugging).
- Check the [FAQs on the wiki](https://github.com/your-username/node-telescope/wiki/FAQs) for a list of common questions and problems.
- Perform a [cursory search](https://github.com/your-username/node-telescope/issues) to see if the problem has already been reported. If it has and the issue is still open, add a comment to the existing issue instead of opening a new one.

**How Do I Submit A (Good) Bug Report?**

Bugs are tracked as [GitHub issues](https://guides.github.com/features/issues/). Create an issue and provide the following information:

- Use a clear and descriptive title for the issue to identify the problem.
- Describe the exact steps which reproduce the problem in as many details as possible.
- Provide specific examples to demonstrate the steps.
- Describe the behavior you observed after following the steps and point out what exactly is the problem with that behavior.
- Explain which behavior you expected to see instead and why.
- Include screenshots and animated GIFs which show you following the described steps and clearly demonstrate the problem.

### Suggesting Enhancements

This section guides you through submitting an enhancement suggestion for Node Telescope, including completely new features and minor improvements to existing functionality.

**Before Submitting An Enhancement Suggestion:**

- Check if there's already [a package](https://www.npmjs.com/search?q=keywords:telescope) which provides that enhancement.
- Perform a [cursory search](https://github.com/your-username/node-telescope/issues) to see if the enhancement has already been suggested. If it has, add a comment to the existing issue instead of opening a new one.

**How Do I Submit A (Good) Enhancement Suggestion?**

Enhancement suggestions are tracked as [GitHub issues](https://guides.github.com/features/issues/). Create an issue and provide the following information:

- Use a clear and descriptive title for the issue to identify the suggestion.
- Provide a step-by-step description of the suggested enhancement in as many details as possible.
- Provide specific examples to demonstrate the steps.
- Describe the current behavior and explain which behavior you expected to see instead and why.
- Explain why this enhancement would be useful to most Node Telescope users.
- List some other text editors or applications where this enhancement exists.

### Your First Code Contribution

Unsure where to begin contributing to Node Telescope? You can start by looking through these `beginner` and `help-wanted` issues:

- [Beginner issues](https://github.com/your-username/node-telescope/issues?q=is%3Aissue+is%3Aopen+label%3A%22good+first+issue%22) - issues which should only require a few lines of code, and a test or two.
- [Help wanted issues](https://github.com/your-username/node-telescope/issues?q=is%3Aissue+is%3Aopen+label%3A%22help+wanted%22) - issues which should be a bit more involved than `beginner` issues.

### Pull Requests

- Fill in [the required template](PULL_REQUEST_TEMPLATE.md)
- Do not include issue numbers in the PR title
- Follow the [JavaScript](#javascript-styleguide) styleguide.
- Include thoughtfully-worded, well-structured [Jasmine](https://jasmine.github.io/) specs in the `./spec` folder. Run them using `npm test`.
- Document new code based on the [Documentation Styleguide](#documentation-styleguide)
- End all files with a newline

## Styleguides

### Git Commit Messages

- Use the present tense ("Add feature" not "Added feature")
- Use the imperative mood ("Move cursor to..." not "Moves cursor to...")
- Limit the first line to 72 characters or less
- Reference issues and pull requests liberally after the first line
- Consider starting the commit message with an applicable emoji:
  - 🎨 `:art:` when improving the format/structure of the code
  - 🐎 `:racehorse:` when improving performance
  - 🚱 `:non-potable_water:` when plugging memory leaks
  - 📝 `:memo:` when writing docs
  - 🐛 `:bug:` when fixing a bug
  - 🔥 `:fire:` when removing code or files
  - 💚 `:green_heart:` when fixing the CI build
  - ✅ `:white_check_mark:` when adding tests
  - 🔒 `:lock:` when dealing with security
  - ⬆️ `:arrow_up:` when upgrading dependencies
  - ⬇️ `:arrow_down:` when downgrading dependencies
  - 👕 `:shirt:` when removing linter warnings

### JavaScript Styleguide

All JavaScript must adhere to [JavaScript Standard Style](https://standardjs.com/).

### Documentation Styleguide

- Use [Markdown](https://daringfireball.net/projects/markdown).
- Reference methods and classes in markdown with the custom `{}` notation:
  - Reference classes with `{ClassName}`
  - Reference instance methods with `{ClassName::methodName}`
  - Reference class methods with `{ClassName.methodName}`

## Additional Notes

### Issue and Pull Request Labels

This section lists the labels we use to help us track and manage issues and pull requests.

[GitHub search](https://help.github.com/articles/searching-issues/) makes it easy to use labels for finding groups of issues or pull requests you're interested in.

The labels are loosely grouped by their purpose, but it's not required that every issue has a label from every group or that an issue can't have more than one label from the same group.

Please open an issue if you have suggestions for new labels.

#### Type of Issue and Issue State

- `enhancement`: Feature requests.
- `bug`: Confirmed bugs or reports that are very likely to be bugs.
- `question`: Questions more than bug reports or feature requests (e.g. how do I do X).
- `feedback`: General feedback more than bug reports or feature requests.
- `help-wanted`: The Node Telescope core team would appreciate help from the community in resolving these issues.
- `beginner`: Less complex issues which would be good first issues to work on for users who want to contribute to Node Telescope.
- `more-information-needed`: More information needs to be collected about these problems or feature requests (e.g. steps to reproduce).
- `needs-reproduction`: Likely bugs, but haven't been reliably reproduced.
- `blocked`: Issues blocked on other issues.
- `duplicate`: Issues which are duplicates of other issues, i.e. they have been reported before.
- `wontfix`: The Node Telescope core team has decided not to fix these issues for now, either because they're working as intended or for some other reason.
- `invalid`: Issues which aren't valid (e.g. user errors).

#### Topic Categories

- `documentation`: Related to any type of documentation.
- `performance`: Related to performance.
- `security`: Related to security.
- `ui`: Related to visual design.
- `crash`: Reports of Node Telescope completely crashing.
- `network`: Related to network problems or working with remote files.
- `git`: Related to Git functionality (e.g. problems with gitignore files or with showing the correct file status).

#### Pull Request Labels

- `work-in-progress`: Pull requests which are still being worked on, more changes will follow.
- `needs-review`: Pull requests which need code review, and approval from maintainers or Node Telescope core team.
- `under-review`: Pull requests being reviewed by maintainers or Node Telescope core team.
- `requires-changes`: Pull requests which need to be updated based on review comments and then reviewed again.
- `needs-testing`: Pull requests which need manual testing.

Thank you for contributing to Node Telescope!
