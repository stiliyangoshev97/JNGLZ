// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import "forge-std/Script.sol";
import "../src/PredictionMarket.sol";

/**
 * @title DeployPredictionMarket
 * @notice Deployment script for PredictionMarket contract with Street Consensus
 *
 * @dev USAGE:
 *
 *   1. Fill in .env file with your addresses
 *
 *   2. For BNB Testnet:
 *      source .env && forge script script/Deploy.s.sol:DeployPredictionMarket \
 *        --rpc-url $BNB_TESTNET_RPC_URL --broadcast --verify
 *
 *   3. For local Anvil testing:
 *      forge script script/Deploy.s.sol:DeployLocal --rpc-url http://localhost:8545 --broadcast
 */
contract DeployPredictionMarket is Script {
    function run() external {
        // ============================================
        // LOAD CONFIGURATION FROM .env
        // ============================================

        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY_1");
        address deployer = vm.addr(deployerPrivateKey);

        address signer1 = vm.envAddress("MULTISIG_SIGNER_1");
        address signer2 = vm.envAddress("MULTISIG_SIGNER_2");
        address signer3 = vm.envAddress("MULTISIG_SIGNER_3");
        address treasury = vm.envAddress("PLATFORM_TREASURY");

        // ============================================
        // PRE-DEPLOYMENT LOGGING
        // ============================================

        console.log("");
        console.log("========================================");
        console.log("   JunkieFun PredictionMarket Deploy");
        console.log("========================================");
        console.log("");
        console.log("Chain ID:", block.chainid);
        console.log("Deployer:", deployer);
        console.log("Deployer Balance:", deployer.balance / 1e18, "BNB");
        console.log("");
        console.log("MultiSig Signers:");
        console.log("  Signer 1:", signer1);
        console.log("  Signer 2:", signer2);
        console.log("  Signer 3:", signer3);
        console.log("Treasury:", treasury);
        console.log("");

        // ============================================
        // VALIDATION
        // ============================================

        require(signer1 != address(0), "MULTISIG_SIGNER_1 not set in .env");
        require(signer2 != address(0), "MULTISIG_SIGNER_2 not set in .env");
        require(signer3 != address(0), "MULTISIG_SIGNER_3 not set in .env");
        require(treasury != address(0), "PLATFORM_TREASURY not set in .env");
        require(
            deployer.balance > 0.01 ether,
            "Deployer needs at least 0.01 BNB for gas"
        );

        // ============================================
        // DEPLOY
        // ============================================

        vm.startBroadcast(deployerPrivateKey);

        PredictionMarket predictionMarket = new PredictionMarket(
            [signer1, signer2, signer3],
            treasury
        );

        vm.stopBroadcast();

        // ============================================
        // POST-DEPLOYMENT LOGGING
        // ============================================

        console.log("");
        console.log("========================================");
        console.log("   DEPLOYMENT SUCCESSFUL!");
        console.log("========================================");
        console.log("");
        console.log("PredictionMarket:", address(predictionMarket));
        console.log("");
        console.log("Resolution: Street Consensus (no external oracles)");
        console.log(
            "Fee Structure: 1% platform + 0.5% creator + 0.3% resolution"
        );
        console.log("");
        console.log("Next Steps:");
        console.log(
            "1. Verify contract on BscScan (should auto-verify with --verify flag)"
        );
        console.log("2. Test createMarket() on testnet");
        console.log("3. Test buy/sell flows");
        console.log(
            "4. Test resolution flow (propose -> dispute -> vote -> finalize)"
        );
        console.log("");
        console.log("========================================");

        // ============================================
        // SAVE DEPLOYMENT INFO
        // ============================================

        string memory networkName = block.chainid == 97
            ? "BNB Testnet"
            : block.chainid == 56
            ? "BNB Mainnet"
            : "Unknown";

        string memory deploymentInfo = string.concat(
            "========================================\n",
            "JunkieFun Deployment\n",
            "========================================\n\n",
            "Network: ",
            networkName,
            " (Chain ID: ",
            vm.toString(block.chainid),
            ")\n",
            "Deployed at block: ",
            vm.toString(block.number),
            "\n",
            "Timestamp: ",
            vm.toString(block.timestamp),
            "\n\n",
            "PredictionMarket: ",
            vm.toString(address(predictionMarket)),
            "\n\n",
            "MultiSig Signers:\n",
            "  Signer 1: ",
            vm.toString(signer1),
            "\n",
            "  Signer 2: ",
            vm.toString(signer2),
            "\n",
            "  Signer 3: ",
            vm.toString(signer3),
            "\n",
            "Treasury: ",
            vm.toString(treasury),
            "\n\n",
            "Resolution: Street Consensus\n",
            "========================================\n"
        );

        vm.writeFile("deployment-addresses.txt", deploymentInfo);
        console.log("Deployment info saved to deployment-addresses.txt");
    }
}

/**
 * @title DeployLocal
 * @notice Deployment script for local testing with Anvil
 * @dev Run with: anvil (in one terminal), then:
 *      forge script script/Deploy.s.sol:DeployLocal --rpc-url http://localhost:8545 --broadcast
 */
contract DeployLocal is Script {
    function run() external {
        // Use Anvil's default private key (Account #0)
        uint256 deployerPrivateKey = 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80;

        // Use Anvil's default accounts for signers and treasury
        address signer1 = 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266; // Account #0
        address signer2 = 0x70997970C51812dc3A010C7d01b50e0d17dc79C8; // Account #1
        address signer3 = 0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC; // Account #2
        address treasury = 0x90F79bf6EB2c4f870365E785982E1f101E93b906; // Account #3

        console.log("");
        console.log("========================================");
        console.log("   JunkieFun LOCAL Deployment (Anvil)");
        console.log("========================================");
        console.log("");

        vm.startBroadcast(deployerPrivateKey);

        PredictionMarket predictionMarket = new PredictionMarket(
            [signer1, signer2, signer3],
            treasury
        );

        vm.stopBroadcast();

        console.log("PredictionMarket:", address(predictionMarket));
        console.log("");
        console.log("Signers: Account #0, #1, #2");
        console.log("Treasury: Account #3");
        console.log("========================================");
    }
}
