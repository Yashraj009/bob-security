// In src/extension.ts
import * as vscode from "vscode";
import * as fs from "fs";
import * as path from "path";
import { SecurityScanner } from "./securityScanner";
import {
  setGroqApiKeyCommand,
  getAiFix,
  getAiAnalysis,
  extractCodeContext,
  AiFixResponse,
} from "./aiFixer";
import { AnalysisPanel } from "./analysisPanel";

export function activate(context: vscode.ExtensionContext) {
  console.log("AI Security Linter is now active!");

  const diagnostics =
    vscode.languages.createDiagnosticCollection("securityLinter");
  context.subscriptions.push(diagnostics);

  const scanner = new SecurityScanner(diagnostics);

  // Register all commands
  context.subscriptions.push(setGroqApiKeyCommand(context.secrets));

  // Create semgrep rules file command
  context.subscriptions.push(
    vscode.commands.registerCommand(
      "bob-security.createRulesFile",
      async () => {
        const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
        if (!workspaceFolder) {
          vscode.window.showErrorMessage(
            "Please open a workspace folder first."
          );
          return;
        }

        const rulesPath = path.join(
          workspaceFolder.uri.fsPath,
          "semgrep-rules.yml"
        );

        if (fs.existsSync(rulesPath)) {
          const overwrite = await vscode.window.showWarningMessage(
            "Semgrep rules file already exists. Overwrite it?",
            "Yes",
            "No"
          );
          if (overwrite !== "Yes") return;
        }

        const defaultRules = getDefaultSemgrepRules();
        try {
          fs.writeFileSync(rulesPath, defaultRules);
          vscode.window.showInformationMessage(
            `Semgrep rules file created at: ${rulesPath}`
          );

          // Open the file for editing
          const document = await vscode.workspace.openTextDocument(rulesPath);
          await vscode.window.showTextDocument(document);
        } catch (error) {
          vscode.window.showErrorMessage(
            `Failed to create rules file: ${error}`
          );
        }
      }
    )
  );

  // Scan current file command
  context.subscriptions.push(
    vscode.commands.registerCommand(
      "bob-security.scanCurrentFile",
      async () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
          vscode.window.showErrorMessage("No active editor found.");
          return;
        }

        if (editor.document.languageId !== "python") {
          vscode.window.showErrorMessage(
            "This extension only supports Python files."
          );
          return;
        }

        // Save the file first if it has unsaved changes
        if (editor.document.isDirty) {
          await editor.document.save();
        }

        scanner.scanFile(editor.document);
      }
    )
  );

  // Fix with AI command
  context.subscriptions.push(
    vscode.commands.registerCommand("bob-security.fixWithAI", async () => {
      const editor = vscode.window.activeTextEditor;
      if (!editor) {
        vscode.window.showErrorMessage("No active editor found.");
        return;
      }

      const uri = editor.document.uri;
      const fileDiagnostics = diagnostics.get(uri);
      if (!fileDiagnostics || fileDiagnostics.length === 0) {
        vscode.window.showInformationMessage(
          "No security issues found in this file."
        );
        return;
      }

      // Show progress
      await vscode.window.withProgress(
        {
          location: vscode.ProgressLocation.Notification,
          title: "Fixing security issue with AI...",
          cancellable: false,
        },
        async (progress) => {
          const firstDiagnostic = fileDiagnostics[0];
          const fullText = editor.document.getText();

          progress.report({ increment: 30, message: "Analyzing code..." });

          // Get the structured fix from the AI
          const aiFix: AiFixResponse | null = await getAiFix(
            fullText,
            firstDiagnostic,
            context.secrets
          );

          progress.report({ increment: 70, message: "Applying fix..." });

          if (aiFix && aiFix.code_to_replace) {
            const edit = new vscode.WorkspaceEdit();

            // Check if we have function range information
            const functionRange = (aiFix as any).functionRange;

            let replaceRange: vscode.Range;
            if (functionRange) {
              // Use the complete function range including decorators
              replaceRange = new vscode.Range(
                new vscode.Position(functionRange.start, 0),
                new vscode.Position(
                  functionRange.end,
                  editor.document.lineAt(functionRange.end).text.length
                )
              );
            } else {
              // Fallback to the original diagnostic range
              replaceRange = firstDiagnostic.range;
            }

            // Replace the complete function with the fixed version
            edit.replace(uri, replaceRange, aiFix.code_to_replace);

            // Add new imports if needed
            if (aiFix.imports_to_add && aiFix.imports_to_add.length > 0) {
              const importText = aiFix.imports_to_add.join("\n") + "\n";
              const lastImportLine = findLastImportLine(editor.document);
              const insertPosition = new vscode.Position(lastImportLine + 1, 0);
              edit.insert(uri, insertPosition, importText);
            }

            await vscode.workspace.applyEdit(edit);
            await editor.document.save();

            // Show explanation if available
            if (aiFix.explanation) {
              vscode.window
                .showInformationMessage(
                  `AI fix applied: ${aiFix.explanation}`,
                  "View Changes"
                )
                .then((selection) => {
                  if (selection === "View Changes") {
                    // Re-scan to show the fix worked
                    setTimeout(() => scanner.scanFile(editor.document), 1000);
                  }
                });
            } else {
              vscode.window.showInformationMessage(
                "AI fix applied successfully!"
              );
              // Re-scan to show the fix worked
              setTimeout(() => scanner.scanFile(editor.document), 1000);
            }
          } else {
            vscode.window.showErrorMessage(
              "Failed to generate a fix. Please check your API key and try again."
            );
          }
        }
      );
    })
  );

  // Explain issue command
  context.subscriptions.push(
    vscode.commands.registerCommand("bob-security.explainIssue", async () => {
      const editor = vscode.window.activeTextEditor;
      if (!editor) {
        vscode.window.showErrorMessage("No active editor found.");
        return;
      }

      const fileDiagnostics = diagnostics.get(editor.document.uri);
      if (!fileDiagnostics || fileDiagnostics.length === 0) {
        vscode.window.showInformationMessage(
          "No security issues found in this file."
        );
        return;
      }

      const firstDiagnostic = fileDiagnostics[0];
      const codeContext = extractCodeContext(
        editor.document.getText(),
        firstDiagnostic.range.start.line
      );

      // Create or show the panel
      AnalysisPanel.createOrShow(context.extensionUri);
      const panel = AnalysisPanel.currentPanel;

      if (panel) {
        // Show a loading message
        panel.update(
          "🔍 Analyzing your code with AI...\n\nPlease wait while we examine the security issue..."
        );

        // Get the analysis and update the panel's content
        const analysis = await getAiAnalysis(
          codeContext,
          firstDiagnostic,
          context.secrets
        );
        if (analysis) {
          panel.update(analysis);
        }
      }
    })
  );

  // Auto-scan functionality
  const config = vscode.workspace.getConfiguration("aiSecurityLinter");
  if (config.get("enableAutoScan", true)) {
    vscode.workspace.onDidOpenTextDocument(
      (doc) => {
        if (doc.languageId === "python") {
          scanner.scanFile(doc);
        }
      },
      null,
      context.subscriptions
    );

    vscode.workspace.onDidSaveTextDocument(
      (doc) => {
        if (doc.languageId === "python") {
          scanner.scanFile(doc);
        }
      },
      null,
      context.subscriptions
    );

    // Scan the currently active file if it's Python
    if (vscode.window.activeTextEditor?.document.languageId === "python") {
      scanner.scanFile(vscode.window.activeTextEditor.document);
    }
  }

  // Show welcome message on first activation
  const hasShownWelcome = context.globalState.get("hasShownWelcome", false);
  if (!hasShownWelcome) {
    showWelcomeMessage(context);
    context.globalState.update("hasShownWelcome", true);
  }
}

