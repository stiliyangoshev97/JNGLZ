<div align="center">

# 🦁 JNGLZ.FUN

### **Decentralized Prediction Market Launchpad**

*Where the crowd decides the truth.*

[![BNB Chain](https://img.shields.io/badge/BNB%20Chain-Mainnet-F0B90B?style=for-the-badge&logo=binance&logoColor=white)](https://bscscan.com/address/0xA482Ac7acbf846F2DAEE8b8dF3D7e77F85CC7528)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](https://opensource.org/licenses/MIT)
[![Solidity](https://img.shields.io/badge/Solidity-0.8.24-363636?style=for-the-badge&logo=solidity)](https://soliditylang.org/)
[![React](https://img.shields.io/badge/React-19.0-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![The Graph](https://img.shields.io/badge/The%20Graph-Indexed-6747ED?style=for-the-badge)](https://thegraph.com/)

**[🌐 Launch App](https://jnglz.fun)** · **[📖 Documentation](#how-it-works)** · **[🔍 View Contract](https://bscscan.com/address/0xA482Ac7acbf846F2DAEE8b8dF3D7e77F85CC7528)**

</div>

---

## 🎯 What is JNGLZ.FUN?

JNGLZ.FUN is a **fully decentralized, permissionless prediction market platform** on BNB Chain. Anyone can create a market, trade on outcomes, and participate in resolving predictions—all without KYC, accounts, or central authorities.

### Key Principles

- **🔓 Permissionless** - Anyone can create a market for FREE
- **🏛️ Decentralized Resolution** - Markets resolved by shareholder voting ("Street Consensus")
- **📈 Bonding Curve Pricing** - Automated market maker with pump.fun-style economics
- **💰 Non-Custodial** - Your funds, your keys—withdraw anytime

---

## 🚀 Live Deployments

| Component | Network | Address/URL | Version |
|-----------|---------|-------------|---------|
| **Smart Contract** | BNB Mainnet | [`0xA482Ac7acbf846F2DAEE8b8dF3D7e77F85CC7528`](https://bscscan.com/address/0xA482Ac7acbf846F2DAEE8b8dF3D7e77F85CC7528) | v3.8.3 |
| **Smart Contract** | BNB Testnet | [`0xC97FB434B79e6c643e0320fa802B515CedBA95Bf`](https://testnet.bscscan.com/address/0xC97FB434B79e6c643e0320fa802B515CedBA95Bf) | v3.8.3 |
| **Subgraph** | BNB Mainnet | [The Graph Gateway](https://gateway.thegraph.com/api/subgraphs/id/E8nw4Nv6aboBwyQErLYGJNo5hRogZAvsRESwTVBbkDQF) | v5.2.0 |
| **Subgraph** | BNB Testnet | [The Graph Gateway](https://gateway.thegraph.com/api/subgraphs/id/3XxbwnAdLjsRWR3DeKJFbjjnahwMuDiG5H5qMuriDGcC) | v5.2.0 |
| **Frontend** | Production | [jnglz.fun](https://jnglz.fun) | v0.8.22 |

---

## 🔥 How It Works

### 1. Create a Market (FREE)

Anyone can create a yes/no prediction market:
- Ask any question with a clear yes/no outcome
- Set an expiry date
- Choose a "Heat Level" (volatility tier)
- Provide resolution rules so voters know how to decide

### 2. Trade on the Bonding Curve

Buy and sell YES or NO shares using BNB:

```
Price Formula: P(YES) = YES_Supply / (YES_Supply + NO_Supply + Virtual_Liquidity)
               P(NO)  = NO_Supply / (YES_Supply + NO_Supply + Virtual_Liquidity)
               P(YES) + P(NO) = 1 (always)
```

- **Early buyers** get lower prices
- **Price increases** as more people buy
- **Sell anytime** before resolution

### 3. Street Consensus Resolution

When the market expires, **shareholders vote on the outcome**:

```
┌─────────────────────────────────────────────────────────────────┐
│  MARKET EXPIRES                                                 │
│       ↓                                                         │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  PROPOSE (0-22 hours)                                    │   │
│  │  • First 10 min: Only creator can propose                │   │
│  │  • After: Anyone can propose with bond (1% of pool)      │   │
│  └─────────────────────────────────────────────────────────┘   │
│       ↓                                                         │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  DISPUTE WINDOW (30 minutes)                             │   │
│  │  • Anyone can dispute with 2× bond                       │   │
│  │  • No dispute? Proposal auto-finalizes                   │   │
│  └─────────────────────────────────────────────────────────┘   │
│       ↓ (if disputed)                                          │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  VOTING (1 hour)                                         │   │
│  │  • Shareholders vote weighted by position size           │   │
│  │  • Each share = 1 vote                                   │   │
│  └─────────────────────────────────────────────────────────┘   │
│       ↓                                                         │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  FINALIZE                                                │   │
│  │  • Majority wins (or proposer wins if tie)               │   │
│  │  • Loser forfeits bond → 50% winner, 50% voters          │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

### 4. Claim Winnings

If you hold winning shares:
- **Winnings** = Your share of the pool proportional to your shares
- **Resolution fee** = 0.3% deducted from claim

---

## 💎 Heat Levels

Markets have different volatility tiers (virtual liquidity):

| Heat Level | Virtual Liquidity | Typical Trades | Use Case |
|------------|-------------------|----------------|----------|
| ☢️ **CRACK** | 50 | 0.005-0.1 BNB | Meme markets, high volatility |
| 🔥 **HIGH** | 200 | 0.1-1.0 BNB | Trending topics (default) |
| 🧊 **PRO** | 500 | 0.5-5.0 BNB | Sports, elections |
| 🏛️ **APEX** | 2,000 | 1.0-10.0 BNB | High-stakes predictions |
| 🌌 **CORE** | 10,000 | 5.0+ BNB | Institutional depth |

Higher virtual liquidity = lower price impact per trade = more stable prices.

---

## 💰 Fee Structure

| Fee | Amount | When | Recipient |
|-----|--------|------|-----------|
| **Platform Fee** | 1% | Every trade | Treasury (MultiSig) |
| **Creator Fee** | 0.5% | Every trade | Market Creator |
| **Resolution Fee** | 0.3% | Claiming winnings | Treasury |
| **Market Creation** | FREE | - | - |

### Dispute Rewards

When a dispute occurs and voting concludes:
- **50%** of loser's bond → Winning bonder (proposer or disputer)
- **50%** of loser's bond → Winning voters (proportional to vote weight)

---

## 📁 Repository Structure

```
JNGLZ/
├── contracts/              # Solidity smart contracts (Foundry)
│   ├── src/               # PredictionMarket.sol (v3.8.3)
│   ├── test/              # 214+ tests
│   └── script/            # Deployment scripts
│
├── frontend/              # React 19 + TypeScript + Vite
│   ├── src/
│   │   ├── features/      # Market, Portfolio, Leaderboard
│   │   ├── shared/        # Hooks, components, API
│   │   └── lib/           # Wagmi, Rainbow, Supabase
│   └── supabase/          # Chat & moderation
│
├── subgraph/              # The Graph indexer
│   ├── src/               # AssemblyScript mappings
│   ├── schema.graphql     # GraphQL schema (11 entities)
│   └── subgraph.yaml      # Manifest
│
└── assets/                # Logos and branding
```

---

## 🛠️ Tech Stack

### Smart Contracts
- **Solidity 0.8.24** with OpenZeppelin ReentrancyGuard
- **Foundry** for testing (214+ tests, fuzzing)
- **3-of-3 MultiSig** for governance (fee changes, pausing)
- **Pull Pattern** for all withdrawals (gas griefing protection)

### Frontend
- **React 19** with TypeScript
- **Vite 6** for bundling
- **Wagmi v2 + viem** for Web3 interactions
- **RainbowKit** for wallet connection
- **TanStack Query** for state management
- **Apollo Client** for GraphQL (The Graph)
- **Tailwind CSS** for styling
- **Supabase** for real-time chat & moderation

### Indexer
- **The Graph Protocol** for blockchain indexing
- **AssemblyScript** for mappings
- **11 entities**: Market, Position, Trade, User, Vote, etc.

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Foundry (for contracts)
- Git

### Clone & Install

```bash
git clone https://github.com/stiliyangoshev97/JNGLZ.git
cd JNGLZ
```

### Smart Contracts

```bash
cd contracts
forge install
forge test
```

### Frontend

```bash
cd frontend
npm install
cp .env.example .env  # Configure environment variables
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

## 📖 Documentation

| Document | Description |
|----------|-------------|
| [contracts/README.md](./contracts/README.md) | Smart contract documentation |
| [contracts/CHANGELOG.md](./contracts/CHANGELOG.md) | Contract version history |
| [contracts/AUDIT.md](./contracts/AUDIT.md) | Security analysis |
| [frontend/README.md](./frontend/README.md) | Frontend documentation |
| [frontend/CHANGELOG.md](./frontend/CHANGELOG.md) | Frontend version history |
| [subgraph/README.md](./subgraph/README.md) | Subgraph documentation |
| [TODO.md](./TODO.md) | Development roadmap |

---

## 🔐 Security

- **No admin keys** can access user funds
- **Pull pattern** for all withdrawals (protection against gas griefing)
- **3-of-3 MultiSig** for governance (fee changes, emergency pause)
- **24-hour timelock** on all governance proposals
- **Emergency refund** available after 24 hours of market stagnation
- **214+ automated tests** including fuzz testing
- **Slither static analysis** completed

### Known Limitations

1. Markets with >4,600 voters may have expensive finalization (gas limit concerns addressed in v3.7.0 with Pull Pattern for jury fees)
2. One-sided markets (100% YES or 100% NO) cannot finalize—use emergency refund after 24 hours

---

## 📜 License

MIT License - see [LICENSE](./LICENSE) for details.

---

## 🤝 Contributing

Contributions are welcome! Please read the documentation and open an issue before submitting PRs.

---

<div align="center">

**Built with 🦁 by the JNGLZ Team**

[Twitter](https://x.com/jnglzdotfun) · [Telegram](https://t.me/jnglzdotfun) · [Website](https://jnglz.fun)

</div>
