// // In src/securityScanner.ts
// import * as vscode from "vscode";
// import { exec } from "child_process";
// import * as path from "path";
// import * as fs from "fs";

// export class SecurityScanner {
//   // ... constructor remains the same ...
//   private diagnosticCollection: vscode.DiagnosticCollection;
//   private statusBarItem: vscode.StatusBarItem;

//   constructor(diagnostics: vscode.DiagnosticCollection) {
//     this.diagnosticCollection = diagnostics;
//     this.statusBarItem = vscode.window.createStatusBarItem(
//       vscode.StatusBarAlignment.Left,
//       100
//     );
//   }

//   public scanFile(document: vscode.TextDocument) {
//     // ... (the beginning of the function remains the same) ...
//     if (document.languageId !== "python" || document.uri.scheme !== "file") {
//       return;
//     }

//     const workspaceFolder = vscode.workspace.getWorkspaceFolder(document.uri);
//     if (!workspaceFolder) {
//       vscode.window.showErrorMessage(
//         "AI Security Linter: Please open a project folder, not a single file."
//       );
//       return;
//     }

//     const rulesPath = path.join(
//       workspaceFolder.uri.fsPath,
//       "semgrep-rules.yml"
//     );
//     if (!fs.existsSync(rulesPath)) {
//       vscode.window.showErrorMessage(
//         `AI Security Linter: Rules file not found. Expected at: ${rulesPath}`
//       );
//       return;
//     }

//     this.statusBarItem.text = `$(sync~spin) Scanning for security...`;
//     this.statusBarItem.show();

//     const command = `semgrep scan --config "${rulesPath}" --json "${document.fileName}"`;

//     exec(command, (error, stdout, stderr) => {
//       if (error && !stdout) {
//         console.error(`Semgrep execution error: ${error}`);
//         vscode.window.showErrorMessage(
//           `Semgrep failed to run. Check the debug console for details. Error: ${stderr}`
//         );
//         this.statusBarItem.hide();
//         return;
//       }

//       const diagnostics = this.updateDiagnostics(document, stdout);
//       this.statusBarItem.hide();

//       // --- THIS IS THE NEW PART ---
//       // If issues were found, show the notification with the button
//       //   if (diagnostics.length > 0) {
//       //     const issueCount = diagnostics.length;
//       //     vscode.window
//       //       .showWarningMessage(
//       //         `AI Security Linter found ${issueCount} potential issue(s).`,
//       //         "Fix with AI" // This is the button text
//       //       )
//       //       .then((selection) => {
//       //         if (selection === "Fix with AI") {
//       //           // This executes the command we will create in the next step
//       //           vscode.commands.executeCommand("ai-security-linter.fixWithAI");
//       //         }
//       //       });
//       //   }

//       if (diagnostics.length > 0) {
//         const issueCount = diagnostics.length;
//         // Add the new "Explain Issue" button
//         const fixButton = "Fix with AI";
//         const explainButton = "Explain Issue";

//         vscode.window
//           .showWarningMessage(
//             `AI Security Linter found ${issueCount} potential issue(s).`,
//             fixButton,
//             explainButton
//           )
//           .then((selection) => {
//             // Execute the correct command based on the button clicked
//             if (selection === fixButton) {
//               vscode.commands.executeCommand("bob-security.fixWithAI");
//             } else if (selection === explainButton) {
//               vscode.commands.executeCommand("bob-security.explainIssue");
//             }
//           });
//       }
//     });
//   }

//   private updateDiagnostics(
//     document: vscode.TextDocument,
//     semgrepOutput: string
//   ): vscode.Diagnostic[] {
//     this.diagnosticCollection.clear();
//     const diagnostics: vscode.Diagnostic[] = [];
//     try {
//       const output = JSON.parse(semgrepOutput);
//       if (output.results) {
//         output.results.forEach((result: any) => {
//           const range = new vscode.Range(
//             result.start.line - 1,
//             result.start.col - 1,
//             result.end.line - 1,
//             result.end.col - 1
//           );
//           const diagnostic = new vscode.Diagnostic(
//             range,
//             result.extra.message,
//             vscode.DiagnosticSeverity.Warning
//           );
//           diagnostic.source = "AI Security Linter";
//           diagnostic.code = result.check_id;
//           diagnostics.push(diagnostic);
//         });
//       }
//       this.diagnosticCollection.set(document.uri, diagnostics);
//     } catch (e) {
//       console.error("Failed to parse Semgrep output:", e);
//     }
//     return diagnostics; // Return the created diagnostics
//   }
// }

