# Bob Security

An intelligent VS Code extension that detects security vulnerabilities in Python code using Semgrep and provides AI-powered fixes and explanations using Groq.

![AI Security Linter Demo](https://img.shields.io/badge/VS%20Code-Extension-blue?logo=visual-studio-code)
![Python](https://img.shields.io/badge/Python-Security-green?logo=python)
![AI Powered](https://img.shields.io/badge/AI-Powered-orange?logo=openai)

## 🚀 Quick Demo

When you open a Python file with security issues:
1. **Red squiggly lines** appear under vulnerable code
2. **Notification popup** shows "AI Security Linter found X issues"
3. Click **"Fix with AI"** → Automatically applies secure code
4. Click **"Explain Issue"** → Get detailed security analysis

## 📦 Installation & Setup

### Method 1: Development Setup (Recommended)

1. **Clone the repository:**
   ```bash
   git clone https://github.com/your-username/bob-security.git
   cd ai-security-linter
   ```

2. **Install Node.js dependencies:**
   ```bash
   npm install
   ```

3. **Install Semgrep (Python security scanner):**
   ```bash
   # Using pip
   pip install semgrep
   
   # Using conda
   conda install -c conda-forge semgrep
   
   # Using homebrew (macOS)
   brew install semgrep
   ```

4. **Verify Semgrep installation:**
   ```bash
   semgrep --version
   # Should output version number like: 1.45.0
   ```

5. **Get Groq API Key (Free):**
   - Visit [Groq Console](https://console.groq.com/keys)
   - Sign up for free account
   - Create a new API key
   - Copy the key (starts with `gsk_`)

6. **Open in VS Code:**
   ```bash
   code .
   ```

7. **Launch Extension Development Host:**
   - Press `F5` or go to `Run and Debug` → `Run Extension`
   - This opens a new VS Code window with your extension loaded

8. **Set up API Key:**
   - In the new window: `Ctrl+Shift+P` → `AI Security Linter: Set Groq API Key`
   - Paste your API key

9. **Test the extension:**
   - Create a new Python file
   - Copy the vulnerable code from `test-samples/sample_app.py`
   - Save the file → Security issues should appear with red squiggles!

### Method 2: Install Packaged Extension

If you have the packaged `.vsix` file:

```bash
# Install the extension
code --install-extension ai-security-linter-1.0.0.vsix

# Or through VS Code UI:
# Ctrl+Shift+P → Extensions: Install from VSIX → Select the .vsix file
```

## 🏗️ Project Structure

```
ai-security-linter/
├── 📄 package.json              # Extension configuration
├── 📄 tsconfig.json             # TypeScript config
├── 📄 README.md                 # This file
├── 📂 src/                      # Source code
│   ├── 📄 extension.ts          # Main entry point
│   ├── 📄 securityScanner.ts    # Semgrep integration
│   ├── 📄 aiFixer.ts           # AI fix generation
│   ├── 📄 analysisPanel.ts     # Security analysis UI
│   └── 📄 logger.ts            # Logging system
├── 📂 out/                      # Compiled JavaScript (auto-generated)
├── 📂 test-samples/             # Test files
│   ├── 📄 sample_app.py         # Vulnerable Python code
│   └── 📄 semgrep-rules.yml     # Security rules
└── 📂 node_modules/             # Dependencies (auto-generated)
```

## 🎯 Features

### 🔍 **Security Detection**
- **Hardcoded Secrets**: API keys, passwords, tokens in code
- **Missing Authorization**: Flask routes without authentication
- **SQL Injection**: Unsafe database query construction
- **Unsafe YAML Loading**: Dangerous deserialization
- **Weak Cryptography**: Insecure random numbers, weak hashes
- **Command Injection**: Unsafe system command execution
- **Debug Mode**: Production security misconfigurations

### 🤖 **AI-Powered Fixes**
- **Automatic Code Repair**: Generates secure replacement code
- **Smart Import Management**: Adds necessary security imports
- **Context-Aware Analysis**: Understands your code structure
- **Educational Explanations**: Learn why code is vulnerable

### 📊 **User Experience**
- **Real-time Scanning**: Automatic detection on file open/save
- **Visual Indicators**: Clear highlighting of security issues
- **Interactive Analysis Panel**: Beautiful, themed security explanations
- **Progress Indicators**: Shows scanning and fixing progress
- **Comprehensive Logging**: Debug output and fix history

## 🚦 Usage

### Automatic Scanning
The extension automatically scans Python files when you:
- Open a Python file
- Save a Python file

### Manual Commands
Access via `Ctrl+Shift+P`:
- `AI Security Linter: Scan Current File`
- `AI Security Linter: Set Groq API Key`  
- `AI Security Linter: Create Semgrep Rules File`
- `AI Security Linter: Fix Security Issue with AI`
- `AI Security Linter: Explain Security Issue`

### When Issues Are Found
1. **Red squiggly lines** highlight problematic code
2. **Notification popup** appears with action buttons:
   - **Fix with AI**: Automatically apply secure code fix
   - **Explain Issue**: Get detailed analysis in side panel

## ⚙️ Configuration

Access via `File` → `Preferences` → `Settings` → `AI Security Linter`:

```json
{
  "aiSecurityLinter.enableAutoScan": true,
  "aiSecurityLinter.semgrepPath": "semgrep",
  "aiSecurityLinter.maxTokens": 1024
}
```

## 🧪 Testing the Extension

### Test with Vulnerable Code

Create a new Python file and paste this vulnerable code:

```python
from flask import Flask, request
import sqlite3
import yaml
import random

app = Flask(__name__)

# Security Issue 1: Hardcoded secret
API_KEY = "sk-1234567890abcdef"

# Security Issue 2: Missing authorization
@app.route('/admin')
def admin_panel():
    return "Welcome to admin panel"

# Security Issue 3: SQL injection
@app.route('/user/<user_id>')
def get_user(user_id):
    conn = sqlite3.connect('db.sqlite')
    cursor = conn.cursor()
    # Unsafe query construction
    cursor.execute(f"SELECT * FROM users WHERE id = {user_id}")
    return cursor.fetchone()

# Security Issue 4: Unsafe YAML
@app.route('/config', methods=['POST'])
def update_config():
    config_data = request.get_data()
    config = yaml.load(config_data)  # Dangerous!
    return f"Config: {config}"

# Security Issue 5: Weak random
@app.route('/token')
def generate_token():
    return str(random.random())  # Not cryptographically secure

if __name__ == '__main__':
    app.run(debug=True)  # Debug mode in production
```

Save the file and watch the magic happen! 🎉

### Expected Results
- **6 security issues** detected with red squiggly lines
- **Notification popup** with action buttons
- **Fix with AI** applies secure code automatically
- **Explain Issue** shows detailed security analysis

## 🛠️ Development

### Building the Extension

```bash
# Compile TypeScript
npm run compile

# Watch for changes during development
npm run watch

# Package the extension
npm install -g vsce
vsce package
```

### Debugging

1. **VS Code Developer Console:**
   - `Help` → `Toggle Developer Tools`
   - Check Console tab for errors

2. **Extension Output:**
   - `View` → `Output` → Select "AI Security Linter"
   - See detailed logs and fix history

3. **Test Semgrep manually:**
   ```bash
   semgrep --config=test-samples/semgrep-rules.yml --json your-file.py
   ```

## 🔧 Troubleshooting

### Common Issues

**❌ "Semgrep not found"**
```bash
# Install Semgrep
pip install semgrep

# Verify installation
semgrep --version

# If using conda
conda install -c conda-forge semgrep
```

**❌ "API key not set"**
- Run: `AI Security Linter: Set Groq API Key`
- Get free key: https://console.groq.com/keys
- Ensure key starts with `gsk_`

**❌ "Rules file not found"**
- Run: `AI Security Linter: Create Semgrep Rules File`
- Ensure you have workspace folder open (not single file)

**❌ "Extension not activating"**
- Open a Python file (`.py` extension)
- Check `package.json` has `"onLanguage:python"` in `activationEvents`

**❌ "AI fixes not working"**
- Verify API key is correct
- Check internet connection
- Look at Output panel for error details
- Ensure you have API credits on Groq

### Getting Help

1. **Check Logs:** `View` → `Output` → `AI Security Linter`
2. **Test Components:**
   ```bash
   # Test Semgrep
   semgrep --version
   
   # Test rules file
   semgrep --config=semgrep-rules.yml --json sample.py
   ```
3. **Verify Setup:** Ensure VS Code, Node.js, Python, and Semgrep are installed

## 🔒 Privacy & Security

- **Code Privacy**: Your code is only sent to Groq AI when you explicitly request fixes/explanations
- **Secure Storage**: API keys stored in VS Code's encrypted secret storage
- **No Data Retention**: No code is stored by external services
- **HTTPS Encryption**: All AI API communication is encrypted
- **Local Processing**: Semgrep scanning happens entirely on your machine

## 🎨 Customization

### Custom Security Rules

Edit `semgrep-rules.yml` in your workspace:

```yaml
rules:
  - id: my-custom-rule
    patterns:
      - pattern: dangerous_function($VAR)
    message: "Avoid using dangerous_function with user input"
    severity: ERROR
    languages: [python]
    metadata:
      category: security
      cwe: "CWE-XXX: Description"
```

### Modify AI Behavior

In `src/aiFixer.ts`, customize prompts for different fix styles:

```typescript
const prompt = `You are a security expert. Fix this issue: ${issue}
Use defensive programming practices and...`;
```

## 📈 Supported Security Checks

| Issue Type | Severity | Description |
|------------|----------|-------------|
| Hardcoded Secrets | 🔴 Error | API keys, passwords in code |
| SQL Injection | 🔴 Error | Unsafe query construction |
| Unsafe Deserialization | 🔴 Error | YAML, Pickle loading risks |
| Missing Authorization | 🟡 Warning | Unprotected Flask routes |
| Weak Cryptography | 🟡 Warning | Insecure random, weak hashes |
| Command Injection | 🔴 Error | Unsafe system commands |
| Debug Mode | 🟡 Warning | Production misconfigurations |

## 🤝 Contributing

We welcome contributions! Here's how to help:

1. **Fork the repository**
2. **Create feature branch:** `git checkout -b feature/amazing-feature`
3. **Make changes and test thoroughly**
4. **Run the test suite:** `npm run compile && npm run test`
5. **Submit pull request** with clear description

### Development Guidelines
- Use TypeScript strict mode
- Add JSDoc comments for public functions
- Handle errors gracefully with user-friendly messages
- Test with various Python code samples
- Update documentation for new features

## 📝 License

MIT License - see [LICENSE](LICENSE) file for details.

## 🌟 Support

- **⭐ Star this repo** if you find it useful!
- **🐛 Report issues** on GitHub Issues
- **💡 Request features** via GitHub Discussions
- **📧 Contact:** your-email@example.com

## 🚀 Roadmap

- [ ] Support for JavaScript/TypeScript security scanning
- [ ] Integration with more AI providers (OpenAI, Claude)
- [ ] Custom rule marketplace
- [ ] Team collaboration features
- [ ] CI/CD pipeline integration
- [ ] More programming languages support

---

**Made with ❤️ for secure coding**

*Keep your code safe, one fix at a time! 🛡️*
