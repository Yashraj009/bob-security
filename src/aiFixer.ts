// // In src/aiFixer.ts
// import * as vscode from "vscode";
// import Groq from "groq-sdk";
// import { logFix } from "./logger"; // Import the new logger function

// const GROQ_API_KEY_SECRET_ID =
//   "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";
// // Add this helper function inside src/aiFixer.ts

// /**
//  * Extracts a context-aware code snippet from a full file.
//  * @param fullCode The entire content of the file.
//  * @param lineNumber The line number of the detected issue (0-indexed).
//  * @param windowSize The number of lines to include before and after the issue.
//  * @returns A formatted string containing the necessary code context.
//  */
// export function extractCodeContext(
//   fullCode: string,
//   lineNumber: number,
//   windowSize: number = 15
// ): string {
//   const lines = fullCode.split("\n");

//   // 1. Extract all import statements
//   const imports = lines.filter(
//     (line) =>
//       line.trim().startsWith("import ") || line.trim().startsWith("from ")
//   );

//   // 2. Define the window for the issue
//   const start = Math.max(0, lineNumber - windowSize);
//   const end = Math.min(lines.length, lineNumber + windowSize + 1);

//   const codeWindow = lines.slice(start, end);

//   // 3. Find the enclosing function or class for broader context
//   let functionOrClassHeader = "";
//   for (let i = start - 1; i >= 0; i--) {
//     const line = lines[i].trim();
//     if (line.startsWith("def ") || line.startsWith("class ")) {
//       functionOrClassHeader = lines[i];
//       break;
//     }
//   }

//   // 4. Assemble the context snippet
//   let context = "--- Relevant Imports ---\n";
//   context += imports.join("\n") + "\n\n";

//   if (functionOrClassHeader) {
//     context += `--- Enclosing Function/Class ---\n${functionOrClassHeader}\n...\n\n`;
//   }

//   context += `--- Code Snippet (Error on line ${lineNumber + 1}) ---\n`;
//   context += codeWindow.join("\n");

//   return context;
// }

// // --- Groq API Key Management (remains the same) ---
// export async function getGroqApiKey(
//   secrets: vscode.SecretStorage
// ): Promise<string | undefined> {
//   return await secrets.get(GROQ_API_KEY_SECRET_ID);
// }

// export function setGroqApiKeyCommand(
//   secrets: vscode.SecretStorage
// ): vscode.Disposable {
//   return vscode.commands.registerCommand("bob-security.setApiKey", async () => {
//     const apiKey = await vscode.window.showInputBox({
//       prompt: "Enter your Groq API Key",
//       password: true,
//       ignoreFocusOut: true,
//       placeHolder: "Paste your key here",
//     });

//     if (apiKey) {
//       await secrets.store(GROQ_API_KEY_SECRET_ID, apiKey);
//       vscode.window.showInformationMessage("Groq API Key saved successfully!");
//     }
//   });
// }

// // --- Main AI Function (Updated for Context-Aware Snippets) ---
// // export async function getAiFix(
// //   fullFileContent: string,
// //   diagnostic: vscode.Diagnostic,
// //   secrets: vscode.SecretStorage
// // ): Promise<string | null> {
// //   const apiKey = await getGroqApiKey(secrets);
// //   if (!apiKey) {
// //     vscode.window.showErrorMessage(
// //       "Groq API key not set. Please run the 'Set API Key' command."
// //     );
// //     return null;
// //   }

// //   const groq = new Groq({ apiKey });
// //   const modelName = "llama-3.1-8b-instant";

// //   // --- NEW: Generate the context-aware snippet ---
// //   const issueLineNumber = diagnostic.range.start.line;
// //   const codeContext = extractCodeContext(fullFileContent, issueLineNumber);

// //   // --- NEW: A more advanced prompt ---
// //   const prompt = `You are an expert security code reviewer. Your task is to fix a security vulnerability in a Python code snippet.
// // The vulnerability is: "${diagnostic.message}"
// // The issue is on or near line ${issueLineNumber + 1} in the provided snippet.