function findLastImportLine(document: vscode.TextDocument): number {
  let lastImportLine = -1;
  for (let i = 0; i < document.lineCount; i++) {
    const line = document.lineAt(i).text.trim();
    if (line.startsWith("import ") || line.startsWith("from ")) {
      lastImportLine = i;
    }
    // Stop searching after empty lines following imports
    if (lastImportLine >= 0 && line === "" && i > lastImportLine + 1) {
      break;
    }
  }
  return lastImportLine;
}

function getDefaultSemgrepRules(): string {
  return `rules:
  - id: python-hardcoded-secret
    patterns:
      - pattern-either:
          - pattern: API_KEY = "$SECRET"
          - pattern: SECRET_KEY = "$SECRET"
          - pattern: PASSWORD = "$SECRET"
          - pattern: TOKEN = "$SECRET"
          - pattern: PRIVATE_KEY = "$SECRET"
    message: "Hardcoded secret detected. Use environment variables for sensitive credentials."
    severity: ERROR
    languages: [python]
    metadata:
      category: security
      cwe: "CWE-798: Use of Hard-coded Credentials"

  - id: flask-missing-authorization
    patterns:
      - pattern: |
          @app.route(...)
          def $FUNC(...):
            ...
      - pattern-not-inside: |
          @login_required
          ...
          @app.route(...)
          ...
      - pattern-not-inside: |
          @require_auth
          ...
          @app.route(...)
          ...
    message: "This Flask route may be missing an authorization check. Protect sensitive endpoints."
    severity: WARNING
    languages: [python]
    metadata:
      category: security
      cwe: "CWE-285: Improper Authorization"

  - id: sql-injection-risk
    patterns:
      - pattern-either:
          - pattern: cursor.execute("SELECT * FROM " + $VAR)
          - pattern: cursor.execute(f"SELECT * FROM {$VAR}")
          - pattern: cursor.execute("INSERT INTO " + $VAR)
          - pattern: cursor.execute(f"INSERT INTO {$VAR}")
    message: "Potential SQL injection vulnerability. Use parameterized queries."
    severity: ERROR
    languages: [python]
    metadata:
      category: security
      cwe: "CWE-89: SQL Injection"

  - id: unsafe-yaml-load
    patterns:
      - pattern: yaml.load($DATA)
      - pattern-not: yaml.load($DATA, Loader=yaml.SafeLoader)
    message: "Unsafe YAML loading detected. Use yaml.safe_load() or specify SafeLoader."
    severity: ERROR
    languages: [python]
    metadata:
      category: security
      cwe: "CWE-502: Deserialization of Untrusted Data"

  - id: insecure-random
    patterns:
      - pattern-either:
          - pattern: random.random()
          - pattern: random.randint(...)
    message: "Using insecure random number generator. Use secrets module for cryptographic purposes."
    severity: WARNING
    languages: [python]
    metadata:
      category: security
      cwe: "CWE-330: Use of Insufficiently Random Values"

  - id: debug-mode-enabled
    patterns:
      - pattern: app.run(debug=True)
      - pattern: app.debug = True
    message: "Debug mode should be disabled in production."
    severity: WARNING
    languages: [python]
    metadata:
      category: security
      cwe: "CWE-489: Active Debug Code"
`;
}

async function showWelcomeMessage(context: vscode.ExtensionContext) {
  const setupChoice = await vscode.window.showInformationMessage(
    "Welcome to AI Security Linter! Would you like to set up your workspace?",
    "Set API Key",
    "Create Rules File",
    "Later"
  );

  switch (setupChoice) {
    case "Set API Key":
      await vscode.commands.executeCommand("bob-security.setApiKey");
      break;
    case "Create Rules File":
      await vscode.commands.executeCommand("bob-security.createRulesFile");
      break;
  }
}

export function deactivate() {
  console.log("AI Security Linter deactivated.");
}
