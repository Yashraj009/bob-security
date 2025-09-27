// // In src/logger.ts
// import * as vscode from "vscode";
// import * as fs from "fs";
// import * as path from "path";

// export function logFix(
//   originalCode: string,
//   diagnosticMessage: string,
//   newCode: string
// ) {
//   const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
//   if (!workspaceFolder) {
//     return; // Can't log without a workspace
//   }

//   const logDir = path.join(workspaceFolder.uri.fsPath, ".vscode");
//   const logFile = path.join(logDir, "security-fixes.log");

//   const timestamp = new Date().toISOString();
//   const logEntry = `
// ---
// [${timestamp}]
// Issue Found: ${diagnosticMessage}
// --- Original Code Snippet ---
// ${originalCode}
// --- Fix Applied ---
// ${newCode}
// ---

// `;

//   try {
//     if (!fs.existsSync(logDir)) {
//       fs.mkdirSync(logDir);
//     }
//     fs.appendFileSync(logFile, logEntry);
//   } catch (error) {
//     console.error("Failed to write to log file:", error);
//   }
// }
// In src/logger.ts
import * as vscode from "vscode";
import * as fs from "fs";
import * as path from "path";

export interface FixLog {
  timestamp: string;
  originalCode: string;
  securityIssue: string;
  fixedCode: string;
  success: boolean;
}

let outputChannel: vscode.OutputChannel | undefined;

export function getOutputChannel(): vscode.OutputChannel {
  if (!outputChannel) {
    outputChannel = vscode.window.createOutputChannel("AI Security Linter");
  }
  return outputChannel;
}

export function logFix(
  originalCode: string,
  securityIssue: string,
  fixedCode: string,
  success: boolean = true
): void {
  const channel = getOutputChannel();
  const timestamp = new Date().toISOString();

  channel.appendLine(`\n=== AI FIX APPLIED ===`);
  channel.appendLine(`Timestamp: ${timestamp}`);
  channel.appendLine(`Issue: ${securityIssue}`);
  channel.appendLine(`Success: ${success}`);
  channel.appendLine(`\nOriginal Code:`);
  channel.appendLine(originalCode);
  channel.appendLine(`\nFixed Code:`);
  channel.appendLine(fixedCode);
  channel.appendLine(`========================\n`);

  // Also log to workspace if available
  const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
  if (workspaceFolder) {
    try {
      const logDir = path.join(workspaceFolder.uri.fsPath, ".vscode");
      const logFile = path.join(logDir, "ai-security-fixes.log");

      // Ensure .vscode directory exists
      if (!fs.existsSync(logDir)) {
        fs.mkdirSync(logDir, { recursive: true });
      }

      const logEntry = {
        timestamp,
        originalCode,
        securityIssue,
        fixedCode,
        success,
      };

      const logLine = JSON.stringify(logEntry) + "\n";
      fs.appendFileSync(logFile, logLine);
    } catch (error) {
      console.error("Failed to write to log file:", error);
    }
  }
}

export function logError(operation: string, error: Error): void {
  const channel = getOutputChannel();
  channel.appendLine(`\n=== ERROR ===`);
  channel.appendLine(`Operation: ${operation}`);
  channel.appendLine(`Timestamp: ${new Date().toISOString()}`);
  channel.appendLine(`Error: ${error.message}`);
  channel.appendLine(`Stack: ${error.stack}`);
  channel.appendLine(`=============\n`);
}

export function logScanResult(
  fileName: string,
  issueCount: number,
  duration: number
): void {
  const channel = getOutputChannel();
  channel.appendLine(
    `Scanned ${fileName}: ${issueCount} issues found in ${duration}ms`
  );
}

export function showLogOutput(): void {
  getOutputChannel().show();
}
