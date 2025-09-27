// In src/aiFixer.ts
import * as vscode from "vscode";
import Groq from "groq-sdk";
import { logFix } from "./logger";

// Use environment variable or secret storage for API key
const GROQ_API_KEY_SECRET_ID = "groq-api-key";

export interface AiFixResponse {
  imports_to_add: string[];
  code_to_replace: string;
  explanation?: string;
}

/**
 * Extracts a context-aware code snippet from a full file.
 */
export function extractCodeContext(
  fullCode: string,
  lineNumber: number,
  windowSize: number = 15
): string {
  const lines = fullCode.split("\n");

  // 1. Extract all import statements
  const imports = lines.filter(
    (line) =>
      line.trim().startsWith("import ") ||
      line.trim().startsWith("from ") ||
      line.trim().startsWith("__future__")
  );

  // 2. Define the window for the issue
  const start = Math.max(0, lineNumber - windowSize);
  const end = Math.min(lines.length, lineNumber + windowSize + 1);
  const codeWindow = lines.slice(start, end);

  // 3. Find the enclosing function or class for broader context
  let functionOrClassHeader = "";
  for (let i = Math.min(lineNumber, lines.length - 1); i >= 0; i--) {
    const line = lines[i].trim();
    if (
      line.startsWith("def ") ||
      line.startsWith("class ") ||
      line.startsWith("async def ")
    ) {
      functionOrClassHeader = lines[i];
      break;
    }
  }

  // 4. Assemble the context snippet
  let context = "=== RELEVANT IMPORTS ===\n";
  if (imports.length > 0) {
    context += imports.join("\n") + "\n";
  } else {
    context += "(No imports found)\n";
  }

  context += "\n";

  if (functionOrClassHeader) {
    context += `=== ENCLOSING FUNCTION/CLASS ===\n${functionOrClassHeader}\n    # ... (function body)\n\n`;
  }

  context += `=== CODE SNIPPET (Issue around line ${lineNumber + 1}) ===\n`;
  codeWindow.forEach((line, idx) => {
    const actualLineNum = start + idx + 1;
    const marker = start + idx === lineNumber ? " <<<< ISSUE HERE" : "";
    context += `${actualLineNum
      .toString()
      .padStart(3, " ")}: ${line}${marker}\n`;
  });

  return context;
}

// API Key Management
export async function getGroqApiKey(
  secrets: vscode.SecretStorage
): Promise<string | undefined> {
  return await secrets.get(GROQ_API_KEY_SECRET_ID);
}

export function setGroqApiKeyCommand(
  secrets: vscode.SecretStorage
): vscode.Disposable {
  return vscode.commands.registerCommand("bob-security.setApiKey", async () => {
    const apiKey = await vscode.window.showInputBox({
      prompt: "Enter your Groq API Key",
      password: true,
      ignoreFocusOut: true,
      placeHolder: "gsk_...",
      validateInput: (value) => {
        if (!value || value.trim().length === 0) {
          return "API key cannot be empty";
        }
        if (!value.startsWith("gsk_")) {
          return "Groq API keys typically start with 'gsk_'";
        }
        return undefined;
      },
    });

    if (apiKey) {
      await secrets.store(GROQ_API_KEY_SECRET_ID, apiKey.trim());
      vscode.window.showInformationMessage("Groq API Key saved successfully!");
    }
  });
}