// In src/securityScanner.ts
import * as vscode from "vscode";
import { exec } from "child_process";
import * as path from "path";
import * as fs from "fs";

export class SecurityScanner {
  private diagnosticCollection: vscode.DiagnosticCollection;
  private statusBarItem: vscode.StatusBarItem;

  constructor(diagnostics: vscode.DiagnosticCollection) {
    this.diagnosticCollection = diagnostics;
    this.statusBarItem = vscode.window.createStatusBarItem(
      vscode.StatusBarAlignment.Left,
      100
    );
    this.statusBarItem.name = "AI Security Linter";
  }

  public async scanFile(document: vscode.TextDocument): Promise<void> {
    // Only scan Python files in workspace folders
    if (document.languageId !== "python" || document.uri.scheme !== "file") {
      return;
    }

    const workspaceFolder = vscode.workspace.getWorkspaceFolder(document.uri);
    if (!workspaceFolder) {
      vscode.window.showErrorMessage(
        "AI Security Linter: Please open a project folder, not a single file."
      );
      return;
    }

    // Check if semgrep is installed
    const config = vscode.workspace.getConfiguration("aiSecurityLinter");
    const semgrepPath = config.get("semgrepPath", "semgrep");

    // Check if rules file exists
    const rulesPath = path.join(
      workspaceFolder.uri.fsPath,
      "semgrep-rules.yml"
    );
    if (!fs.existsSync(rulesPath)) {
      const createRules = await vscode.window.showErrorMessage(
        `AI Security Linter: Rules file not found. Expected at: ${rulesPath}`,
        "Create Rules File",
        "Dismiss"
      );

      if (createRules === "Create Rules File") {
        await vscode.commands.executeCommand("bob-security.createRulesFile");
      }
      return;
    }

    // Show scanning status
    this.statusBarItem.text = `$(sync~spin) Scanning ${path.basename(
      document.fileName
    )}...`;
    this.statusBarItem.show();

    // Use relative path for better cross-platform compatibility
    const relativePath = path.relative(
      workspaceFolder.uri.fsPath,
      document.fileName
    );
    const command = `${semgrepPath} scan --config "${rulesPath}" --json "${document.fileName}"`;

    return new Promise((resolve) => {
      exec(
        command,
        {
          cwd: workspaceFolder.uri.fsPath,
          timeout: 30000, // 30 second timeout
        },
        (error, stdout, stderr) => {
          this.statusBarItem.hide();

          if (error) {
            // Check if semgrep is not installed
            if (
              error.message.includes("not found") ||
              error.message.includes("command not found")
            ) {
              vscode.window
                .showErrorMessage(
                  "Semgrep is not installed. Please install it with: pip install semgrep",
                  "Install Guide"
                )
                .then((selection) => {
                  if (selection === "Install Guide") {
                    vscode.env.openExternal(
                      vscode.Uri.parse(
                        "https://semgrep.dev/docs/getting-started/"
                      )
                    );
                  }
                });
              return resolve();
            }

            // If there's no stdout, it's likely a real error
            if (!stdout) {
              console.error(`Semgrep execution error: ${error}`);
              vscode.window.showErrorMessage(
                `Semgrep failed: ${
                  stderr || error.message
                }. Check the debug console for details.`
              );
              return resolve();
            }
          }

          try {
            const diagnostics = this.updateDiagnostics(document, stdout);
            this.updateStatusBar(diagnostics.length, document.fileName);

            // Show notification with action buttons if issues found
            if (diagnostics.length > 0) {
              this.showIssueNotification(diagnostics.length);
            }
          } catch (parseError) {
            console.error("Failed to process Semgrep output:", parseError);
            vscode.window.showErrorMessage(
              "Failed to parse security scan results."
            );
          }

          resolve();
        }
      );
    });
  }

