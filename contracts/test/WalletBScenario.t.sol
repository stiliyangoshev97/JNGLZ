// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import "../src/PredictionMarket.sol";

contract WalletBScenarioTest is Test {
    PredictionMarket public market;
    address treasury = address(0xc21Ca5BA47cF1C485DE33b26D9Da3d10ACcDa413);
    address walletA = address(0xD4fd6333c8290bEdAf34a9911aA4B5a36878C89D);
    address walletB = address(0x4Cca77ba15B0D85d7B733E0838a429E7bEF42DD2);

    function setUp() public {
        address[3] memory signers = [
            makeAddr("signer1"),
            makeAddr("signer2"),
            makeAddr("signer3")
        ];
        market = new PredictionMarket(signers, treasury);
    }

    function test_ExactScenarioFromBscScan() public {
        console.log("=== EXACT SCENARIO FROM BSCSCAN ===");
        console.log("");
        
        // Transaction 1: Wallet A creates market and buys with 0.01 BNB
        vm.deal(walletA, 0.01 ether);
        vm.prank(walletA);
        (uint256 marketId, ) = market.createMarketAndBuy{value: 0.01 ether}(
            "Test market",
            "",
            "",
            "",
            block.timestamp + 7 days,
            PredictionMarket.HeatLevel.CRACK,
            true, // YES
            0
        );
        
        (uint256 sharesA, , , , , ) = market.getPosition(marketId, walletA);
        console.log("Wallet A shares:", sharesA);
        
        (, , , , , , uint256 yesSupply1, , uint256 pool1, , ) = market.getMarket(marketId);
        console.log("Pool after tx1:", pool1);
        console.log("YES supply after tx1:", yesSupply1);
        console.log("");
        
        // Transaction 2: Wallet B buys with 0.1 BNB
        vm.deal(walletB, 0.1 ether);
        vm.prank(walletB);
        uint256 sharesB = market.buyYes{value: 0.1 ether}(marketId, 0);
        console.log("Wallet B bought shares:", sharesB);
        
        (, , , , , , uint256 yesSupply2, , uint256 pool2, , ) = market.getMarket(marketId);
        console.log("Pool after tx2:", pool2);
        console.log("YES supply after tx2:", yesSupply2);
        console.log("");
        
        // Check what MAX sellable is
        (uint256 maxSellable, uint256 maxBnbOut) = market.getMaxSellableShares(marketId, sharesB, true);
        console.log("Max sellable shares:", maxSellable);
        console.log("Max BNB out:", maxBnbOut);
        console.log("");
        
        // Transaction 3: Wallet B sells max shares
        console.log("Wallet B selling max shares:", maxSellable);
        
        uint256 balanceBefore = walletB.balance;
        vm.prank(walletB);
        market.sellYes(marketId, maxSellable, 0);
        uint256 balanceAfter = walletB.balance;
        uint256 actualReceived = balanceAfter - balanceBefore;
        console.log("Actual BNB received:", actualReceived);
        console.log("");
        
        // Check final state
        (, , , , , , uint256 yesSupply3, , uint256 pool3, , ) = market.getMarket(marketId);
        console.log("Pool after sell:", pool3);
        console.log("YES supply after sell:", yesSupply3);
        
        (uint256 bYesShares, , , , , ) = market.getPosition(marketId, walletB);
        console.log("Wallet B remaining shares:", bYesShares);
        console.log("");
        
        // Summary
        console.log("=== SUMMARY ===");
        console.log("Wallet B spent: 100000000000000000 (0.1 BNB)");
        console.log("Wallet B got back:", actualReceived);
        console.log("Wallet B still has shares:", bYesShares);
        
        int256 bnbPnL = int256(actualReceived) - int256(0.1 ether);
        if (bnbPnL > 0) {
            console.log("!!! WALLET B BNB PROFIT:", uint256(bnbPnL));
        } else {
            console.log("Wallet B BNB loss:", uint256(-bnbPnL));
        }
        
        // Value of remaining shares
        if (bYesShares > 0) {
            uint256 remainingValue = market.previewSell(marketId, bYesShares, true);
            console.log("Remaining shares value:", remainingValue);
            console.log("");
            console.log("TOTAL VALUE (bnb + shares):", actualReceived + remainingValue);
            int256 totalPnL = int256(actualReceived + remainingValue) - int256(0.1 ether);
            if (totalPnL > 0) {
                console.log("!!! WALLET B TOTAL PROFIT:", uint256(totalPnL));
            }
        }
    }
}