// AI Analysis Function
export async function getAiAnalysis(
  codeContext: string,
  diagnostic: vscode.Diagnostic,
  secrets: vscode.SecretStorage
): Promise<string | null> {
  const apiKey = await getGroqApiKey(secrets);
  if (!apiKey) {
    return `# API Key Required

To enable AI-powered analysis, please set your Groq API key:

1. Get a free API key from [Groq Console](https://console.groq.com/keys)
2. Run the command: **AI Security Linter: Set Groq API Key**
3. Paste your API key when prompted

Once configured, you'll get detailed explanations of security issues and how to fix them.

## About This Issue

**Rule ID:** ${diagnostic.code || "Unknown"}  
**Severity:** ${
      diagnostic.severity === vscode.DiagnosticSeverity.Error
        ? "Error"
        : diagnostic.severity === vscode.DiagnosticSeverity.Warning
        ? "Warning"
        : "Info"
    }  
**Message:** ${diagnostic.message}

Please set up your API key to get detailed analysis and fix suggestions.`;
  }

  const groq = new Groq({ apiKey });
  const config = vscode.workspace.getConfiguration("aiSecurityLinter");
  const maxTokens = config.get("maxTokens", 1024);
  const modelName = "llama-3.1-8b-instant";

  const prompt = `You are a senior security engineer and code reviewer. Analyze this Python security vulnerability and provide a comprehensive explanation.

**Security Issue:** ${diagnostic.message}
**Rule ID:** ${diagnostic.code || "Unknown"}
**Line:** ${diagnostic.range.start.line + 1}

Please provide a detailed analysis in Markdown format with these sections:

## 🚨 What is this security issue?
Explain the vulnerability in clear, non-technical terms.

## ⚠️ What are the risks?
Detail the potential security risks and attack scenarios.

## 🔧 How to fix it?
Provide specific, actionable steps to resolve the issue.

## 📚 Best practices
Include general security best practices related to this issue.

## 🔍 Code analysis
Reference the specific code patterns that triggered this issue.

**Code Context:**
\`\`\`python
${codeContext}
\`\`\`

Keep your explanation clear, practical, and focused on helping developers understand and fix the security issue.`;

  try {
    console.log(`Getting security analysis from Groq...`);
    const chatCompletion = await groq.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: modelName,
      temperature: 0.3,
      max_tokens: maxTokens,
    });

    return (
      chatCompletion.choices[0]?.message?.content?.trim() ||
      "The AI could not provide an analysis. Please try again."
    );
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    console.error("Groq API Error:", errorMessage);
    return `# Analysis Error

Sorry, there was an error getting the AI analysis:

**Error:** ${errorMessage}

Please check:
- Your API key is valid
- You have sufficient API credits
- Your internet connection is stable

You can still see the basic issue information:
- **Rule:** ${diagnostic.code}
- **Message:** ${diagnostic.message}
- **Line:** ${diagnostic.range.start.line + 1}`;
  }
}

// Helper function to find the complete function range
function findFunctionRange(
  lines: string[],
  startLine: number
): { start: number; end: number } {
  // Find the start of the function (look for @decorators and def)
  let functionStart = startLine;

  // Look backwards for decorators
  for (let i = startLine - 1; i >= 0; i--) {
    const line = lines[i].trim();
    if (line.startsWith("@")) {
      functionStart = i;
    } else if (line === "" || line.startsWith("#")) {
      continue; // Skip empty lines and comments
    } else {
      break; // Stop if we hit non-decorator, non-empty line
    }
  }

  // Find the end of the function by looking for the next function/class/end of file
  let functionEnd = startLine;
  let indentLevel = -1;

  for (let i = startLine; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    if (trimmed === "") {
      continue;
    } // Skip empty lines

    const currentIndent = line.length - line.trimStart().length;

    if (i === startLine) {
      // This is the function definition line
      indentLevel = currentIndent;
      functionEnd = i;
    } else if (
      trimmed.startsWith("def ") ||
      trimmed.startsWith("class ") ||
      trimmed.startsWith("@")
    ) {
      // Check if this is at the same level or higher (less indented)
      if (currentIndent <= indentLevel) {
        break; // End of current function
      }
      functionEnd = i - 1;
    } else if (currentIndent > indentLevel) {
      // This is part of the function body
      functionEnd = i;
    } else if (currentIndent <= indentLevel && trimmed !== "") {
      // We've reached the end of the function
      break;
    }
  }

  // If we reached the end of file, include it
  if (functionEnd === startLine) {
    // Single line function or need to find the actual end
    for (let i = startLine + 1; i < lines.length; i++) {
      const line = lines[i];
      const trimmed = line.trim();
      if (trimmed === "") {
        continue;
      }

      const currentIndent = line.length - line.trimStart().length;
      if (
        currentIndent > indentLevel ||
        (i === startLine + 1 && trimmed !== "")
      ) {
        functionEnd = i;
      } else {
        break;
      }
    }
  }

  return { start: functionStart, end: functionEnd };
}

