import fs from "fs-extra";
import path from "node:path";
import pc from "picocolors";

export interface DiagnosticItem {
  category: string;
  name: string;
  status: "pass" | "warn" | "fail";
  message: string;
}

export async function runHealthCheck(cwd: string): Promise<DiagnosticItem[]> {
  const results: DiagnosticItem[] = [];

  // Check 1: Constitution & Docs
  const requiredDocs = [
    { file: "AGENTS.md", name: "AI Team Constitution" },
    { file: "docs/ARCHITECTURE.md", name: "System Architecture" },
    { file: "docs/API_SPEC.md", name: "API Data Contracts" },
    { file: "docs/TASK_LIST.md", name: "Task List" },
    { file: "docs/CODING_STANDARDS.md", name: "Coding Standards" },
  ];

  for (const doc of requiredDocs) {
    const exists = await fs.pathExists(path.join(cwd, doc.file));
    results.push({
      category: "Documentation",
      name: doc.name,
      status: exists ? "pass" : "fail",
      message: exists ? `Found ${doc.file}` : `Missing ${doc.file} (Run npx skilld-ai init)`,
    });
  }

  // Check 2: Editor Adapters
  const adapters = [
    { file: ".cursorrules", name: "Cursor Editor Rules" },
    { file: ".github/copilot-instructions.md", name: "GitHub Copilot Instructions" },
    { file: "CLAUDE.md", name: "Claude Code Rules" },
  ];

  for (const adapter of adapters) {
    const exists = await fs.pathExists(path.join(cwd, adapter.file));
    results.push({
      category: "Editor Adapters",
      name: adapter.name,
      status: exists ? "pass" : "warn",
      message: exists ? `Found ${adapter.file}` : `Optional: ${adapter.file} not configured`,
    });
  }

  // Check 3: Git & Pre-commit Hooks
  const hasGit = await fs.pathExists(path.join(cwd, ".git"));
  results.push({
    category: "Version Control",
    name: "Git Repository",
    status: hasGit ? "pass" : "fail",
    message: hasGit ? "Git initialized" : "Missing .git directory",
  });

  const hasHooks = await fs.pathExists(path.join(cwd, ".husky"));
  results.push({
    category: "Security",
    name: "Pre-Commit Secret Shield",
    status: hasHooks ? "pass" : "warn",
    message: hasHooks ? "Husky hooks installed" : "No pre-commit secret shield found",
  });

  // Check 4: Potential Secret Leaks in .env files committed to git
  const envFileExists = await fs.pathExists(path.join(cwd, ".env"));
  const gitignoreExists = await fs.pathExists(path.join(cwd, ".gitignore"));
  let envIgnored = false;
  if (gitignoreExists) {
    const gitignoreContent = await fs.readFile(path.join(cwd, ".gitignore"), "utf-8");
    envIgnored = gitignoreContent.includes(".env");
  }

  if (envFileExists && !envIgnored) {
    results.push({
      category: "Security",
      name: "Environment Secrets Protection",
      status: "fail",
      message: ".env exists but is NOT listed in .gitignore! High risk of credential leak.",
    });
  } else {
    results.push({
      category: "Security",
      name: "Environment Secrets Protection",
      status: "pass",
      message: ".env is properly protected or not present.",
    });
  }

  return results;
}
