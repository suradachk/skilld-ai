# 🤖 skilld-ai

> **Production-grade AI Agent Team and Collaboration Framework CLI for modern software development.**

`skilld-ai` bootstraps a structured AI developer team (`/dc`, `/dev`, `/dvb`, `/dvf`, `/dta`, `/dtf`, `/qa`, `/ops`) and strict collaboration contracts (`AGENTS.md`, `docs/`) into any repository with zero configuration.

---

## 🚀 Quick Start

Initialize `skilld-ai` in your existing codebase or blank repository:

```bash
# Using npm
npx skilld-ai init

# Using pnpm
pnpm dlx skilld-ai init

# Using yarn
yarn dlx skilld-ai init
```

### 🔍 Codebase Architecture Scanner
Scan project structure (including Monorepos, frontend/backend splits) and inspect detected tech stack:

```bash
npx skilld-ai scan

# Or scan and auto-sync to docs/ARCHITECTURE.md
npx skilld-ai scan --update-docs
```

### 🩺 Health & Compliance Check
Run health check diagnostics anytime to ensure AI compliance and secret security:

```bash
npx skilld-ai doctor
```

### Supported AI Coding Environments
- **Antigravity**: Native `.agents/skills/*` with 8 slash commands
- **Cursor**: Auto-generated `.cursorrules`
- **GitHub Copilot**: Auto-generated `.github/copilot-instructions.md`
- **Claude Code**: Auto-generated `CLAUDE.md`
- **Git Security**: Pre-commit secret shield via `.husky/pre-commit`

---

## 🏛️ AI Agent Team Directory

| Command | Specialist Role | Focus Area |
| :---: | :--- | :--- |
| **`/dc`** | **Senior Consultant & Architect** | System design, trade-offs, architecture decisions (ADR) |
| **`/dev`** | **Lead Developer & Orchestrator** | Task breakdown, contract-first enforcement, quality gate audit |
| **`/dvb`** | **Backend Developer Specialist** | Database schema, API logic, migrations, typed env, health checks |
| **`/dta`** | **Live API & DB Testing Specialist** | Real HTTP testing, negative cases, database state inspection |
| **`/dvf`** | **Frontend Developer Specialist** | UI components, design systems, 4 UI states, MSW mocking |
| **`/dtf`** | **Live Frontend & UI Testing Specialist** | Viewport testing (375px), forms, console error audit |
| **`/qa`** | **QA & Test Automation Specialist** | Automated test suites (`*.spec.ts`), regression prevention |
| **`/ops`** | **DevOps & Cloud Specialist** | Docker, CI/CD, Git hooks, secret scanning |

---

## 📜 Non-Negotiable Constitution

1. **No Secrets in Code**: Zero credentials committed to Git.
2. **Contract-First**: Contracts in `docs/API_SPEC.md` locked before coding.
3. **No `any`**: Full type safety enforced across all layers.
4. **4 UI States**: Loading, Empty, Error, Success handled on all dynamic components.
5. **Caveman & Tables**: Clear, concise reporting using Markdown tables.
6. **Token Efficient**: Direct file edits, zero fluff in chat prompts.

---

## 📄 License

[MIT](LICENSE) © 2026 suradachk
