import fs from "node:fs/promises";
import path from "node:path";

export interface SubAppInfo {
  name: string;
  path: string;
  type: "frontend" | "backend" | "shared" | "unknown";
  framework: string;
  database?: string;
  hasTypeScript: boolean;
}

export interface ProjectContext {
  isExisting: boolean;
  name: string;
  isMonorepo: boolean;
  framework?: string;
  frontend?: SubAppInfo;
  backend?: SubAppInfo;
  subApps: SubAppInfo[];
  hasTypeScript: boolean;
  database?: string;
  packageManager?: string;
  hasOrm: boolean;
}

// Ignore directories that should never be scanned
const IGNORED_DIRS = new Set([
  "node_modules",
  ".git",
  "dist",
  "build",
  ".next",
  ".output",
  ".cache",
  "vendor",
  "target",
  "bin",
  "obj",
  ".husky",
  ".idea",
  ".vscode",
]);

/**
 * Dynamic Glob Scanner:
 * Crawls directory recursively (up to maxDepth) to find all sub-projects (package.json, go.mod, requirements.txt)
 */
async function findSubProjects(dir: string, baseDir: string, currentDepth = 0, maxDepth = 4): Promise<string[]> {
  if (currentDepth > maxDepth) return [];

  const found: string[] = [];

  try {
    const entries = await fs.readdir(dir, { withFileTypes: true });

    for (const entry of entries) {
      if (!entry.isDirectory()) continue;
      if (IGNORED_DIRS.has(entry.name) || entry.name.startsWith(".")) continue;

      const fullSubPath = path.join(dir, entry.name);
      const relPath = path.relative(baseDir, fullSubPath).replace(/\\/g, "/");

      // Check if this directory is a project root
      const hasPkg = await fileExists(path.join(fullSubPath, "package.json"));
      const hasGo = await fileExists(path.join(fullSubPath, "go.mod"));
      const hasPy = (await fileExists(path.join(fullSubPath, "requirements.txt"))) || (await fileExists(path.join(fullSubPath, "pyproject.toml")));
      const hasCargo = await fileExists(path.join(fullSubPath, "Cargo.toml"));

      if (hasPkg || hasGo || hasPy || hasCargo) {
        found.push(relPath);
      }

      // Continue scanning deeper (e.g. apps/web, services/user-api)
      const deeper = await findSubProjects(fullSubPath, baseDir, currentDepth + 1, maxDepth);
      found.push(...deeper);
    }
  } catch {
    // Ignore permission or unreadable errors
  }

  return found;
}

export async function detectProject(cwd: string): Promise<ProjectContext> {
  const rootPkgPath = path.join(cwd, "package.json");
  let isExisting = false;
  let rootPkgData: Record<string, any> = {};

  try {
    const raw = await fs.readFile(rootPkgPath, "utf-8");
    rootPkgData = JSON.parse(raw);
    isExisting = true;
  } catch {
    isExisting = false;
  }

  // 1. Dynamic Deep Scan: Find all subdirectories containing project manifests
  const detectedPaths = await findSubProjects(cwd, cwd);
  const subApps: SubAppInfo[] = [];

  for (const relDir of detectedPaths) {
    const targetDir = path.join(cwd, relDir);
    const subPkg = path.join(targetDir, "package.json");

    if (await fileExists(subPkg)) {
      isExisting = true;
      try {
        const raw = await fs.readFile(subPkg, "utf-8");
        const data = JSON.parse(raw);
        const analyzed = analyzeDeps(data.dependencies, data.devDependencies, relDir);
        subApps.push({
          name: data.name || path.basename(relDir),
          path: relDir,
          ...analyzed,
        });
      } catch {
        // Ignore JSON syntax error
      }
    } else if (await fileExists(path.join(targetDir, "requirements.txt")) || await fileExists(path.join(targetDir, "pyproject.toml"))) {
      isExisting = true;
      subApps.push({
        name: path.basename(relDir),
        path: relDir,
        type: "backend",
        framework: "Python (FastAPI / Django)",
        hasTypeScript: false,
      });
    } else if (await fileExists(path.join(targetDir, "go.mod"))) {
      isExisting = true;
      subApps.push({
        name: path.basename(relDir),
        path: relDir,
        type: "backend",
        framework: "Go",
        hasTypeScript: false,
      });
    } else if (await fileExists(path.join(targetDir, "Cargo.toml"))) {
      isExisting = true;
      subApps.push({
        name: path.basename(relDir),
        path: relDir,
        type: "backend",
        framework: "Rust",
        hasTypeScript: false,
      });
    }
  }

  // 2. Analyze Root dependencies
  const rootAnalyzed = analyzeDeps(rootPkgData.dependencies, rootPkgData.devDependencies, "root");

  let frontend = subApps.find((app) => app.type === "frontend");
  let backend = subApps.find((app) => app.type === "backend");

  if (!frontend && rootAnalyzed.type === "frontend") {
    frontend = { name: rootPkgData.name || "root", path: ".", ...rootAnalyzed };
  }
  if (!backend && rootAnalyzed.type === "backend") {
    backend = { name: rootPkgData.name || "root", path: ".", ...rootAnalyzed };
  }

  const isMonorepo = subApps.length > 0 || Boolean(rootPkgData.workspaces);

  let packageManager = "npm";
  if (await fileExists(path.join(cwd, "pnpm-lock.yaml")) || await fileExists(path.join(cwd, "pnpm-workspace.yaml"))) packageManager = "pnpm";
  else if (await fileExists(path.join(cwd, "yarn.lock"))) packageManager = "yarn";
  else if (await fileExists(path.join(cwd, "bun.lockb")) || await fileExists(path.join(cwd, "bun.lock"))) packageManager = "bun";

  const allDbs = [
    rootAnalyzed.database,
    backend?.database,
    ...subApps.map((a) => a.database),
  ].filter(Boolean) as string[];

  const database = allDbs.length > 0 ? Array.from(new Set(allDbs)).join(", ") : "None";
  const hasOrm = database.includes("ORM") || database.includes("Prisma") || database.includes("Drizzle");
  const hasTypeScript = rootAnalyzed.hasTypeScript || subApps.some((a) => a.hasTypeScript) || (await fileExists(path.join(cwd, "tsconfig.json")));

  return {
    isExisting,
    name: rootPkgData.name || path.basename(cwd),
    isMonorepo,
    framework: rootAnalyzed.framework !== "None / Custom" ? rootAnalyzed.framework : undefined,
    frontend,
    backend,
    subApps,
    hasTypeScript,
    database,
    packageManager,
    hasOrm,
  };
}