// AI Fix Function
export async function getAiFix(
  fullFileContent: string,
  diagnostic: vscode.Diagnostic,
  secrets: vscode.SecretStorage
): Promise<AiFixResponse | null> {
  const apiKey = await getGroqApiKey(secrets);
  if (!apiKey) {
    vscode.window.showErrorMessage(
      "Groq API key not set. Please run 'AI Security Linter: Set Groq API Key' command first."
    );
    return null;
  }

  const groq = new Groq({ apiKey });
  const config = vscode.workspace.getConfiguration("aiSecurityLinter");
  const maxTokens = config.get("maxTokens", 1024);
  const modelName = "llama-3.1-8b-instant";

  // Extract the complete function including decorators
  const lines = fullFileContent.split("\n");
  const issueStartLine = diagnostic.range.start.line;

  // Find the complete function range
  const functionRange = findFunctionRange(lines, issueStartLine);
  const completeFunction = lines
    .slice(functionRange.start, functionRange.end + 1)
    .join("\n");

  const prompt = `You are an expert Python security engineer. Fix this Flask security vulnerability.

**Security Issue:** ${diagnostic.message}
**Rule ID:** ${diagnostic.code}

**Complete Function to Fix:**
\`\`\`python
${completeFunction}
\`\`\`

**Full File Context:**
\`\`\`python
${fullFileContent}
\`\`\`

This appears to be a Flask route missing authorization. You need to:
1. Add the appropriate security decorator (like @login_required)
2. Add any necessary imports
3. Keep the function logic exactly the same

Provide a JSON response with these exact keys:
1. "imports_to_add": Array of import statements needed (e.g., ["from flask_login import login_required"])
2. "code_to_replace": The COMPLETE fixed function including all decorators and the function body
3. "explanation": Brief explanation of what was changed and why

Example response:
{
  "imports_to_add": ["from flask_login import login_required"],
  "code_to_replace": "@login_required\\n@app.route('/admin')\\ndef admin_panel():\\n    return 'Sensitive admin panel exposed'",
  "explanation": "Added @login_required decorator to protect the admin route from unauthorized access"
}

IMPORTANT: The "code_to_replace" must include the complete function with proper indentation and newlines (use \\n for line breaks).`;

  try {
    console.log(`Getting AI fix from Groq...`);
    const chatCompletion = await groq.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: modelName,
      temperature: 0.1,
      max_tokens: maxTokens,
      response_format: { type: "json_object" },
    });

    const jsonResponse = chatCompletion.choices[0]?.message?.content?.trim();
    if (!jsonResponse) {
      vscode.window.showErrorMessage(
        "AI did not provide a response. Please try again."
      );
      return null;
    }

    try {
      const parsedResponse: AiFixResponse = JSON.parse(jsonResponse);

      if (!parsedResponse.code_to_replace) {
        throw new Error("AI response missing 'code_to_replace' field");
      }

      if (!Array.isArray(parsedResponse.imports_to_add)) {
        parsedResponse.imports_to_add = [];
      }

      // Store the complete function range for replacement
      (parsedResponse as any).functionRange = functionRange;

      logFix(
        completeFunction,
        diagnostic.message,
        parsedResponse.code_to_replace
      );
      return parsedResponse;
    } catch (parseError) {
      console.error("Failed to parse AI response as JSON:", parseError);
      console.error("Raw AI response:", jsonResponse);
      vscode.window.showErrorMessage(
        "AI provided an invalid response format. Please try again."
      );
      return null;
    }
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    console.error("Groq API Error:", errorMessage);
    vscode.window.showErrorMessage(`AI Fix Error: ${errorMessage}`);
    return null;
  }
}
