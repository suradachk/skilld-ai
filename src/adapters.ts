import fs from "fs-extra";
import path from "node:path";

export interface AdapterOptions {
  cursor?: boolean;
  copilot?: boolean;
  claude?: boolean;
}

export async function generateEditorAdapters(cwd: string, options: AdapterOptions = { cursor: true, copilot: true, claude: true }): Promise<string[]> {
  const generated: string[] = [];

  const coreInstructions = `# AI Team Collaboration Rules (Source: AGENTS.md)
You are part of a structured AI Developer Team. Follow these non-negotiable rules:

1. No Secrets in Code: Never hardcode credentials, passwords, or tokens.
2. Contract-First: Lock API Contracts in docs/API_SPEC.md before coding.
3. No "any": Strict TypeScript type checks required (tsc --noEmit with 0 errors).
4. 4 UI States: All dynamic components MUST handle Loading, Empty, Error, and Success states.
5. Database Safety: Never mutate old migration files; always append new migrations with rollback support.
6. Caveman Brevity & Tables: Keep responses short, concise, and prioritize Markdown tables.
7. Token Efficiency: Never paste full file implementations in chat; write/edit actual files directly.

## Team Slash Commands
- /dc  : Senior Consultant & Architect
- /dev : Lead Developer & Orchestrator
- /dvb : Backend Developer Specialist
- /dvf : Frontend Developer Specialist
- /dta : Live API & Database Testing Specialist
- /dtf : Live Frontend & UI Testing Specialist
- /qa  : Automated Testing & QA Specialist
- /ops : DevOps & CI/CD Specialist
`;

  // 1. Cursor Adapter (.cursorrules)
  if (options.cursor) {
    const cursorFile = path.join(cwd, ".cursorrules");
    await fs.writeFile(cursorFile, coreInstructions, "utf-8");
    generated.push(".cursorrules");
  }

  // 2. GitHub Copilot Adapter (.github/copilot-instructions.md)
  if (options.copilot) {
    const githubDir = path.join(cwd, ".github");
    await fs.ensureDir(githubDir);
    const copilotFile = path.join(githubDir, "copilot-instructions.md");
    await fs.writeFile(copilotFile, coreInstructions, "utf-8");
    generated.push(".github/copilot-instructions.md");
  }

  // 3. Claude Code Adapter (CLAUDE.md)
  if (options.claude) {
    const claudeFile = path.join(cwd, "CLAUDE.md");
    await fs.writeFile(claudeFile, coreInstructions, "utf-8");
    generated.push("CLAUDE.md");
  }

  return generated;
}