function analyzeDeps(
  deps: Record<string, string> = {},
  devDeps: Record<string, string> = {},
  contextName: string
): { type: "frontend" | "backend" | "shared" | "unknown"; framework: string; database?: string; hasTypeScript: boolean } {
  const allDeps = { ...deps, ...devDeps };

  let type: "frontend" | "backend" | "shared" | "unknown" = "unknown";
  let framework = "None / Custom";

  // Framework Detection
  if (allDeps["next"]) {
    framework = "Next.js";
    type = "frontend";
  } else if (allDeps["@nestjs/core"]) {
    framework = "NestJS";
    type = "backend";
  } else if (allDeps["express"]) {
    framework = "Express";
    type = "backend";
  } else if (allDeps["fastify"]) {
    framework = "Fastify";
    type = "backend";
  } else if (allDeps["@hono/node-server"] || allDeps["hono"]) {
    framework = "Hono";
    type = "backend";
  } else if (allDeps["react"]) {
    framework = "React (Vite / SPA)";
    type = "frontend";
  } else if (allDeps["vue"]) {
    framework = "Vue";
    type = "frontend";
  } else if (allDeps["svelte"] || allDeps["@sveltejs/kit"]) {
    framework = "SvelteKit";
    type = "frontend";
  } else if (allDeps["nuxt"]) {
    framework = "Nuxt.js";
    type = "frontend";
  }

  // Fallback heuristic by folder name
  if (type === "unknown") {
    const lower = contextName.toLowerCase();
    if (lower.includes("frontend") || lower.includes("client") || lower.includes("ui") || lower.includes("web") || lower.includes("app")) {
      type = "frontend";
    } else if (lower.includes("backend") || lower.includes("server") || lower.includes("api") || lower.includes("service")) {
      type = "backend";
    }
  }

  // Database / ORM Detection
  let database: string | undefined = undefined;
  if (allDeps["@prisma/client"] || allDeps["prisma"]) {
    database = "Prisma ORM";
  } else if (allDeps["drizzle-orm"]) {
    database = "Drizzle ORM";
  } else if (allDeps["typeorm"]) {
    database = "TypeORM";
  } else if (allDeps["mongoose"]) {
    database = "MongoDB (Mongoose)";
  } else if (allDeps["pg"]) {
    database = "PostgreSQL";
  } else if (allDeps["mysql2"]) {
    database = "MySQL";
  } else if (allDeps["better-sqlite3"] || allDeps["sqlite3"]) {
    database = "SQLite";
  }

  const hasTypeScript = Boolean(allDeps["typescript"]);

  return { type, framework, database, hasTypeScript };
}

async function fileExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}
