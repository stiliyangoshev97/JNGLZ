// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import "forge-std/Script.sol";
import "../src/PredictionMarket.sol";

/**
 * @title DeployPredictionMarket
 * @notice Deployment script for PredictionMarket contract
 * @dev Run with: forge script script/Deploy.s.sol --rpc-url $RPC_URL --broadcast
 */
contract DeployPredictionMarket is Script {
    // ============================================
    // MAINNET ADDRESSES (BNB Chain)
    // ============================================
    
    // UMA OOv3 on BNB Chain Mainnet
    address constant UMA_OOV3_MAINNET = 0x0000000000000000000000000000000000000000; // TODO: Update with actual address
    
    // WBNB on BNB Chain Mainnet
    address constant WBNB_MAINNET = 0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c;

    // ============================================
    // TESTNET ADDRESSES (BNB Chain Testnet)
    // ============================================
    
    // UMA OOv3 on BNB Chain Testnet
    address constant UMA_OOV3_TESTNET = 0x0000000000000000000000000000000000000000; // TODO: Update with actual address
    
    // WBNB on BNB Chain Testnet
    address constant WBNB_TESTNET = 0xae13d989daC2f0dEbFf460aC112a837C89BAa7cd;

    // ============================================
    // DEPLOYMENT
    // ============================================

    function run() external {
        // Load deployment configuration from environment
        uint256 deployerPrivateKey = vm.envUint("DEPLOYER_PRIVATE_KEY");
        
        address signer1 = vm.envAddress("MULTISIG_SIGNER_1");
        address signer2 = vm.envAddress("MULTISIG_SIGNER_2");
        address signer3 = vm.envAddress("MULTISIG_SIGNER_3");
        address treasury = vm.envAddress("TREASURY_ADDRESS");
        
        // Determine network
        bool isMainnet = vm.envOr("IS_MAINNET", false);
        address wbnb = isMainnet ? WBNB_MAINNET : WBNB_TESTNET;
        address umaOOv3 = isMainnet ? UMA_OOV3_MAINNET : UMA_OOV3_TESTNET;
        
        // Override if provided in environment
        if (vm.envOr("WBNB_ADDRESS", address(0)) != address(0)) {
            wbnb = vm.envAddress("WBNB_ADDRESS");
        }
        if (vm.envOr("UMA_OOV3_ADDRESS", address(0)) != address(0)) {
            umaOOv3 = vm.envAddress("UMA_OOV3_ADDRESS");
        }

        console.log("=== Deployment Configuration ===");
        console.log("Network:", isMainnet ? "BNB Mainnet" : "BNB Testnet");
        console.log("Signer 1:", signer1);
        console.log("Signer 2:", signer2);
        console.log("Signer 3:", signer3);
        console.log("Treasury:", treasury);
        console.log("WBNB:", wbnb);
        console.log("UMA OOv3:", umaOOv3);
        console.log("================================");

        // Validate addresses
        require(signer1 != address(0), "Signer 1 not set");
        require(signer2 != address(0), "Signer 2 not set");
        require(signer3 != address(0), "Signer 3 not set");
        require(treasury != address(0), "Treasury not set");
        require(wbnb != address(0), "WBNB not set");
        require(umaOOv3 != address(0), "UMA OOv3 not set");

        // Start broadcast
        vm.startBroadcast(deployerPrivateKey);

        // Deploy PredictionMarket
        PredictionMarket predictionMarket = new PredictionMarket(
            [signer1, signer2, signer3],
            treasury,
            wbnb,
            umaOOv3
        );

        vm.stopBroadcast();

        // Log deployment
        console.log("=== Deployment Complete ===");
        console.log("PredictionMarket deployed at:", address(predictionMarket));
        console.log("===========================");

        // Write deployment address to file
        string memory deploymentInfo = string.concat(
            "Network: ", isMainnet ? "BNB Mainnet" : "BNB Testnet", "\n",
            "PredictionMarket: ", vm.toString(address(predictionMarket)), "\n",
            "Deployed at block: ", vm.toString(block.number), "\n",
            "Timestamp: ", vm.toString(block.timestamp), "\n"
        );
        
        vm.writeFile("deployment-addresses.txt", deploymentInfo);
    }
}

/**
 * @title DeployLocal
 * @notice Deployment script for local testing with Anvil
 * @dev Run with: forge script script/Deploy.s.sol:DeployLocal --rpc-url http://localhost:8545 --broadcast
 */
contract DeployLocal is Script {
    function run() external {
        // Use Anvil's default private key
        uint256 deployerPrivateKey = 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80;
        
        vm.startBroadcast(deployerPrivateKey);

        // Deploy mock WBNB
        MockWBNB wbnb = new MockWBNB();
        console.log("MockWBNB deployed at:", address(wbnb));

        // Deploy mock UMA OOv3
        MockUmaOOv3 umaOOv3 = new MockUmaOOv3();
        console.log("MockUmaOOv3 deployed at:", address(umaOOv3));

        // Use Anvil's default accounts for signers
        address signer1 = 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266;
        address signer2 = 0x70997970C51812dc3A010C7d01b50e0d17dc79C8;
        address signer3 = 0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC;
        address treasury = 0x90F79bf6EB2c4f870365E785982E1f101E93b906;

        // Deploy PredictionMarket
        PredictionMarket predictionMarket = new PredictionMarket(
            [signer1, signer2, signer3],
            treasury,
            address(wbnb),
            address(umaOOv3)
        );

        // Set market address in mock UMA
        umaOOv3.setMarket(address(predictionMarket));

        vm.stopBroadcast();

        console.log("=== Local Deployment Complete ===");
        console.log("PredictionMarket:", address(predictionMarket));
        console.log("MockWBNB:", address(wbnb));
        console.log("MockUmaOOv3:", address(umaOOv3));
        console.log("=================================");
    }
}

// ============================================
// MOCK CONTRACTS (for local deployment only)
// ============================================

contract MockWBNB {
    string public name = "Wrapped BNB";
    string public symbol = "WBNB";
    uint8 public decimals = 18;

    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;

    function mint(address to, uint256 amount) external {
        balanceOf[to] += amount;
    }

    function approve(address spender, uint256 amount) external returns (bool) {
        allowance[msg.sender][spender] = amount;
        return true;
    }

    function transfer(address to, uint256 amount) external returns (bool) {
        balanceOf[msg.sender] -= amount;
        balanceOf[to] += amount;
        return true;
    }

    function transferFrom(address from, address to, uint256 amount) external returns (bool) {
        allowance[from][msg.sender] -= amount;
        balanceOf[from] -= amount;
        balanceOf[to] += amount;
        return true;
    }

    // Deposit BNB to get WBNB
    function deposit() external payable {
        balanceOf[msg.sender] += msg.value;
    }

    // Withdraw WBNB to get BNB
    function withdraw(uint256 amount) external {
        balanceOf[msg.sender] -= amount;
        payable(msg.sender).transfer(amount);
    }

    receive() external payable {
        balanceOf[msg.sender] += msg.value;
    }
}

contract MockUmaOOv3 {
    address public market;
    uint256 public assertionCounter;
    mapping(bytes32 => address) public asserters;

    function setMarket(address _market) external {
        market = _market;
    }

    function assertTruthWithDefaults(
        bytes memory,
        address asserter
    ) external returns (bytes32 assertionId) {
        assertionCounter++;
        assertionId = bytes32(assertionCounter);
        asserters[assertionId] = asserter;
        return assertionId;
    }

    function resolveAssertion(bytes32 assertionId, bool truthful) external {
        PredictionMarket(market).assertionResolvedCallback(assertionId, truthful);
    }
}
