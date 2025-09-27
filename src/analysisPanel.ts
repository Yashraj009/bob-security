// In src/analysisPanel.ts
import * as vscode from "vscode";

export class AnalysisPanel {
  public static currentPanel: AnalysisPanel | undefined;
  private readonly _panel: vscode.WebviewPanel;
  private _disposables: vscode.Disposable[] = [];

  private constructor(panel: vscode.WebviewPanel, extensionUri: vscode.Uri) {
    this._panel = panel;

    // Set up message handling
    this._panel.webview.onDidReceiveMessage(
      (message) => {
        switch (message.command) {
          case "openFile":
            this.openFile(message.file, message.line);
            break;
          case "runCommand":
            vscode.commands.executeCommand(message.commandId);
            break;
        }
      },
      null,
      this._disposables
    );

    this._panel.onDidDispose(() => this.dispose(), null, this._disposables);
  }

  public static createOrShow(extensionUri: vscode.Uri) {
    const column = vscode.window.activeTextEditor
      ? vscode.window.activeTextEditor.viewColumn
      : undefined;

    // If we already have a panel, show it
    if (AnalysisPanel.currentPanel) {
      AnalysisPanel.currentPanel._panel.reveal(column);
      return;
    }

    // Otherwise, create a new panel
    const panel = vscode.window.createWebviewPanel(
      "securityAnalysis", // Internal ID
      "🔒 Security Analysis", // Title shown to user
      column || vscode.ViewColumn.Beside, // Show beside current editor
      {
        enableScripts: true,
        retainContextWhenHidden: true, // Keep panel state when hidden
        localResourceRoots: [extensionUri],
      }
    );

    // Set panel icon
    panel.iconPath = {
      light: vscode.Uri.joinPath(extensionUri, "media", "security-light.svg"),
      dark: vscode.Uri.joinPath(extensionUri, "media", "security-dark.svg"),
    };

    AnalysisPanel.currentPanel = new AnalysisPanel(panel, extensionUri);
  }

  public async update(content: string) {
    try {
      // Dynamically import marked to convert Markdown to HTML
      const { marked } = await import("marked");

      // Configure marked for security
      marked.setOptions({
        breaks: true,
        gfm: true,
      });

      const html = await marked(content);
      this._panel.webview.html = this.getHtmlForWebview(html);
    } catch (error) {
      console.error("Error updating analysis panel:", error);
      // Fallback: show content as plain text
      this._panel.webview.html = this.getHtmlForWebview(
        `<pre>${this.escapeHtml(content)}</pre>`
      );
    }
  }

  public dispose() {
    AnalysisPanel.currentPanel = undefined;
    this._panel.dispose();

    while (this._disposables.length) {
      const disposable = this._disposables.pop();
      if (disposable) {
        disposable.dispose();
      }
    }
  }

  private openFile(filePath: string, line?: number) {
    vscode.workspace.openTextDocument(filePath).then(
      (document) => {
        vscode.window.showTextDocument(document).then((editor) => {
          if (line !== undefined) {
            const position = new vscode.Position(line, 0);
            editor.selection = new vscode.Selection(position, position);
            editor.revealRange(new vscode.Range(position, position));
          }
        });
      },
      (error) => {
        vscode.window.showErrorMessage(`Could not open file: ${error.message}`);
      }
    );
  }

