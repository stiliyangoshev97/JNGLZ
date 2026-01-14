# 🎲 JNGLZ.FUN

> **Decentralized Prediction Market Launchpad on BNB Chain**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Solidity](https://img.shields.io/badge/Solidity-0.8.24-blue)](https://soliditylang.org/)
[![BNB Chain](https://img.shields.io/badge/Network-BNB%20Chain-yellow)](https://www.bnbchain.org/)

---

## 🌐 What is JNGLZ.FUN?

JNGLZ.FUN is a **fully decentralized, non-custodial prediction market launchpad** where anyone can:

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
- **DEGEN FLASH** - Maximum volatility for meme markets (0.005-0.1 BNB trades)
- **STREET FIGHT** - High action for trending topics (0.1-1.0 BNB trades)
- **WHALE POND** - Stable prices for serious predictions (1.0-5.0+ BNB trades)

### Fee Structure
| Fee | Amount | When | Recipient |
|-----|--------|------|-----------|
| Platform Fee | 1% | On every trade | Treasury |
| Creator Fee | 0.5% | On every trade | Market Creator |
| Resolution Fee | 0.3% | When claiming winnings | Treasury |
| Market Creation | FREE | - | - |

### Jury Fee Distribution (Disputes Only)
When a dispute occurs, the losing bonder forfeits their bond:
- **50%** → Winning bonder (proposer or disputer)
- **50%** → Split among winning voters (proportional to vote weight)

> ⚠️ **Note**: Resolution Fee (0.3%) and Jury Fees are **completely separate**:
> - **Resolution Fee**: Deducted from claim payouts → Treasury
> - **Jury Fees**: Come from loser's forfeited bond → Winners only

### Fee Example (With Dispute)
```
Market Pool: 10 BNB
Proposer Bond: 0.1 BNB (1% of pool)
Disputer Bond: 0.2 BNB (2× proposer)

If Disputer LOSES the vote:
├── 0.1 BNB (50% of 0.2) → Proposer (bond winner)
└── 0.1 BNB (50% of 0.2) → Voter Pool

Voter A: 1000 shares voted for Proposer
Voter B: 3000 shares voted for Proposer
Total winning votes: 4000 shares

Voter A gets: 0.1 × (1000/4000) = 0.025 BNB
Voter B gets: 0.1 × (3000/4000) = 0.075 BNB

SEPARATELY, when winners claim their pool share:
If you won 5 BNB from the pool:
└── 0.3% Resolution Fee: 0.015 BNB → Treasury
└── You receive: 4.985 BNB
```

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
| **Contract (v3.5.0)** | [`0x8e6c4437CAE7b9B78C593778cCfBD7C595Ce74a8`](https://testnet.bscscan.com/address/0x8e6c4437CAE7b9B78C593778cCfBD7C595Ce74a8) | ✅ Live |
| **Subgraph (v3.4.2)** | [The Graph Studio](https://thegraph.com/studio/subgraph/junkiefun-bnb-testnet) | ✅ Live |

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

JNGLZ.FUN is a **decentralized protocol**. All markets are user-created. You are interacting directly with smart contracts at your own risk. 

- This is NOT financial advice
- Prediction markets may be illegal in your jurisdiction
- Never invest more than you can afford to lose
- Past performance does not guarantee future results

---

## 📜 License

MIT License - see [LICENSE](LICENSE) for details.

---

## 🔗 Links

- **Website**: [jnglz.fun](https://jnglz.fun)
- **Twitter**: [@jnglzfun](https://x.com/jnglzfun)
- **GitHub**: [github.com/jnglz](https://github.com/jnglz)

---

Built with 🔥 by the JNGLZ team
