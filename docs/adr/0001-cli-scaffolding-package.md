# [ADR-0001] CLI Scaffolding Package Architecture (skilld)

## Status
Accepted

## Context & Problem Statement
ต้องการสร้างเครื่องมือ `skilld` เป็น npm/pnpm/yarn CLI Package เพื่อติดตั้ง AI Collaboration Framework (`AGENTS.md`, `.agents/skills/`, `docs/`) ลงในโปรเจกต์ของผู้ใช้ โดยต้องรองรับทั้ง:
1. **Existing Projects (Brownfield)**: สแกน Codebase เดิมแล้ว generate docs ให้ตรงกับโปรเจกต์จริงอัตโนมัติ
2. **New Projects (Greenfield)**: ถามโต้ตอบผ่าน CLI เพื่อ scaffold template ตั้งต้น

## Considered Options
1. **Shell Script (curl | bash)**: ง่าย แต่ cross-platform แย่ (Windows/Linux/macOS) และไม่มี interactive prompts ที่ดี
2. **Yeoman / Plop.js**: Heavyweight dependency เกินความจำเป็น
3. **TypeScript CLI ด้วย tsup + @clack/prompts + commander**: น้ำหนักเบา, bundle เร็วเป็น single executable node binary, รองรับ cross-platform เต็มรูปแบบ, ประสบการณ์ UI CLI สวยงาม

## Decision Outcome
เลือก **Option 3**: Node.js/TypeScript CLI Package
- **Bundler**: `tsup` (esbuild-based, dual ESM/CJS, bundle binary เป็น `dist/index.js`)
- **CLI Framework**: `commander` (parsing arguments/flags)
- **Interactive UI**: `@clack/prompts` + `picocolors` (ทันสมัย สวยงาม เหมือน Astro / Vite)
- **File System Utils**: `fs-extra` + `globby`

## Consequences
- **Positive**:
  - รันได้ทันทีผ่าน `npx skilld init` หรือ `pnpm dlx skilld init`
  - รองรับทั้ง Windows, macOS, Linux
  - สามารถสแกน `package.json`, schema ORM, และ routes ได้รวดเร็ว
- **Negative / Risks**:
  - ต้องดูแล dependencies ของ Node.js ให้ lean ที่สุดเพื่อความเร็วในการ download ผ่าน npx