  private updateDiagnostics(
    document: vscode.TextDocument,
    semgrepOutput: string
  ): vscode.Diagnostic[] {
    // Clear existing diagnostics for this file
    this.diagnosticCollection.delete(document.uri);
    const diagnostics: vscode.Diagnostic[] = [];

    if (!semgrepOutput.trim()) {
      return diagnostics;
    }

    try {
      const output = JSON.parse(semgrepOutput);

      if (output.results && Array.isArray(output.results)) {
        output.results.forEach((result: any) => {
          try {
            // Create range for the issue
            const startLine = Math.max(0, (result.start?.line || 1) - 1);
            const startCol = Math.max(0, (result.start?.col || 1) - 1);
            const endLine = Math.max(
              startLine,
              (result.end?.line || startLine + 1) - 1
            );
            const endCol = Math.max(startCol, result.end?.col || startCol + 1);

            const range = new vscode.Range(
              startLine,
              startCol,
              endLine,
              endCol
            );

            // Determine severity
            let severity = vscode.DiagnosticSeverity.Warning;
            if (result.extra?.severity === "ERROR") {
              severity = vscode.DiagnosticSeverity.Error;
            } else if (result.extra?.severity === "INFO") {
              severity = vscode.DiagnosticSeverity.Information;
            }

            const diagnostic = new vscode.Diagnostic(
              range,
              result.extra?.message ||
                result.message ||
                "Security issue detected",
              severity
            );

            diagnostic.source = "AI Security Linter";
            diagnostic.code = result.check_id || result.rule_id;

            // Add metadata if available
            if (result.extra?.metadata) {
              diagnostic.tags = [];
              if (result.extra.metadata.category) {
                diagnostic.relatedInformation = [
                  {
                    location: new vscode.Location(document.uri, range),
                    message: `Category: ${result.extra.metadata.category}`,
                  },
                ];
              }
            }

            diagnostics.push(diagnostic);
          } catch (resultError) {
            console.error("Error processing individual result:", resultError);
          }
        });
      }

      // Set diagnostics for the file
      this.diagnosticCollection.set(document.uri, diagnostics);
    } catch (parseError) {
      console.error("Failed to parse Semgrep JSON output:", parseError);
      console.error("Raw output:", semgrepOutput);
      throw parseError;
    }

    return diagnostics;
  }

  private updateStatusBar(issueCount: number, fileName: string): void {
    if (issueCount > 0) {
      this.statusBarItem.text = `$(warning) ${issueCount} security issue(s)`;
      this.statusBarItem.tooltip = `Found ${issueCount} security issue(s) in ${path.basename(
        fileName
      )}`;
      this.statusBarItem.backgroundColor = new vscode.ThemeColor(
        "statusBarItem.warningBackground"
      );
      this.statusBarItem.show();

      // Hide after 5 seconds
      setTimeout(() => {
        this.statusBarItem.hide();
      }, 5000);
    } else {
      this.statusBarItem.text = `$(check) No security issues`;
      this.statusBarItem.tooltip = `No security issues found in ${path.basename(
        fileName
      )}`;
      this.statusBarItem.backgroundColor = undefined;
      this.statusBarItem.show();

      // Hide after 3 seconds
      setTimeout(() => {
        this.statusBarItem.hide();
      }, 3000);
    }
  }

  private async showIssueNotification(issueCount: number): Promise<void> {
    const fixButton = "Fix with AI";
    const explainButton = "Explain Issue";
    const dismissButton = "Dismiss";

    const selection = await vscode.window.showWarningMessage(
      `AI Security Linter found ${issueCount} potential security issue${
        issueCount > 1 ? "s" : ""
      }.`,
      fixButton,
      explainButton,
      dismissButton
    );

    switch (selection) {
      case fixButton:
        await vscode.commands.executeCommand("bob-security.fixWithAI");
        break;
      case explainButton:
        await vscode.commands.executeCommand("bob-security.explainIssue");
        break;
      // Dismiss button or no selection does nothing
    }
  }

  public dispose(): void {
    this.statusBarItem.dispose();
  }
}
