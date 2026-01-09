# 🎲 JunkieFun

> **Decentralized Prediction Markets on BNB Chain**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Solidity](https://img.shields.io/badge/Solidity-0.8.24-blue)](https://soliditylang.org/)
[![BNB Chain](https://img.shields.io/badge/Network-BNB%20Chain-yellow)](https://www.bnbchain.org/)

---

## 🌐 What is JunkieFun?

JunkieFun is a **fully decentralized, non-custodial prediction market protocol** where anyone can:

- 🎯 **Create Markets** - Ask any yes/no prediction question (FREE)
- 📈 **Trade on a Bonding Curve** - Buy/sell YES or NO shares with BNB
- 🗳️ **Street Consensus Resolution** - Markets resolved by shareholder voting, not central oracles
- 💰 **Claim Winnings** - Winners get proportional payouts from the pool

**No KYC. No accounts. No permissions. Just connect your wallet.**

---

## 🔥 Key Features

### Pump.fun Economics
Early buyers profit when later buyers enter. Creates viral FOMO loops and excitement.

### Street Consensus
Markets aren't resolved by a central authority. Shareholders vote on outcomes:
1. **Propose** - Post bond with your claimed outcome
2. **Dispute** - Challenge with 2× bond if you disagree
3. **Vote** - Shareholders vote weighted by position size
4. **Finalize** - Majority wins. Losers forfeit bonds.

### Heat Levels (v3.1.0)
Markets can have different volatility levels:
- ☢️ **DEGEN FLASH** - Maximum volatility for meme markets (0.005-0.1 BNB trades)
- 🔥 **STREET FIGHT** - High action for trending topics (0.1-1.0 BNB trades)
- 🧊 **WHALE POND** - Stable prices for serious predictions (1.0-5.0+ BNB trades)

### Fee Structure
| Fee | Amount | Recipient |
|-----|--------|-----------|
| Platform Fee | 1% | Treasury |
| Creator Fee | 0.5% | Market Creator |
| Resolution Fee | 0.3% | Treasury |
| Market Creation | FREE | - |

---

## 📁 Project Structure

```
JunkieDotFun/
├── contracts/          # Solidity smart contracts (Foundry)
│   ├── src/           # PredictionMarket.sol
│   └── test/          # 173 tests (Foundry)
├── frontend/          # React 19 + Vite + Wagmi
│   └── src/           # TypeScript frontend
├── subgraph/          # The Graph indexer
│   └── src/           # AssemblyScript mappings
├── PROJECT.md         # Complete technical blueprint
├── TODO.md            # Development checklist
└── AI-PROMPTS.txt     # Prompts for AI assistants
```

---

## 🚀 Deployments

### BNB Testnet (Current)

| Component | Address/URL | Status |
|-----------|-------------|--------|
| **Contract (v3.2.0)** | TBD | ⏳ Pending |
| **Contract (v3.1.0)** | `0x4C1508BA973856125a4F42c343560DB918c9EB2b` | ⚠️ DEPRECATED |
| **Subgraph (v0.0.3)** | [The Graph Studio](https://thegraph.com/studio/subgraph/junkiefun-bnb-testnet) | ⚠️ Needs Update |

> ⚠️ **v3.1.0 has a critical bug** - see [contracts/CHANGELOG.md](contracts/CHANGELOG.md) for details.

---

## 🛠️ Development

### Prerequisites
- Node.js 18+
- Foundry (for contracts)
- pnpm or npm

### Contracts
```bash
cd contracts
forge build
forge test
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

### Subgraph
```bash
cd subgraph
npm install
npm run codegen
npm run build
```

---

## 📊 Tech Stack

| Layer | Technology |
|-------|------------|
| **Blockchain** | BNB Chain (BSC) |
| **Smart Contracts** | Solidity 0.8.24, Foundry |
| **Frontend** | React 19, Vite, TypeScript |
| **Web3** | Wagmi v3, viem, RainbowKit |
| **Indexing** | The Graph (AssemblyScript) |
| **Styling** | Tailwind CSS |

---

## ⚠️ Disclaimer

JunkieFun is a **decentralized protocol**. All markets are user-created. You are interacting directly with smart contracts at your own risk. 

- This is NOT financial advice
- Prediction markets may be illegal in your jurisdiction
- Never invest more than you can afford to lose
- Past performance does not guarantee future results

---

## 📜 License

MIT License - see [LICENSE](LICENSE) for details.

---

## 🔗 Links

- **Website**: [junkiefun.xyz](https://junkiefun.xyz) (coming soon)
- **Twitter**: [@junkiefun](https://twitter.com/junkiefun)
- **GitHub**: [github.com/junkiefun](https://github.com/junkiefun)

---

Built with 💊 by the JunkieFun team
