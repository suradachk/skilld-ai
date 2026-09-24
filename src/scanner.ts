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

  // Scan candidates directories for frontend / backend
  const candidateDirs = [
    "frontend",
    "backend",
    "client",
    "server",
    "ui",
    "api",
    "web",
    "apps/web",
    "apps/frontend",
    "apps/api",
    "apps/backend",
    "apps/server",
    "packages/ui",
    "packages/api",
  ];

  const subApps: SubAppInfo[] = [];

  for (const relDir of candidateDirs) {
    const targetDir = path.join(cwd, relDir);
    const subPkg = path.join(targetDir, "package.json");
    if (await fileExists(subPkg)) {
      isExisting = true;
      try {
        const raw = await fs.readFile(subPkg, "utf-8");
        const data = JSON.parse(raw);
        const analyzed = analyzeDeps(data.dependencies, data.devDependencies, relDir);
        subApps.push({
          name: data.name || relDir,
          path: relDir,
          ...analyzed,
        });
      } catch {
        // Ignore malformed sub package.json
      }
    } else {
      // Check for Python / Go in subdirs
      if (await fileExists(path.join(targetDir, "requirements.txt")) || await fileExists(path.join(targetDir, "pyproject.toml"))) {
        isExisting = true;
        subApps.push({
          name: relDir,
          path: relDir,
          type: "backend",
          framework: "Python / FastAPI / Django",
          hasTypeScript: false,
        });
      } else if (await fileExists(path.join(targetDir, "go.mod"))) {
        isExisting = true;
        subApps.push({
          name: relDir,
          path: relDir,
          type: "backend",
          framework: "Go",
          hasTypeScript: false,
        });
      }
    }
  }

  // Analyze Root dependencies
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

  if (allDeps["next"]) {
    framework = "Next.js (Fullstack / React)";
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
  } else if (allDeps["react"]) {
    framework = "React";
    type = "frontend";
  } else if (allDeps["vue"]) {
    framework = "Vue";
    type = "frontend";
  } else if (allDeps["svelte"] || allDeps["@sveltejs/kit"]) {
    framework = "Svelte / SvelteKit";
    type = "frontend";
  }

  // Infer by directory name if not detected by dependencies
  if (type === "unknown") {
    const lower = contextName.toLowerCase();
    if (lower.includes("frontend") || lower.includes("client") || lower.includes("ui") || lower.includes("web")) {
      type = "frontend";
    } else if (lower.includes("backend") || lower.includes("server") || lower.includes("api")) {
      type = "backend";
    }
  }

  let database: string | undefined = undefined;
  if (allDeps["@prisma/client"] || allDeps["prisma"]) {
    database = "Prisma ORM";
  } else if (allDeps["drizzle-orm"]) {
    database = "Drizzle ORM";
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
