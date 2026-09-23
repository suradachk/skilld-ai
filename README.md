# 🤖 skilld

> **Production-grade AI Agent Team and Collaboration Framework CLI for modern software development.**

`skilld` bootstraps a structured AI developer team (`/dc`, `/dev`, `/dvb`, `/dvf`, `/dta`, `/dtf`, `/qa`, `/ops`) and strict collaboration contracts (`AGENTS.md`, `docs/`) into any repository with zero configuration.

---

## 🚀 Quick Start

Initialize `skilld` in your existing codebase or blank repository:

```bash
# Using npm
npx skilld init

# Using pnpm
pnpm dlx skilld init

# Using yarn
yarn dlx skilld init
```

### Modes
- **Brownfield (Existing Repo)**: Auto-scans `package.json`, framework, TypeScript, database/ORM, and package manager to populate `docs/` automatically.
- **Greenfield (Blank Repo)**: Interactive prompt asking for framework, database, and tech stack preferences.

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