  private escapeHtml(text: string): string {
    return text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  private getHtmlForWebview(content: string): string {
    const nonce = this.getNonce();

    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; script-src 'nonce-${nonce}';">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Security Analysis</title>
        <style>
          body {
            padding: 20px;
            font-family: var(--vscode-font-family);
            font-size: var(--vscode-font-size);
            line-height: 1.6;
            color: var(--vscode-foreground);
            background-color: var(--vscode-editor-background);
          }
          
          h1, h2, h3, h4, h5, h6 {
            color: var(--vscode-foreground);
            margin-top: 1.5em;
            margin-bottom: 0.5em;
          }
          
          h1 {
            border-bottom: 2px solid var(--vscode-textSeparator-foreground);
            padding-bottom: 0.5em;
          }
          
          h2 {
            border-bottom: 1px solid var(--vscode-textSeparator-foreground);
            padding-bottom: 0.3em;
          }
          
          code {
            background-color: var(--vscode-textCodeBlock-background);
            color: var(--vscode-textPreformat-foreground);
            padding: 2px 6px;
            border-radius: 4px;
            font-family: var(--vscode-editor-font-family);
            font-size: calc(var(--vscode-editor-font-size) * 0.9);
          }
          
          pre {
            background-color: var(--vscode-textCodeBlock-background);
            padding: 12px;
            border-radius: 6px;
            overflow-x: auto;
            border: 1px solid var(--vscode-panel-border);
          }
          
          pre code {
            background: none;
            padding: 0;
            border-radius: 0;
          }
          
          blockquote {
            border-left: 4px solid var(--vscode-textBlockQuote-border);
            background-color: var(--vscode-textBlockQuote-background);
            margin: 0;
            padding: 8px 16px;
            color: var(--vscode-textPreformat-foreground);
          }
          
          .warning {
            background-color: var(--vscode-inputValidation-warningBackground);
            border: 1px solid var(--vscode-inputValidation-warningBorder);
            color: var(--vscode-inputValidation-warningForeground);
            padding: 12px;
            border-radius: 4px;
            margin: 12px 0;
          }
          
          .error {
            background-color: var(--vscode-inputValidation-errorBackground);
            border: 1px solid var(--vscode-inputValidation-errorBorder);
            color: var(--vscode-inputValidation-errorForeground);
            padding: 12px;
            border-radius: 4px;
            margin: 12px 0;
          }
          
          .info {
            background-color: var(--vscode-inputValidation-infoBackground);
            border: 1px solid var(--vscode-inputValidation-infoBorder);
            color: var(--vscode-inputValidation-infoForeground);
            padding: 12px;
            border-radius: 4px;
            margin: 12px 0;
          }
          
          a {
            color: var(--vscode-textLink-foreground);
            text-decoration: none;
          }
          
          a:hover {
            color: var(--vscode-textLink-activeForeground);
            text-decoration: underline;
          }
          
          ul, ol {
            padding-left: 24px;
          }
          
          li {
            margin-bottom: 4px;
          }
          
          table {
            border-collapse: collapse;
            width: 100%;
            margin: 12px 0;
          }
          
          th, td {
            border: 1px solid var(--vscode-panel-border);
            padding: 8px 12px;
            text-align: left;
          }
          
          th {
            background-color: var(--vscode-textCodeBlock-background);
            font-weight: bold;
          }
          
          .loading {
            text-align: center;
            padding: 40px;
            color: var(--vscode-descriptionForeground);
          }
          
          .action-button {
            background-color: var(--vscode-button-background);
            color: var(--vscode-button-foreground);
            border: none;
            padding: 8px 16px;
            border-radius: 4px;
            cursor: pointer;
            margin: 4px;
            text-decoration: none;
            display: inline-block;
          }
          
          .action-button:hover {
            background-color: var(--vscode-button-hoverBackground);
          }
          
          .emoji {
            font-size: 1.2em;
            margin-right: 0.5em;
          }
        </style>
      </head>
      <body>
        <div id="content">${content}</div>
        
        <script nonce="${nonce}">
          const vscode = acquireVsCodeApi();
          
          // Handle button clicks for commands
          document.addEventListener('click', (e) => {
            const target = e.target;
            if (target.classList.contains('action-button')) {
              const command = target.dataset.command;
              if (command) {
                vscode.postMessage({
                  command: 'runCommand',
                  commandId: command
                });
              }
            }
          });
        </script>
      </body>
      </html>
    `;
  }

  private getNonce(): string {
    let text = "";
    const possible =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    for (let i = 0; i < 32; i++) {
      text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
  }
}
