# 📖 PredictionMarket Contracts - RUNBOOK

> Commands and procedures for development, testing, and deployment.

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
```bash
# Create a market (using cast)
cast send $MARKET_ADDRESS "createMarket(string,string,string,uint256)" \
  "Will BTC hit 100k?" \
  "https://coinmarketcap.com" \
  "Resolve YES if BTC > 100k" \
  $(date -v+7d +%s) \
  --rpc-url http://localhost:8545 \
  --private-key $PRIVATE_KEY

# Buy YES shares
cast send $MARKET_ADDRESS "buyYes(uint256,uint256)" 0 0 \
  --value 0.1ether \
  --rpc-url http://localhost:8545 \
  --private-key $PRIVATE_KEY

# Check YES price
cast call $MARKET_ADDRESS "getYesPrice(uint256)(uint256)" 0 \
  --rpc-url http://localhost:8545
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
WBNB_ADDRESS=0xae13d989daC2f0dEbFf460aC112a837C89BAa7cd
UMA_OOV3_ADDRESS=0x...
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
  --constructor-args $(cast abi-encode "constructor(address[3],address,address,address)" \
    "[$SIGNER1,$SIGNER2,$SIGNER3]" $TREASURY $WBNB $UMA_OOV3) \
  --etherscan-api-key $BSCSCAN_API_KEY
```

---

## 🌐 Mainnet Deployment (BNB Chain)

### Pre-deployment Checklist
- [ ] All tests passing
- [ ] Code audited
- [ ] MultiSig signers confirmed and keys secured
- [ ] Treasury address confirmed
- [ ] UMA OOv3 address confirmed
- [ ] Deployment wallet funded with BNB for gas

### Environment Setup
```bash
DEPLOYER_PRIVATE_KEY=0x...
MULTISIG_SIGNER_1=0x...
MULTISIG_SIGNER_2=0x...
MULTISIG_SIGNER_3=0x...
TREASURY_ADDRESS=0x...
WBNB_ADDRESS=0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c
UMA_OOV3_ADDRESS=0x...
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
| Type | Enum Value | Data Encoding |
|------|------------|---------------|
| SetFee | 0 | `abi.encode(uint256)` |
| SetMinBet | 1 | `abi.encode(uint256)` |
| SetUmaBond | 2 | `abi.encode(uint256)` |
| SetTreasury | 3 | `abi.encode(address)` |
| SetWbnb | 4 | `abi.encode(address)` |
| SetUmaOOv3 | 5 | `abi.encode(address)` |
| Pause | 6 | `""` (empty) |
| Unpause | 7 | `""` (empty) |

---

## 📊 Monitoring & Debugging

### View Contract State
```bash
# Check if paused
cast call $MARKET_ADDRESS "paused()(bool)" --rpc-url $RPC_URL

# Get platform fee
cast call $MARKET_ADDRESS "platformFeeBps()(uint256)" --rpc-url $RPC_URL

# Get market count
cast call $MARKET_ADDRESS "marketCount()(uint256)" --rpc-url $RPC_URL

# Get market details
cast call $MARKET_ADDRESS "getMarket(uint256)" 0 --rpc-url $RPC_URL

# Get user position
cast call $MARKET_ADDRESS "getPosition(uint256,address)(uint256,uint256,bool)" \
  0 $USER_ADDRESS --rpc-url $RPC_URL
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
cast send $MARKET_ADDRESS "proposeAction(uint8,bytes)" 6 "" \
  --rpc-url $RPC_URL --private-key $SIGNER1_KEY

# Signer 2 confirms
cast send $MARKET_ADDRESS "confirmAction(uint256)" $ACTION_ID \
  --rpc-url $RPC_URL --private-key $SIGNER2_KEY

# Signer 3 confirms (executes automatically)
cast send $MARKET_ADDRESS "confirmAction(uint256)" $ACTION_ID \
  --rpc-url $RPC_URL --private-key $SIGNER3_KEY
```

### Unpause Contract
Same as pause but with ActionType 7 (Unpause).

---

## 📁 Project Structure

```
contracts/
├── src/
│   └── PredictionMarket.sol    # Main contract
├── test/
│   ├── PredictionMarket.t.sol  # Unit tests
│   └── helpers/
│       └── TestHelper.sol      # Test utilities & mocks
├── script/
│   └── Deploy.s.sol            # Deployment scripts
├── lib/                        # Dependencies (forge-std, openzeppelin)
├── foundry.toml               # Foundry config
├── remappings.txt             # Import remappings
└── RUNBOOK.md                 # This file
```

---

## 📚 Resources

- [Foundry Book](https://book.getfoundry.sh/)
- [BNB Chain Docs](https://docs.bnbchain.org/)
- [UMA Protocol Docs](https://docs.uma.xyz/)
- [BSCScan](https://bscscan.com/)
