# JNGLZ.FUN - Workflow Rules

> **Read this file at the start of every chat session.**  
> These are the rules for how we work together on this project.

---

## 📁 Project Structure Rules

Each tech folder (frontend, contracts, subgraph) **MUST** have:

| File | Purpose |
|------|---------|
| `README.md` | Overview, setup instructions, architecture |
| `PROJECT_CONTEXT.md` | Current state, what's built, deployment status |
| `CHANGELOG.md` | Version history, what changed and when |
| `TO-DO-{TECH}.md` | Task tracker for that specific tech |
| `RUNBOOK.md` | Important commands, how to test, deploy, debug |

---

## 🌿 Git Branch Workflow

1. **Before starting any feature or code change:**
   - Create a new branch: `git checkout -b feature/short-description`
   
2. **After finishing work on a branch:**
   - Commit with a descriptive message
   - Push to remote: `git push origin branch-name`
   - I will create PR on GitHub and merge
   - I will delete the branch on GitHub
   - I will tell you when merge is complete
   
3. **After I confirm merge:**
   - Switch to main: `git checkout main`
   - Pull changes: `git pull origin main`
   - Prune deleted branches: `git fetch --prune`
   - Delete local branch: `git branch -d branch-name`

---

## 📝 Documentation Requirements

### Every Code Change Must Update:
- [ ] `CHANGELOG.md` - Add entry for what changed
- [ ] `PROJECT_CONTEXT.md` - Update current state
- [ ] `TO-DO-{TECH}.md` - Mark items complete, add new items
- [ ] `requirements.txt` - If new dependencies added (with versions!)

### Every File Must Have:
- **Solidity:** NatSpec comments (`@notice`, `@dev`, `@param`, `@return`)
- **TypeScript/React:** JSDoc comments with `@module`, `@description`, `@example`
- **GraphQL:** Descriptions for entities and fields

### Important Notes:
- **Only modify docs for the tech we're working on** (don't touch frontend docs when working on contracts)
- **PROJECT.md** is the non-technical roadmap - update if we change decisions about the app

---

## 🔧 Script Requirements

For any scripts that modify data:
- [ ] Always include a `--dry-run` option
- [ ] Dry run should show what WOULD happen without actually doing it
- [ ] Document usage in RUNBOOK.md

---

## 📦 Dependencies

When adding new packages/dependencies:

1. Add to `requirements.txt` with exact version:
   ```
   package-name        ^1.2.3         # Brief description of what it does
   ```

2. Update the relevant tech's README.md installation section

3. If it's a major dependency, note it in PROJECT.md tech stack section

---

## 🏗️ Tech Stack for This Project

| Layer | Tech | Notes |
|-------|------|-------|
| **Contracts** | Foundry, Solidity 0.8.24 | Single monolithic contract |
| **Oracle** | UMA OOv3 | Optimistic resolution with WBNB bond |
| **Indexing** | The Graph | Subgraph Studio on BNB Chain |
| **Frontend** | React 19, Vite, TypeScript | No Next.js |
| **Web3** | Wagmi v2, Viem, RainbowKit | BNB Chain (Testnet + Mainnet) |
| **State** | TanStack Query, Zustand | Query for server, Zustand for client |
| **Forms** | React Hook Form, Zod | Validation |
| **Styling** | Tailwind CSS | Variant-based approach, retrowave theme |
| **HTTP** | Axios | For any REST calls (minimal usage) |

---

## ❌ What We're NOT Using

- No Express backend
- No MongoDB
- No SIWE/JWT authentication (wallet-only)
- No Next.js (pure Vite SPA)

---

## 📋 File Naming Conventions

| Type | Convention | Example |
|------|------------|---------|
| Components | PascalCase | `MarketCard.tsx` |
| Hooks | camelCase with `use` prefix | `useMarkets.ts` |
| Utils | camelCase | `formatBnb.ts` |
| Types | PascalCase | `Market.types.ts` |
| Schemas | camelCase with `.schemas` | `market.schemas.ts` |
| API files | camelCase with `.api` | `markets.api.ts` |
| Contracts | PascalCase | `PredictionMarket.sol` |
| Tests | Same name + `.t.sol` or `.test.ts` | `PredictionMarket.t.sol` |