// // Based on the context, provide a corrected version of the code snippet. Your response should ONLY be the corrected code, ready to replace the original snippet.

// // --- Code Context ---
// // ${codeContext}
// // --- End Code Context ---

// // Corrected Code Snippet:
// // `;

// //   try {
// //     console.log(`Attempting to get a snippet fix from Groq...`);
// //     const chatCompletion = await groq.chat.completions.create({
// //       messages: [{ role: "user", content: prompt }],
// //       model: modelName,
// //       temperature: 0.1,
// //       max_tokens: 1024,
// //     });

// //     const fixedCodeSnippet =
// //       chatCompletion.choices[0]?.message?.content?.trim() || null;

// //     // The AI now returns a snippet. The logic to apply it would be more complex
// //     // (e.g., replacing the function body). For now, we'll log it.
// //     // The command handler in extension.ts would need to be updated to handle this.
// //     if (fixedCodeSnippet) {
// //       logFix(
// //         fullFileContent.split("\n")[issueLineNumber],
// //         diagnostic.message,
// //         fixedCodeSnippet
// //       );
// //     }

// //     return fixedCodeSnippet;
// //   } catch (error) {
// //     // ... (error handling remains the same) ...
// //     const errorMessage =
// //       error instanceof Error ? error.message : "Unknown error";
// //     console.error("Groq API Error:", errorMessage);
// //     vscode.window.showErrorMessage(`Groq API Error: ${errorMessage}`);
// //     return null;
// //   }
// // }

// // --- NEW FUNCTION for Getting AI Analysis ---
// export async function getAiAnalysis(
//   codeContext: string,
//   diagnostic: vscode.Diagnostic,
//   secrets: vscode.SecretStorage
// ): Promise<string | null> {
//   const apiKey = await getGroqApiKey(secrets);
//   if (!apiKey) {
//     // Don't show an error, as the user might not have a key and just wants to see the UI
//     return "API key is not set. Please run the 'Set API Key' command to enable AI analysis.";
//   }

//   const groq = new Groq({ apiKey });
//   const modelName = "llama-3.1-8b-instant";

//   const prompt = `You are a security expert and a helpful programming tutor. Your task is to explain a security vulnerability found in a Python code snippet.
// The vulnerability is: "${diagnostic.message}"
// The issue is on or near line ${
//     diagnostic.range.start.line + 1
//   } in the provided snippet.

// Please provide a clear, concise explanation in Markdown format. Structure your response with the following sections:
// - ### What is this issue?
// - ### What is the risk?
// - ### How to fix it?

// Use the provided code context for your explanation.

// --- Code Context ---
// ${codeContext}
// --- End Code Context ---
// `;

//   try {
//     console.log(`Attempting to get analysis from Groq...`);
//     const chatCompletion = await groq.chat.completions.create({
//       messages: [{ role: "user", content: prompt }],
//       model: modelName,
//       temperature: 0.5,
//       max_tokens: 1024,
//     });

//     return (
//       chatCompletion.choices[0]?.message?.content?.trim() ||
//       "The AI could not provide an analysis."
//     );
//   } catch (error) {
//     // ... (error handling remains the same) ...
//     const errorMessage =
//       error instanceof Error ? error.message : "Unknown error";
//     console.error("Groq API Error:", errorMessage);
//     return `Error getting analysis: ${errorMessage}`;
//   }
// }

// // --- NEW: Define the structure of the AI's response ---
// export interface AiFixResponse {
//   imports_to_add: string[];
//   code_to_replace: string;
// }

// // --- Main AI Function (Updated for JSON Output) ---
// export async function getAiFix(
//   fullFileContent: string,
//   diagnostic: vscode.Diagnostic,
//   secrets: vscode.SecretStorage
// ): Promise<AiFixResponse | null> {
//   const apiKey = await getGroqApiKey(secrets);
//   if (!apiKey) {
//     vscode.window.showErrorMessage("Groq API key not set.");
//     return null;
//   }

//   const groq = new Groq({ apiKey });
//   const modelName = "llama-3.1-8b-instant";

