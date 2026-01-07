// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import "forge-std/Script.sol";
import "../src/PredictionMarket.sol";

/**
 * @title DeployPredictionMarket
 * @notice Deployment script for PredictionMarket contract with Street Consensus
 * @dev Run with: forge script script/Deploy.s.sol --rpc-url $RPC_URL --broadcast
 */
contract DeployPredictionMarket is Script {
    function run() external {
        // Load deployment configuration from environment
        uint256 deployerPrivateKey = vm.envUint("DEPLOYER_PRIVATE_KEY");

        address signer1 = vm.envAddress("MULTISIG_SIGNER_1");
        address signer2 = vm.envAddress("MULTISIG_SIGNER_2");
        address signer3 = vm.envAddress("MULTISIG_SIGNER_3");
        address treasury = vm.envAddress("TREASURY_ADDRESS");

        // Determine network
        bool isMainnet = vm.envOr("IS_MAINNET", false);

        console.log("=== Deployment Configuration ===");
        console.log("Network:", isMainnet ? "BNB Mainnet" : "BNB Testnet");
        console.log("Signer 1:", signer1);
        console.log("Signer 2:", signer2);
        console.log("Signer 3:", signer3);
        console.log("Treasury:", treasury);
        console.log("================================");

        // Validate addresses
        require(signer1 != address(0), "Signer 1 not set");
        require(signer2 != address(0), "Signer 2 not set");
        require(signer3 != address(0), "Signer 3 not set");
        require(treasury != address(0), "Treasury not set");

        // Start broadcast
        vm.startBroadcast(deployerPrivateKey);

        // Deploy PredictionMarket (Street Consensus - no UMA dependencies)
        PredictionMarket predictionMarket = new PredictionMarket(
            [signer1, signer2, signer3],
            treasury
        );

        vm.stopBroadcast();

        // Log deployment
        console.log("=== Deployment Complete ===");
        console.log("PredictionMarket deployed at:", address(predictionMarket));
        console.log("===========================");

        // Write deployment address to file
        string memory deploymentInfo = string.concat(
            "Network: ",
            isMainnet ? "BNB Mainnet" : "BNB Testnet",
            "\n",
            "PredictionMarket: ",
            vm.toString(address(predictionMarket)),
            "\n",
            "Deployed at block: ",
            vm.toString(block.number),
            "\n",
            "Timestamp: ",
            vm.toString(block.timestamp),
            "\n",
            "Resolution: Street Consensus (no UMA)\n"
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

        // Use Anvil's default accounts for signers
        address signer1 = 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266;
        address signer2 = 0x70997970C51812dc3A010C7d01b50e0d17dc79C8;
        address signer3 = 0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC;
        address treasury = 0x90F79bf6EB2c4f870365E785982E1f101E93b906;

        // Deploy PredictionMarket (Street Consensus - no external dependencies)
        PredictionMarket predictionMarket = new PredictionMarket(
            [signer1, signer2, signer3],
            treasury
        );

        vm.stopBroadcast();

        console.log("=== Local Deployment Complete ===");
        console.log("PredictionMarket:", address(predictionMarket));
        console.log("Resolution: Street Consensus");
        console.log("=================================");
    }
}
