<!-- # bob-security README

This is the README for your extension "bob-security". After writing up a brief description, we recommend including the following sections.

## Features

Describe specific features of your extension including screenshots of your extension in action. Image paths are relative to this README file.

For example if there is an image subfolder under your extension project workspace:

\!\[feature X\]\(images/feature-x.png\)

> Tip: Many popular extensions utilize animations. This is an excellent way to show off your extension! We recommend short, focused animations that are easy to follow.

## Requirements

If you have any requirements or dependencies, add a section describing those and how to install and configure them.

## Extension Settings

Include if your extension adds any VS Code settings through the `contributes.configuration` extension point.

For example:

This extension contributes the following settings:

* `myExtension.enable`: Enable/disable this extension.
* `myExtension.thing`: Set to `blah` to do something.

## Known Issues

Calling out known issues can help limit users opening duplicate issues against your extension.

## Release Notes

Users appreciate release notes as you update your extension.

### 1.0.0

Initial release of ...

### 1.0.1

Fixed issue #.

### 1.1.0

Added features X, Y, and Z.

---

## Following extension guidelines

Ensure that you've read through the extensions guidelines and follow the best practices for creating your extension.

* [Extension Guidelines](https://code.visualstudio.com/api/references/extension-guidelines)

## Working with Markdown

You can author your README using Visual Studio Code. Here are some useful editor keyboard shortcuts:

* Split the editor (`Cmd+\` on macOS or `Ctrl+\` on Windows and Linux).
* Toggle preview (`Shift+Cmd+V` on macOS or `Shift+Ctrl+V` on Windows and Linux).
* Press `Ctrl+Space` (Windows, Linux, macOS) to see a list of Markdown snippets.

## For more information

* [Visual Studio Code's Markdown Support](http://code.visualstudio.com/docs/languages/markdown)
* [Markdown Syntax Reference](https://help.github.com/articles/markdown-basics/)

**Enjoy!** -->

# AI Security Linter for VS Code

This extension helps developers write more secure Python code by identifying common vulnerabilities with Semgrep and providing intelligent, one-click fixes using the Google Gemini API.

## Features

- **🛡️ Semgrep-Powered Scanning**: Uses custom, high-precision Semgrep rules to detect security issues on file open and save.
- **✨ AI-Powered Quick Fixes**: Integrates with the Gemini API to provide intelligent code refactoring suggestions.
- **🔒 Secure API Key Storage**: Safely stores your Gemini API key in VS Code's encrypted secret storage.
- **🎯 Targeted Vulnerabilities**:
  - Detects **hardcoded secrets** (API keys, passwords).
  - Flags **missing authorization** checks in Flask routes.

## Prerequisites

1.  **VS Code**: Version 1.80.0 or newer.
2.  **Semgrep**: You must have the Semgrep CLI installed. Follow the [official installation guide](https://semgrep.dev/docs/getting-started/installation/).
3.  **Google Gemini API Key**: Get a free API key from [Google AI Studio](https://makersuite.google.com/app/apikey).

## Setup & Usage

1.  **Clone & Install**:
    ```bash
    git clone <your-repo-url>
    cd ai-security-linter
    npm install
    ```
2.  **Run the Extension**:
    - Press `F5` in VS Code to open a new **Extension Development Host** window.
3.  **Set Your API Key**:
    - In the new window, open the Command Palette (`Ctrl+Shift+P` or `Cmd+Shift+P`).
    - Run the command **"Set Gemini API Key"**.
    - Paste your key and press Enter.
4.  **See it in Action**:
    - Open a Python file with a vulnerability (e.g., `API_KEY = "..."`).
    - A yellow warning underline will appear.
    - Click the lightbulb icon or press `Ctrl+.` (`Cmd+.` on Mac) to see the "✨ Fix with AI" option.