//   // --- NEW: The prompt now demands a JSON response ---
//   const prompt = `You are an expert security code reviewer. Your task is to fix a security vulnerability in the provided Python code.
// The vulnerability is: "${diagnostic.message}"
// The issue is on or near line ${diagnostic.range.start.line + 1}.

// Analyze the entire file to determine the fix. The fix may require adding new import statements and replacing the vulnerable function.
// Respond with a JSON object containing two keys:
// 1.  "imports_to_add": An array of strings, where each string is a full import line that needs to be added (e.g., "from flask_login import login_required").
// 2.  "code_to_replace": A string containing the entire corrected function, including the new decorator.

// Example Response:
// {
//   "imports_to_add": ["from flask_login import login_required"],
//   "code_to_replace": "@login_required\\ndef admin_panel():\\n    return \\"Sensitive admin panel exposed\\""
// }

// Original Code:
// \`\`\`python
// ${fullFileContent}
// \`\`\`
// `;

//   try {
//     const chatCompletion = await groq.chat.completions.create({
//       messages: [{ role: "user", content: prompt }],
//       model: modelName,
//       temperature: 0.1,
//       max_tokens: 1024,
//       response_format: { type: "json_object" }, // Ask for JSON output
//     });

//     const jsonResponse = chatCompletion.choices[0]?.message?.content?.trim();
//     if (!jsonResponse) {
//       return null;
//     }

//     // Parse the JSON response
//     const parsedResponse: AiFixResponse = JSON.parse(jsonResponse);

//     const originalSnippet = fullFileContent
//       .split("\n")
//       .slice(diagnostic.range.start.line, diagnostic.range.end.line + 1)
//       .join("\n");
//     logFix(originalSnippet, diagnostic.message, parsedResponse.code_to_replace);

//     return parsedResponse;
//   } catch (error) {
//     const errorMessage =
//       error instanceof Error ? error.message : "Unknown error";
//     console.error("Groq API Error or JSON parsing failed:", errorMessage);
//     vscode.window.showErrorMessage(`Groq API Error: ${errorMessage}`);
//     return null;
//   }
// }

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

  // Extract the problematic code section
  const lines = fullFileContent.split("\n");
  const issueStartLine = diagnostic.range.start.line;
  const issueEndLine = diagnostic.range.end.line;
  const problematicCode = lines
    .slice(issueStartLine, issueEndLine + 1)
    .join("\n");

  const prompt = `You are an expert Python security engineer. Fix this security vulnerability by providing a JSON response.

**Security Issue:** ${diagnostic.message}
**Rule ID:** ${diagnostic.code}
**Problematic Code:**
\`\`\`python
${problematicCode}
\`\`\`

**Full File Context:**
\`\`\`python
${fullFileContent}
\`\`\`

Provide a JSON response with these exact keys:
1. "imports_to_add": Array of import statements needed (e.g., ["from flask_login import login_required"])
2. "code_to_replace": The fixed code that will replace the problematic section
3. "explanation": Brief explanation of what was changed and why

Requirements:
- Fix ONLY the security issue, don't make unrelated changes
- Ensure the fixed code maintains the same functionality
- Include proper imports if needed
- Use Python security best practices
- Keep variable names and logic as similar as possible to the original

Example response:
{
  "imports_to_add": ["import secrets"],
  "code_to_replace": "secure_token = secrets.token_hex(16)",
  "explanation": "Replaced insecure random.random() with cryptographically secure secrets.token_hex()"
}`;

  try {
    console.log(`Getting AI fix from Groq...`);
    const chatCompletion = await groq.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: modelName,
      temperature: 0.1, // Lower temperature for more deterministic fixes
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

      // Validate the response has required fields
      if (!parsedResponse.code_to_replace) {
        throw new Error("AI response missing 'code_to_replace' field");
      }

      // Ensure imports_to_add is an array
      if (!Array.isArray(parsedResponse.imports_to_add)) {
        parsedResponse.imports_to_add = [];
      }

      // Log the fix for debugging/analytics
      logFix(
        problematicCode,
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
