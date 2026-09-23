import { Command } from "commander";
import * as p from "@clack/prompts";
import pc from "picocolors";
import path from "node:path";
import fs from "fs-extra";
import { fileURLToPath } from "node:url";
import { detectProject, type ProjectContext } from "./scanner.js";
import { generateProjectDocs } from "./generator.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const program = new Command();

program
  .name("skilld-ai")
  .description("CLI scaffolding for AI Agent Team & Collaboration Framework")
  .version("0.1.0");

program
  .command("init")
  .description("Initialize AI Agent Team Constitution and Docs into project")
  .option("-y, --yes", "Skip interactive prompts and use defaults")
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
                  { value: "None", label: "None / Stateles" },
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

    s.stop("All files created successfully.");

    p.outro(
      pc.green("🎉 Skilld AI Framework ready!\n") +
        `• Constitution: ${pc.bold("AGENTS.md")}\n` +
        `• Agent Skills: ${pc.bold(".agents/skills/*")}\n` +
        `• System Docs : ${pc.bold("docs/*")}\n\n` +
        `Try invoking your team: ${pc.cyan("/dc")}, ${pc.cyan("/dev")}, ${pc.cyan("/dvb")}, ${pc.cyan("/dvf")}`
    );
  });

program.parse();
