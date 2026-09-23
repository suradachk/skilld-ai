import fs from "node:fs/promises";
import path from "node:path";

export interface ProjectContext {
  isExisting: boolean;
  name: string;
  framework?: string;
  hasTypeScript: boolean;
  database?: string;
  packageManager?: string;
  hasOrm: boolean;
}

export async function detectProject(cwd: string): Promise<ProjectContext> {
  const packageJsonPath = path.join(cwd, "package.json");
  let isExisting = false;
  let pkgData: Record<string, any> = {};

  try {
    const raw = await fs.readFile(packageJsonPath, "utf-8");
    pkgData = JSON.parse(raw);
    isExisting = true;
  } catch {
    isExisting = false;
  }

  const allDeps = {
    ...(pkgData.dependencies || {}),
    ...(pkgData.devDependencies || {}),
  };

  let framework = "None / Custom";
  if (allDeps["next"]) framework = "Next.js";
  else if (allDeps["@nestjs/core"]) framework = "NestJS";
  else if (allDeps["express"]) framework = "Express";
  else if (allDeps["fastify"]) framework = "Fastify";
  else if (allDeps["react"]) framework = "React";
  else if (allDeps["vue"]) framework = "Vue";

  let database = "None";
  let hasOrm = false;
  if (allDeps["@prisma/client"] || allDeps["prisma"]) {
    database = "Prisma ORM";
    hasOrm = true;
  } else if (allDeps["drizzle-orm"]) {
    database = "Drizzle ORM";
    hasOrm = true;
  } else if (allDeps["mongoose"]) {
    database = "MongoDB (Mongoose)";
    hasOrm = true;
  } else if (allDeps["pg"]) {
    database = "PostgreSQL";
  }

  const hasTypeScript = Boolean(allDeps["typescript"]) || (await fileExists(path.join(cwd, "tsconfig.json")));

  let packageManager = "npm";
  if (await fileExists(path.join(cwd, "pnpm-lock.yaml"))) packageManager = "pnpm";
  else if (await fileExists(path.join(cwd, "yarn.lock"))) packageManager = "yarn";
  else if (await fileExists(path.join(cwd, "bun.lockb")) || await fileExists(path.join(cwd, "bun.lock"))) packageManager = "bun";

  return {
    isExisting,
    name: pkgData.name || path.basename(cwd),
    framework,
    hasTypeScript,
    database,
    packageManager,
    hasOrm,
  };
}

async function fileExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}
