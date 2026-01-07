# 📖 PredictionMarket Contracts - RUNBOOK

> Commands and procedures for development, testing, and deployment.  
> **Version:** 2.0 (Street Consensus)

---

## 🔧 Development Setup

### Prerequisites
- [Foundry](https://book.getfoundry.sh/getting-started/installation) installed
- Node.js 18+ (for optional tooling)

### Install Dependencies
```bash
cd contracts
forge install
```

---

## 🧪 Testing

### Run All Tests
```bash
forge test
```

### Run Tests with Verbosity
```bash
forge test -vv      # Show logs
forge test -vvv     # Show traces for failing tests
forge test -vvvv    # Show all traces
```

### Run Specific Test
```bash
forge test --match-test test_BuyYes_Success -vvv
```

### Run Tests Matching Pattern
```bash
forge test --match-contract PredictionMarketTest
forge test --match-test "test_Buy"
forge test --match-test "test_Propose"
forge test --match-test "test_Dispute"
forge test --match-test "test_Vote"
forge test --match-test "test_Finalize"
```

### Gas Report
```bash
forge test --gas-report
```

### Coverage (requires lcov)
```bash
forge coverage
forge coverage --report lcov
```

---

## 🏗️ Local Development

### Start Local Node (Anvil)
```bash
anvil
```

### Deploy to Local Node
```bash
forge script script/Deploy.s.sol:DeployLocal \
  --rpc-url http://localhost:8545 \
  --broadcast
```

### Interact with Local Deployment

#### Create a Market
```bash
cast send $MARKET_ADDRESS "createMarket(string,string,string,uint256)" \
  "Will BTC hit 100k?" \
  "https://coinmarketcap.com" \
  "Resolve YES if BTC > 100k" \
  $(date -v+7d +%s) \
  --rpc-url http://localhost:8545 \
  --private-key $PRIVATE_KEY
```

#### Buy YES Shares
```bash
cast send $MARKET_ADDRESS "buyYes(uint256,uint256)" 0 0 \
  --value 0.1ether \
  --rpc-url http://localhost:8545 \
  --private-key $PRIVATE_KEY
```

#### Check Prices
```bash
# YES price for market 0
cast call $MARKET_ADDRESS "getYesPrice(uint256)(uint256)" 0 \
  --rpc-url http://localhost:8545

# NO price for market 0
cast call $MARKET_ADDRESS "getNoPrice(uint256)(uint256)" 0 \
  --rpc-url http://localhost:8545
```

#### Propose Outcome (Street Consensus)
```bash
# Get required bond first
cast call $MARKET_ADDRESS "getRequiredBond(uint256)(uint256)" 0 \
  --rpc-url http://localhost:8545

# Propose YES won
cast send $MARKET_ADDRESS "proposeOutcome(uint256,bool,string)" \
  0 true "https://proof-link.com" \
  --value 0.02ether \
  --rpc-url http://localhost:8545 \
  --private-key $PRIVATE_KEY
```

#### Dispute Proposal
```bash
# Requires 2× the proposer's bond
cast send $MARKET_ADDRESS "dispute(uint256,string)" \
  0 "https://counter-proof.com" \
  --value 0.04ether \
  --rpc-url http://localhost:8545 \
  --private-key $DISPUTER_KEY
```

#### Vote (After Dispute)
```bash
# Vote for proposer (true) or disputer (false)
cast send $MARKET_ADDRESS "vote(uint256,bool)" 0 true \
  --rpc-url http://localhost:8545 \
  --private-key $VOTER_KEY
```

#### Finalize Market (After Voting Ends)
```bash
cast send $MARKET_ADDRESS "finalizeMarket(uint256)" 0 \
  --rpc-url http://localhost:8545 \
  --private-key $PRIVATE_KEY
```

#### Claim Winnings
```bash
cast send $MARKET_ADDRESS "claim(uint256)" 0 \
  --rpc-url http://localhost:8545 \
  --private-key $WINNER_KEY
```

---

## 🚀 Testnet Deployment (BNB Testnet)

### Environment Setup
Create `.env` file:
```bash
DEPLOYER_PRIVATE_KEY=0x...
MULTISIG_SIGNER_1=0x...
MULTISIG_SIGNER_2=0x...
MULTISIG_SIGNER_3=0x...
TREASURY_ADDRESS=0x...
IS_MAINNET=false
```

### Deploy
```bash
source .env

forge script script/Deploy.s.sol:DeployPredictionMarket \
  --rpc-url https://data-seed-prebsc-1-s1.binance.org:8545 \
  --broadcast \
  --verify \
  --etherscan-api-key $BSCSCAN_API_KEY
```

### Verify Contract (if not auto-verified)
```bash
forge verify-contract $CONTRACT_ADDRESS src/PredictionMarket.sol:PredictionMarket \
  --chain-id 97 \
  --constructor-args $(cast abi-encode "constructor(address[3],address)" \
    "[$SIGNER1,$SIGNER2,$SIGNER3]" $TREASURY) \
  --etherscan-api-key $BSCSCAN_API_KEY
```

---

## 🌐 Mainnet Deployment (BNB Chain)

### Pre-deployment Checklist
- [ ] All 116 tests passing
- [ ] Code audited
- [ ] MultiSig signers confirmed and keys secured
- [ ] Treasury address confirmed
- [ ] Deployment wallet funded with BNB for gas

### Environment Setup
```bash
DEPLOYER_PRIVATE_KEY=0x...
MULTISIG_SIGNER_1=0x...
MULTISIG_SIGNER_2=0x...
MULTISIG_SIGNER_3=0x...
TREASURY_ADDRESS=0x...
IS_MAINNET=true
```

### Deploy
```bash
source .env

forge script script/Deploy.s.sol:DeployPredictionMarket \
  --rpc-url https://bsc-dataseed.binance.org \
  --broadcast \
  --verify \
  --etherscan-api-key $BSCSCAN_API_KEY \
  --slow
```

---

## 🔐 MultiSig Governance

### Propose Action (any signer)
```bash
# Example: Set platform fee to 2% (200 bps)
cast send $MARKET_ADDRESS "proposeAction(uint8,bytes)" \
  0 \  # ActionType.SetFee
  $(cast abi-encode "uint256" 200) \
  --rpc-url $RPC_URL \
  --private-key $SIGNER1_KEY
```

### Confirm Action (other signers)
```bash
cast send $MARKET_ADDRESS "confirmAction(uint256)" \
  $ACTION_ID \
  --rpc-url $RPC_URL \
  --private-key $SIGNER2_KEY

cast send $MARKET_ADDRESS "confirmAction(uint256)" \
  $ACTION_ID \
  --rpc-url $RPC_URL \
  --private-key $SIGNER3_KEY
```

### Action Types

| Type | Enum Value | Data Encoding | Description |
|------|------------|---------------|-------------|
| SetFee | 0 | `abi.encode(uint256)` | Platform fee (0-500 bps) |
| SetMinBet | 1 | `abi.encode(uint256)` | Minimum bet amount |
| SetTreasury | 2 | `abi.encode(address)` | Treasury address |
| SetCreatorFee | 3 | `abi.encode(uint256)` | Creator fee (0-200 bps) |
| SetResolutionFee | 4 | `abi.encode(uint256)` | Resolution fee (0-100 bps) |
| SetMinBondFloor | 5 | `abi.encode(uint256)` | Min bond (0.01-0.1 BNB) |
| SetDynamicBondBps | 6 | `abi.encode(uint256)` | Bond % of pool (50-500 bps) |
| SetBondWinnerShare | 7 | `abi.encode(uint256)` | Winner share (2000-8000 bps) |
| Pause | 8 | `""` (empty) | Pause contract |
| Unpause | 9 | `""` (empty) | Unpause contract |

---

## 📊 Monitoring & Debugging

### View Contract State
```bash
# Check if paused
cast call $MARKET_ADDRESS "paused()(bool)" --rpc-url $RPC_URL

# Get platform fee
cast call $MARKET_ADDRESS "platformFeeBps()(uint256)" --rpc-url $RPC_URL

# Get creator fee
cast call $MARKET_ADDRESS "creatorFeeBps()(uint256)" --rpc-url $RPC_URL

# Get resolution fee
cast call $MARKET_ADDRESS "resolutionFeeBps()(uint256)" --rpc-url $RPC_URL

# Get market count
cast call $MARKET_ADDRESS "marketCount()(uint256)" --rpc-url $RPC_URL

# Get market details
cast call $MARKET_ADDRESS "getMarket(uint256)" 0 --rpc-url $RPC_URL

# Get market status (0=Active, 1=Expired, 2=Proposed, 3=Disputed, 4=Resolved)
cast call $MARKET_ADDRESS "getMarketStatus(uint256)(uint8)" 0 --rpc-url $RPC_URL

# Get user position (yesShares, noShares, claimed, emergencyRefunded, hasVoted, votedForProposer)
cast call $MARKET_ADDRESS "getPosition(uint256,address)(uint256,uint256,bool,bool,bool,bool)" \
  0 $USER_ADDRESS --rpc-url $RPC_URL

# Get required bond for proposing
cast call $MARKET_ADDRESS "getRequiredBond(uint256)(uint256)" 0 --rpc-url $RPC_URL

# Check emergency refund eligibility
cast call $MARKET_ADDRESS "canEmergencyRefund(uint256)(bool,uint256)" 0 --rpc-url $RPC_URL
```

### View Prices
```bash
# YES price for market 0
cast call $MARKET_ADDRESS "getYesPrice(uint256)(uint256)" 0 --rpc-url $RPC_URL

# NO price for market 0  
cast call $MARKET_ADDRESS "getNoPrice(uint256)(uint256)" 0 --rpc-url $RPC_URL
```

### Debug Transaction
```bash
cast run $TX_HASH --rpc-url $RPC_URL -vvvv
```

---

## 🛡️ Emergency Procedures

### Pause Contract (requires 3/3 MultiSig)
```bash
# Signer 1 proposes pause
cast send $MARKET_ADDRESS "proposeAction(uint8,bytes)" 8 "" \
  --rpc-url $RPC_URL --private-key $SIGNER1_KEY

# Signer 2 confirms
cast send $MARKET_ADDRESS "confirmAction(uint256)" $ACTION_ID \
  --rpc-url $RPC_URL --private-key $SIGNER2_KEY

# Signer 3 confirms (executes automatically)
cast send $MARKET_ADDRESS "confirmAction(uint256)" $ACTION_ID \
  --rpc-url $RPC_URL --private-key $SIGNER3_KEY
```

### Unpause Contract
Same as pause but with ActionType 9 (Unpause).

---

## ⚖️ Street Consensus Flow Reference

### Timing
```
Market Expires
     │
     ├── 0-10 min: CREATOR PRIORITY (only creator can propose)
     │
     ├── 10+ min: OPEN PROPOSAL (anyone can propose)
     │
After Proposal:
     │
     ├── 0-30 min: DISPUTE WINDOW (anyone can dispute with 2× bond)
     │
     └── If disputed: 1 hour VOTING WINDOW
                      │
                      └── After voting: call finalizeMarket()
```

### Status Flow
```
Active → Expired → Proposed → [Disputed] → Resolved
```

### Quick Reference Commands
```bash
# 1. After market expires, propose (as creator within 10 min, or anyone after)
cast send $MARKET "proposeOutcome(uint256,bool,string)" $ID true "" --value $BOND

# 2. Within 30 min, dispute if you disagree
cast send $MARKET "dispute(uint256,string)" $ID "proof" --value $DOUBLE_BOND

# 3. If disputed, vote within 1 hour
cast send $MARKET "vote(uint256,bool)" $ID true  # true = support proposer

# 4. After voting ends, finalize
cast send $MARKET "finalizeMarket(uint256)" $ID

# 5. Winners claim
cast send $MARKET "claim(uint256)" $ID
```

---

## 📁 Project Structure

```
contracts/
├── src/
│   └── PredictionMarket.sol    # Main contract
├── test/
│   ├── PredictionMarket.t.sol       # Unit tests (52)
│   ├── PredictionMarket.fuzz.t.sol  # Fuzz tests (29)
│   ├── PumpDump.t.sol               # Economics tests (31)
│   ├── VulnerabilityCheck.t.sol     # Security tests (4)
│   └── helpers/
│       └── TestHelper.sol           # Test utilities & mocks
├── script/
│   └── Deploy.s.sol                 # Deployment scripts
├── lib/                             # Dependencies (forge-std, openzeppelin)
├── foundry.toml                     # Foundry config
├── remappings.txt                   # Import remappings
└── RUNBOOK.md                       # This file
```

---

## 📚 Resources

- [Foundry Book](https://book.getfoundry.sh/)
- [BNB Chain Docs](https://docs.bnbchain.org/)
- [BSCScan](https://bscscan.com/)
