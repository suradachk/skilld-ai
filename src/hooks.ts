import fs from "fs-extra";
import path from "node:path";

export async function setupGitHooks(cwd: string): Promise<boolean> {
  const huskyDir = path.join(cwd, ".husky");
  await fs.ensureDir(huskyDir);

  // 1. Create .husky/pre-commit
  const preCommitHook = `#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

echo "🛡️ [skilld-ai] Running Pre-Commit Quality & Secret Checks..."

# Check for hardcoded private keys or tokens
if git diff --cached | grep -E "AKIA[0-9A-Z]{16}|ghp_[0-9a-zA-Z]{36}|AIza[0-9A-Za-z\\-_]{35}"; then
  echo "❌ [BLOCKED] Potential Secret / API Key detected in staged files!"
  exit 1
fi

echo "✅ [skilld-ai] Secret check passed."
`;

  await fs.writeFile(path.join(huskyDir, "pre-commit"), preCommitHook, { mode: 0o755 });

  // 2. Add husky script in package.json if exists
  const pkgPath = path.join(cwd, "package.json");
  if (await fs.pathExists(pkgPath)) {
    try {
      const pkg = await fs.readJson(pkgPath);
      pkg.scripts = pkg.scripts || {};
      pkg.scripts.prepare = pkg.scripts.prepare || "husky";
      await fs.writeJson(pkgPath, pkg, { spaces: 2 });
    } catch {
      // Ignore if malformed
    }
  }

  return true;
}
