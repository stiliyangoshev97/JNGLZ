// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import "forge-std/Test.sol";
import "../src/PredictionMarket.sol";

/**
 * @title AMM Bug Investigation Tests
 * @notice Consolidated tests documenting AMM formula bugs discovered on 2026-01-23
 *
 * BUGS FOUND:
 * 1. createMarketAndBuy() doesn't charge creator fee (only platform fee)
 * 2. AMM sell formula is non-linear - selling in parts gives MORE than selling all at once
 * 3. After selling partial shares, remaining shares may become unsellable (pool insufficient)
 * 4. Trade event emits gross for buy, net for sell (inconsistent display)
 */
contract AMMBugInvestigation is Test {
    PredictionMarket marketContract;
    address user = address(0x1234);
    address treasury = address(0x5678);

    uint256 constant UNIT_PRICE = 0.01 ether;
    uint256 constant BPS_DENOMINATOR = 10000;
    uint256 constant PLATFORM_FEE_BPS = 100;
    uint256 constant CREATOR_FEE_BPS = 50;
    uint256 constant TOTAL_FEE_BPS = 150;
    uint256 constant VIRTUAL_LIQUIDITY = 200e18;

    function setUp() public {
        address[3] memory signers = [address(this), address(0x1), address(0x2)];
        marketContract = new PredictionMarket(signers, treasury);
        vm.deal(user, 100 ether);
    }

    // ============================================
    // BUG #1: createMarketAndBuy missing creator fee - FIXED!
    // ============================================

    function test_BUG1_FIXED_CreateMarketAndBuyChargesCreatorFee() public {
        uint256 treasuryBefore = treasury.balance;
        uint256 userBefore = user.balance;

        vm.prank(user);
        (uint256 marketId, uint256 shares) = marketContract.createMarketAndBuy{
            value: 1 ether
        }(
            "Test market",
            "",
            "",
            "",
            block.timestamp + 1 days,
            PredictionMarket.HeatLevel.HIGH,
            true,
            0
        );

        uint256 feeCollected = treasury.balance - treasuryBefore;

        // FIXED: Platform fee (1%) goes to treasury
        assertEq(
            feeCollected,
            0.01 ether,
            "Platform fee (1%) sent to treasury"
        );

        // FIXED: Creator fee (0.5%) credited via Pull Pattern
        // In createMarketAndBuy, creator = msg.sender, so they pay themselves
        uint256 pendingCreatorFee = marketContract.getPendingCreatorFees(user);
        assertEq(
            pendingCreatorFee,
            0.005 ether,
            "Creator fee (0.5%) credited to creator"
        );

        // FIXED: User gets 197 shares (not 198) - correct with 1.5% fee
        assertEq(shares, 197e18, "User gets correct shares with 1.5% fee");

        // Verify pool balance is correct: 1 BNB - 1.5% fee = 0.985 BNB
        (
            ,
            ,
            ,
            ,
            ,
            ,
            ,
            ,
            // question
            // evidenceLink
            // resolutionRules
            // imageUrl
            // creator
            // expiryTimestamp
            // yesSupply
            // noSupply
            uint256 poolBalance, // resolved // outcome
            ,

        ) = marketContract.getMarket(marketId);
        assertEq(
            poolBalance,
            0.985 ether,
            "Pool has correct balance after 1.5% fee"
        );
    }

    // ============================================
    // BUG #2: AMM Sell Formula Non-Linearity
    // ============================================

    function test_BUG2_SellFormulaNotLinear() public {
        // Create market and buy
        vm.prank(user);
        marketContract.createMarket(
            "Test",
            "",
            "",
            "",
            block.timestamp + 1 days,
            PredictionMarket.HeatLevel.HIGH
        );

        vm.prank(user);
        uint256 shares = marketContract.buyYes{value: 1 ether}(0, 0);

        // Preview selling ALL vs parts
        uint256 previewAll = marketContract.previewSell(0, shares, true);
        uint256 preview25 = marketContract.previewSell(
            0,
            (shares * 25) / 100,
            true
        );
        uint256 preview50 = marketContract.previewSell(
            0,
            (shares * 50) / 100,
            true
        );
        uint256 preview75 = marketContract.previewSell(
            0,
            (shares * 75) / 100,
            true
        );

        // BUG: Partial sells return DISPROPORTIONATELY more!
        // 25% of shares should return ~25% of value, but returns much more
        uint256 ratio25 = (preview25 * 100) / previewAll;
        uint256 ratio50 = (preview50 * 100) / previewAll;
        uint256 ratio75 = (preview75 * 100) / previewAll;

        assertGt(ratio25, 25, "25% sell returns more than 25%");
        assertGt(ratio50, 50, "50% sell returns more than 50%");
        assertGt(ratio75, 75, "75% sell returns more than 75%");
    }

    // ============================================
    // BUG #3: Partial Sell Makes Remaining Unsellable
    // ============================================

    function test_BUG3_PartialSellMakesRemainingUnsellable() public {
        // Create market and buy
        vm.prank(user);
        marketContract.createMarket(
            "Test",
            "",
            "",
            "",
            block.timestamp + 1 days,
            PredictionMarket.HeatLevel.HIGH
        );

        vm.prank(user);
        uint256 shares = marketContract.buyYes{value: 1 ether}(0, 0);

        // Sell half
        uint256 halfShares = shares / 2;
        vm.prank(user);
        marketContract.sellYes(0, halfShares, 0);

        // Try to sell remaining half - should FAIL
        uint256 remaining = shares - halfShares;
        vm.prank(user);
        vm.expectRevert(PredictionMarket.InsufficientPoolBalance.selector);
        marketContract.sellYes(0, remaining, 0);
    }

    // ============================================
    // BUG #4: Test Various Partial Sell Percentages
    // ============================================

    function test_BUG4_AllPartialSellsOverpriced() public {
        vm.prank(user);
        marketContract.createMarket(
            "Test",
            "",
            "",
            "",
            block.timestamp + 1 days,
            PredictionMarket.HeatLevel.HIGH
        );

        vm.prank(user);
        uint256 shares = marketContract.buyYes{value: 1 ether}(0, 0);

        uint256 previewAll = marketContract.previewSell(0, shares, true);

        // Test 10%, 25%, 50%, 75%, 90%
        uint256 preview10 = marketContract.previewSell(
            0,
            (shares * 10) / 100,
            true
        );
        uint256 preview25 = marketContract.previewSell(
            0,
            (shares * 25) / 100,
            true
        );
        uint256 preview50 = marketContract.previewSell(
            0,
            (shares * 50) / 100,
            true
        );
        uint256 preview75 = marketContract.previewSell(
            0,
            (shares * 75) / 100,
            true
        );
        uint256 preview90 = marketContract.previewSell(
            0,
            (shares * 90) / 100,
            true
        );

        // All partial sells are overpriced (return more than proportional share)
        assertGt((preview10 * 100) / previewAll, 10, "10% overpriced");
        assertGt((preview25 * 100) / previewAll, 25, "25% overpriced");
        assertGt((preview50 * 100) / previewAll, 50, "50% overpriced");
        assertGt((preview75 * 100) / previewAll, 75, "75% overpriced");
        assertGt((preview90 * 100) / previewAll, 90, "90% overpriced");
    }

    // ============================================
    // Analysis: Sum of parts exceeds whole
    // ============================================

    function test_SumOfPartsExceedsWhole() public {
        vm.prank(user);
        marketContract.createMarket(
            "Test",
            "",
            "",
            "",
            block.timestamp + 1 days,
            PredictionMarket.HeatLevel.HIGH
        );

        vm.prank(user);
        uint256 shares = marketContract.buyYes{value: 1 ether}(0, 0);

        uint256 previewAll = marketContract.previewSell(0, shares, true);
        uint256 previewHalf1 = marketContract.previewSell(0, shares / 2, true);

        // After first half is sold, state changes - calculate second half
        // For this we use pure math since we can't actually sell twice in preview
        uint256 grossAll = _calcSellGross(shares, 0, shares);
        uint256 grossHalf1 = _calcSellGross(shares, 0, shares / 2);
        uint256 grossHalf2 = _calcSellGross(shares / 2, 0, shares / 2); // After first sell

        // Sum of selling in parts > selling all at once
        assertGt(
            grossHalf1 + grossHalf2,
            grossAll,
            "Sum of parts exceeds whole - arbitrage possible!"
        );
    }

    function _calcSellGross(
        uint256 yesSupply,
        uint256 noSupply,
        uint256 sharesToSell
    ) internal pure returns (uint256) {
        uint256 virtualYes = yesSupply + VIRTUAL_LIQUIDITY;
        uint256 virtualNo = noSupply + VIRTUAL_LIQUIDITY;
        uint256 totalVirtual = virtualYes + virtualNo;

        uint256 virtualYesAfter = virtualYes - sharesToSell;
        uint256 totalVirtualAfter = totalVirtual - sharesToSell;

        return
            (sharesToSell * UNIT_PRICE * virtualYesAfter) /
            (totalVirtualAfter * 1e18);
    }
}
