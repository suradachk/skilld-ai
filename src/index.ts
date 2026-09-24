import { Command } from "commander";
import * as p from "@clack/prompts";
import pc from "picocolors";
import path from "node:path";
import fs from "fs-extra";
import { fileURLToPath } from "node:url";
import { detectProject } from "./scanner.js";
import { generateProjectDocs } from "./generator.js";
import { generateEditorAdapters } from "./adapters.js";
import { setupGitHooks } from "./hooks.js";
import { runHealthCheck } from "./doctor.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const program = new Command();

program
  .name("skilld-ai")
  .description("CLI scaffolding for AI Agent Team & Collaboration Framework")
  .version("0.2.0");

program
  .command("init")
  .description("Initialize AI Agent Team Constitution, Docs, Editor Adapters, and Git Hooks")
  .option("-y, --yes", "Skip interactive prompts and use defaults")
  .option("--no-adapters", "Do not generate editor rules (.cursorrules, CLAUDE.md, etc.)")
  .option("--no-hooks", "Do not install pre-commit git hooks")
  .action(async (options) => {
    p.intro(pc.bgCyan(pc.black(" skilld-ai - AI Agent Team Framework ")));

    const cwd = process.cwd();
    const s = p.spinner();

    s.start("Scanning project context...");
    let ctx = await detectProject(cwd);
    s.stop("Project scanned.");

    if (ctx.isExisting) {
      p.note(
        `Found existing project: ${pc.bold(ctx.name)}\n` +
          `• Framework : ${pc.green(ctx.framework || "Custom")}\n` +
          `• TypeScript: ${ctx.hasTypeScript ? pc.green("Yes") : pc.yellow("No")}\n` +
          `• Database  : ${pc.cyan(ctx.database || "None")}\n` +
          `• PkgManager: ${pc.magenta(ctx.packageManager || "npm")}`,
        "Auto-Detected Project"
      );
    } else {
      p.log.info(pc.yellow("No existing project configuration detected (Blank Workspace)."));
      if (!options.yes) {
        const answers = await p.group(
          {
            name: () =>
              p.text({
                message: "What is your project name?",
                defaultValue: path.basename(cwd),
                placeholder: path.basename(cwd),
              }),
            framework: () =>
              p.select({
                message: "Select your primary framework:",
                options: [
                  { value: "Next.js", label: "Next.js (React Fullstack)" },
                  { value: "NestJS", label: "NestJS (Node Backend)" },
                  { value: "FastAPI", label: "FastAPI (Python Backend)" },
                  { value: "Custom / Pure TS", label: "Custom / Pure TypeScript" },
                ],
              }),
            database: () =>
              p.select({
                message: "Select your database layer:",
                options: [
                  { value: "PostgreSQL (Prisma)", label: "PostgreSQL with Prisma ORM" },
                  { value: "PostgreSQL (Drizzle)", label: "PostgreSQL with Drizzle ORM" },
                  { value: "MongoDB", label: "MongoDB" },
                  { value: "None", label: "None / Stateless" },
                ],
              }),
          },
          {
            onCancel: () => {
              p.cancel("Operation cancelled.");
              process.exit(0);
            },
          }
        );

        ctx = {
          isExisting: false,
          name: answers.name as string,
          framework: answers.framework as string,
          hasTypeScript: true,
          database: answers.database as string,
          packageManager: "pnpm",
          hasOrm: true,
        };
      }
    }

    s.start("Generating AI constitution, skills, and docs...");

    // Copy AGENTS.md
    const rootAgentsFile = path.resolve(__dirname, "../AGENTS.md");
    const targetAgentsFile = path.join(cwd, "AGENTS.md");
    if (path.resolve(rootAgentsFile) !== path.resolve(targetAgentsFile) && (await fs.pathExists(rootAgentsFile))) {
      await fs.copy(rootAgentsFile, targetAgentsFile);
    }

    // Copy .agents/skills if available
    const rootSkillsDir = path.resolve(__dirname, "../.agents");
    const targetSkillsDir = path.join(cwd, ".agents");
    if (path.resolve(rootSkillsDir) !== path.resolve(targetSkillsDir) && (await fs.pathExists(rootSkillsDir))) {
      await fs.copy(rootSkillsDir, targetSkillsDir);
    }

    // Generate docs/
    await generateProjectDocs(cwd, ctx);

    // Generate Editor Adapters (.cursorrules, CLAUDE.md, etc.)
    if (options.adapters !== false) {
      await generateEditorAdapters(cwd);
    }

    // Setup Git Hooks
    if (options.hooks !== false && (await fs.pathExists(path.join(cwd, ".git")))) {
      await setupGitHooks(cwd);
    }

    s.stop("All files created successfully.");

    p.outro(
      pc.green("🎉 Skilld AI Framework ready!\n") +
        `• Constitution: ${pc.bold("AGENTS.md")}\n` +
        `• Agent Skills: ${pc.bold(".agents/skills/*")}\n` +
        `• System Docs : ${pc.bold("docs/*")}\n` +
        `• Editor Rules: ${pc.bold(".cursorrules, CLAUDE.md, copilot-instructions.md")}\n` +
        `• Secret Guard: ${pc.bold(".husky/pre-commit")}\n\n` +
        `Try invoking your team: ${pc.cyan("/dc")}, ${pc.cyan("/dev")}, ${pc.cyan("/dvb")}, ${pc.cyan("/dvf")}`
    );
  });

program
  .command("doctor")
  .description("Run diagnostics and health check on AI team compliance and security")
  .action(async () => {
    p.intro(pc.bgMagenta(pc.white(" skilld-ai Doctor: Project Health & Compliance ")));

    const cwd = process.cwd();
    const s = p.spinner();
    s.start("Running diagnostics...");
    const diagnostics = await runHealthCheck(cwd);
    s.stop("Diagnostics completed.");

    console.log("");
    console.log(
      `| Category | Check Item | Status | Details |`
    );
    console.log(
      `| :--- | :--- | :---: | :--- |`
    );

    let hasErrors = false;
    for (const item of diagnostics) {
      const icon = item.status === "pass" ? pc.green("PASS") : item.status === "warn" ? pc.yellow("WARN") : pc.red("FAIL");
      if (item.status === "fail") hasErrors = true;
      console.log(`| ${item.category} | ${item.name} | ${icon} | ${item.message} |`);
    }

    console.log("");
    if (hasErrors) {
      p.outro(pc.red("❌ Some critical compliance checks failed! Please review the table above."));
      process.exit(1);
    } else {
      p.outro(pc.green("✅ All core AI team compliance checks passed!"));
    }
  });

program.parse();
