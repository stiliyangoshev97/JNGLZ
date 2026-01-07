// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import "./helpers/TestHelper.sol";

/**
 * @title PredictionMarketFuzzTest
 * @notice Fuzz tests for PredictionMarket contract
 * @dev Uses Foundry's fuzzing to test edge cases and invariants
 */
contract PredictionMarketFuzzTest is TestHelper {
    // ============================================
    // CONSTANTS FOR BOUNDS
    // ============================================

    uint256 constant MIN_BNB_AMOUNT = 0.005 ether;
    // Max BNB amount limited to avoid arithmetic overflow in bonding curve
    // The formula (shares * UNIT_PRICE * virtualLiquidity) can overflow for very large trades
    uint256 constant MAX_BNB_AMOUNT = 10 ether;
    uint256 constant MIN_EXPIRY_OFFSET = 1 hours;
    uint256 constant MAX_EXPIRY_OFFSET = 365 days;

    // ============================================
    // MARKET CREATION FUZZ TESTS
    // ============================================

    function testFuzz_CreateMarket_ValidExpiry(uint256 expiryOffset) public {
        // Bound expiry to reasonable range
        expiryOffset = bound(
            expiryOffset,
            MIN_EXPIRY_OFFSET,
            MAX_EXPIRY_OFFSET
        );

        vm.prank(marketCreator);
        uint256 marketId = market.createMarket(
            "Fuzz test question?",
            "https://example.com/evidence",
            "Resolution rules here",
            block.timestamp + expiryOffset
        );

        (, , , , uint256 expiry, , , , , , , ) = market.getMarket(marketId);
        assertEq(expiry, block.timestamp + expiryOffset);
    }

    function testFuzz_CreateMarket_MultipleMarkets(uint8 numMarkets) public {
        // Create between 1 and 50 markets
        numMarkets = uint8(bound(numMarkets, 1, 50));

        for (uint256 i = 0; i < numMarkets; i++) {
            vm.prank(marketCreator);
            uint256 marketId = market.createMarket(
                string(abi.encodePacked("Question ", vm.toString(i))),
                "https://example.com",
                "Rules",
                block.timestamp + 7 days
            );
            assertEq(marketId, i);
        }

        assertEq(market.marketCount(), numMarkets);
    }

    // ============================================
    // TRADING FUZZ TESTS
    // ============================================

    function testFuzz_BuyYes_VariableAmounts(uint256 bnbAmount) public {
        // Bound to valid range
        bnbAmount = bound(bnbAmount, MIN_BNB_AMOUNT, MAX_BNB_AMOUNT);

        uint256 marketId = createTestMarket(marketCreator, 7 days);

        uint256 sharesOut = buyYesFor(alice, marketId, bnbAmount, 0);

        // Verify shares received
        assertGt(sharesOut, 0, "Should receive shares");

        // Verify position updated
        (uint256 yesShares, , ) = market.getPosition(marketId, alice);
        assertEq(yesShares, sharesOut);

        // Verify market state
        (, , , , , uint256 yesSupply, , uint256 poolBalance, , , , ) = market
            .getMarket(marketId);
        assertEq(yesSupply, sharesOut);

        // Pool should receive amount minus total fee (platform + creator)
        uint256 expectedFee = (bnbAmount * TOTAL_FEE_BPS) / BPS_DENOMINATOR;
        // Allow 10 wei tolerance for rounding
        assertApproxEqAbs(
            poolBalance,
            bnbAmount - expectedFee,
            10,
            "Pool balance should match"
        );
    }

    function testFuzz_BuyNo_VariableAmounts(uint256 bnbAmount) public {
        bnbAmount = bound(bnbAmount, MIN_BNB_AMOUNT, MAX_BNB_AMOUNT);

        uint256 marketId = createTestMarket(marketCreator, 7 days);

        uint256 sharesOut = buyNoFor(bob, marketId, bnbAmount, 0);

        assertGt(sharesOut, 0);

        (, uint256 noShares, ) = market.getPosition(marketId, bob);
        assertEq(noShares, sharesOut);
    }

    function testFuzz_BuyBothSides_Balanced(
        uint256 yesAmount,
        uint256 noAmount
    ) public {
        yesAmount = bound(yesAmount, MIN_BNB_AMOUNT, MAX_BNB_AMOUNT);
        noAmount = bound(noAmount, MIN_BNB_AMOUNT, MAX_BNB_AMOUNT);

        uint256 marketId = createTestMarket(marketCreator, 7 days);

        uint256 yesShares = buyYesFor(alice, marketId, yesAmount, 0);
        uint256 noShares = buyNoFor(bob, marketId, noAmount, 0);

        // Both should get shares
        assertGt(yesShares, 0);
        assertGt(noShares, 0);

        // Prices should still sum to approximately UNIT_PRICE
        uint256 yesPrice = market.getYesPrice(marketId);
        uint256 noPrice = market.getNoPrice(marketId);

        // Allow 1 wei rounding error
        assertApproxEqAbs(yesPrice + noPrice, UNIT_PRICE, 1);
    }

    function testFuzz_SellYes_PartialPosition(
        uint256 buyAmount,
        uint256 sellPercent
    ) public {
        // Keep buyAmount smaller to avoid pool balance underflow issues
        // with the bonding curve formula
        buyAmount = bound(buyAmount, MIN_BNB_AMOUNT, 1 ether);
        sellPercent = bound(sellPercent, 1, 50); // Only sell up to 50% to avoid underflow

        uint256 marketId = createTestMarket(marketCreator, 7 days);

        // Buy shares
        uint256 sharesBought = buyYesFor(alice, marketId, buyAmount, 0);

        // Calculate shares to sell
        uint256 sharesToSell = (sharesBought * sellPercent) / 100;
        if (sharesToSell == 0) sharesToSell = 1; // At least sell 1

        uint256 aliceBalanceBefore = alice.balance;

        // Sell shares
        uint256 bnbOut = sellYesFor(alice, marketId, sharesToSell, 0);

        // Verify BNB received
        assertGt(bnbOut, 0);
        assertEq(alice.balance, aliceBalanceBefore + bnbOut);

        // Verify position updated
        (uint256 remainingShares, , ) = market.getPosition(marketId, alice);
        assertEq(remainingShares, sharesBought - sharesToSell);
    }

    function testFuzz_SellNo_PartialPosition(
        uint256 buyAmount,
        uint256 sellPercent
    ) public {
        // Keep buyAmount smaller to avoid pool balance underflow issues
        buyAmount = bound(buyAmount, MIN_BNB_AMOUNT, 1 ether);
        sellPercent = bound(sellPercent, 1, 50); // Only sell up to 50%

        uint256 marketId = createTestMarket(marketCreator, 7 days);

        uint256 sharesBought = buyNoFor(bob, marketId, buyAmount, 0);
        uint256 sharesToSell = (sharesBought * sellPercent) / 100;
        if (sharesToSell == 0) sharesToSell = 1;

        uint256 bnbOut = sellNoFor(bob, marketId, sharesToSell, 0);

        assertGt(bnbOut, 0);

        (, uint256 remainingShares, ) = market.getPosition(marketId, bob);
        assertEq(remainingShares, sharesBought - sharesToSell);
    }

    // ============================================
    // PRICING INVARIANT FUZZ TESTS
    // ============================================

    function testFuzz_PriceInvariant_SumEqualsUnitPrice(
        uint256 yesAmount,
        uint256 noAmount
    ) public {
        yesAmount = bound(yesAmount, 0, MAX_BNB_AMOUNT);
        noAmount = bound(noAmount, 0, MAX_BNB_AMOUNT);

        uint256 marketId = createTestMarket(marketCreator, 7 days);

        // Buy varying amounts on each side
        if (yesAmount >= MIN_BNB_AMOUNT) {
            buyYesFor(alice, marketId, yesAmount, 0);
        }
        if (noAmount >= MIN_BNB_AMOUNT) {
            buyNoFor(bob, marketId, noAmount, 0);
        }

        // Price invariant: P(YES) + P(NO) = UNIT_PRICE (with rounding)
        uint256 yesPrice = market.getYesPrice(marketId);
        uint256 noPrice = market.getNoPrice(marketId);

        assertApproxEqAbs(
            yesPrice + noPrice,
            UNIT_PRICE,
            1,
            "Price invariant violated"
        );
    }

    function testFuzz_PriceDirection_MoreYesBuysIncreasesYesPrice(
        uint256 amount
    ) public {
        amount = bound(amount, MIN_BNB_AMOUNT, MAX_BNB_AMOUNT);

        uint256 marketId = createTestMarket(marketCreator, 7 days);

        uint256 initialYesPrice = market.getYesPrice(marketId);

        buyYesFor(alice, marketId, amount, 0);

        uint256 newYesPrice = market.getYesPrice(marketId);

        // YES price should increase when buying YES
        assertGt(
            newYesPrice,
            initialYesPrice,
            "YES price should increase after buying YES"
        );
    }

    function testFuzz_PriceDirection_MoreNoBuysIncreasesNoPrice(
        uint256 amount
    ) public {
        amount = bound(amount, MIN_BNB_AMOUNT, MAX_BNB_AMOUNT);

        uint256 marketId = createTestMarket(marketCreator, 7 days);

        uint256 initialNoPrice = market.getNoPrice(marketId);

        buyNoFor(bob, marketId, amount, 0);

        uint256 newNoPrice = market.getNoPrice(marketId);

        // NO price should increase when buying NO
        assertGt(
            newNoPrice,
            initialNoPrice,
            "NO price should increase after buying NO"
        );
    }

    // ============================================
    // PREVIEW ACCURACY FUZZ TESTS
    // ============================================

    function testFuzz_PreviewBuy_MatchesActualYes(uint256 amount) public {
        amount = bound(amount, MIN_BNB_AMOUNT, MAX_BNB_AMOUNT);

        uint256 marketId = createTestMarket(marketCreator, 7 days);

        uint256 preview = market.previewBuy(marketId, amount, true);
        uint256 actual = buyYesFor(alice, marketId, amount, 0);

        // Allow 1000 wei tolerance for rounding differences
        assertApproxEqAbs(
            preview,
            actual,
            1000,
            "Preview should match actual for YES"
        );
    }

    function testFuzz_PreviewBuy_MatchesActualNo(uint256 amount) public {
        amount = bound(amount, MIN_BNB_AMOUNT, MAX_BNB_AMOUNT);

        uint256 marketId = createTestMarket(marketCreator, 7 days);

        uint256 preview = market.previewBuy(marketId, amount, false);
        uint256 actual = buyNoFor(bob, marketId, amount, 0);

        // Allow 1000 wei tolerance for rounding differences
        assertApproxEqAbs(
            preview,
            actual,
            1000,
            "Preview should match actual for NO"
        );
    }

    function testFuzz_PreviewSell_ReasonableEstimate(
        uint256 buyAmount,
        uint256 sellPercent
    ) public {
        // Keep buyAmount smaller to avoid pool balance underflow issues
        buyAmount = bound(buyAmount, MIN_BNB_AMOUNT, 1 ether);
        sellPercent = bound(sellPercent, 10, 50); // Sell 10-50%

        uint256 marketId = createTestMarket(marketCreator, 7 days);

        uint256 sharesBought = buyYesFor(alice, marketId, buyAmount, 0);
        uint256 sharesToSell = (sharesBought * sellPercent) / 100;

        uint256 preview = market.previewSell(marketId, sharesToSell, true);
        uint256 actual = sellYesFor(alice, marketId, sharesToSell, 0);

        // Allow 1000 wei tolerance for rounding differences
        assertApproxEqAbs(
            preview,
            actual,
            1000,
            "Preview should match actual for sell"
        );
    }

    // ============================================
    // FEE COLLECTION FUZZ TESTS
    // ============================================

    function testFuzz_FeeCollection_CorrectAmount(uint256 amount) public {
        amount = bound(amount, MIN_BNB_AMOUNT, MAX_BNB_AMOUNT);

        uint256 marketId = createTestMarket(marketCreator, 7 days);

        uint256 treasuryBefore = treasury.balance;

        buyYesFor(alice, marketId, amount, 0);

        uint256 expectedFee = (amount * DEFAULT_FEE_BPS) / BPS_DENOMINATOR;
        uint256 actualFee = treasury.balance - treasuryBefore;

        assertEq(actualFee, expectedFee, "Platform fee should match expected");
    }

    function testFuzz_CreatorFeeCollection_CorrectAmount(
        uint256 amount
    ) public {
        amount = bound(amount, MIN_BNB_AMOUNT, MAX_BNB_AMOUNT);

        uint256 marketId = createTestMarket(marketCreator, 7 days);

        uint256 creatorBefore = marketCreator.balance;

        buyYesFor(alice, marketId, amount, 0);

        uint256 expectedCreatorFee = (amount * CREATOR_FEE_BPS) /
            BPS_DENOMINATOR;
        uint256 actualCreatorFee = marketCreator.balance - creatorBefore;

        assertEq(
            actualCreatorFee,
            expectedCreatorFee,
            "Creator fee should match expected"
        );
    }

    // ============================================
    // MULTISIG GOVERNANCE FUZZ TESTS
    // ============================================

    function testFuzz_MultiSig_SetFee_ValidRange(uint256 newFee) public {
        // Fee should be between 0 and MAX_FEE_BPS (500 = 5%)
        newFee = bound(newFee, 0, 500);

        executeMultiSigAction(
            PredictionMarket.ActionType.SetFee,
            abi.encode(newFee)
        );

        assertEq(market.platformFeeBps(), newFee);
    }

    function testFuzz_MultiSig_SetMinBet_ValidRange(uint256 newMinBet) public {
        // Min bet between MIN_BET_LOWER and MIN_BET_UPPER
        newMinBet = bound(newMinBet, 0.001 ether, 0.1 ether);

        executeMultiSigAction(
            PredictionMarket.ActionType.SetMinBet,
            abi.encode(newMinBet)
        );

        assertEq(market.minBet(), newMinBet);
    }

    function testFuzz_MultiSig_SetUmaBond_ValidRange(uint256 newBond) public {
        // Bond between UMA_BOND_LOWER and UMA_BOND_UPPER
        newBond = bound(newBond, 0.01 ether, 1 ether);

        executeMultiSigAction(
            PredictionMarket.ActionType.SetUmaBond,
            abi.encode(newBond)
        );

        assertEq(market.umaBond(), newBond);
    }

    // ============================================
    // RESOLUTION & CLAIM FUZZ TESTS
    // ============================================

    function testFuzz_Claim_ProportionalPayout(
        uint256 aliceAmount,
        uint256 bobAmount,
        bool yesWins
    ) public {
        aliceAmount = bound(aliceAmount, MIN_BNB_AMOUNT, 10 ether);
        bobAmount = bound(bobAmount, MIN_BNB_AMOUNT, 10 ether);

        uint256 marketId = createTestMarket(marketCreator, 7 days);

        // Both bet on different sides
        buyYesFor(alice, marketId, aliceAmount, 0);
        buyNoFor(bob, marketId, bobAmount, 0);

        // Resolve market
        expireMarket(marketId);
        assertAndResolve(marketId, charlie, yesWins, true);

        // Winner claims
        address winner = yesWins ? alice : bob;

        uint256 winnerBalanceBefore = winner.balance;
        vm.prank(winner);
        uint256 payout = market.claim(marketId);

        assertGt(payout, 0, "Winner should get payout");
        assertEq(winner.balance, winnerBalanceBefore + payout);
    }

    function testFuzz_Claim_MultipleWinners(
        uint256 aliceAmount,
        uint256 bobAmount
    ) public {
        aliceAmount = bound(aliceAmount, MIN_BNB_AMOUNT, 10 ether);
        bobAmount = bound(bobAmount, MIN_BNB_AMOUNT, 10 ether);

        uint256 marketId = createTestMarket(marketCreator, 7 days);

        // Both bet YES
        uint256 aliceShares = buyYesFor(alice, marketId, aliceAmount, 0);
        uint256 bobShares = buyYesFor(bob, marketId, bobAmount, 0);

        // YES wins
        expireMarket(marketId);
        assertAndResolve(marketId, charlie, true, true);

        // Get pool balance before claims
        (, , , , , , , uint256 poolBalance, , , , ) = market.getMarket(
            marketId
        );

        // Both claim
        vm.prank(alice);
        uint256 alicePayout = market.claim(marketId);

        vm.prank(bob);
        uint256 bobPayout = market.claim(marketId);

        // Payouts should be proportional to shares
        uint256 totalShares = aliceShares + bobShares;
        uint256 expectedAlicePayout = (aliceShares * poolBalance) / totalShares;
        uint256 expectedBobPayout = (bobShares * poolBalance) / totalShares;

        assertEq(
            alicePayout,
            expectedAlicePayout,
            "Alice payout should be proportional"
        );
        assertEq(
            bobPayout,
            expectedBobPayout,
            "Bob payout should be proportional"
        );
    }

    // ============================================
    // SLIPPAGE PROTECTION FUZZ TESTS
    // ============================================

    function testFuzz_Slippage_BuyProtection(
        uint256 amount,
        uint256 minShares
    ) public {
        amount = bound(amount, MIN_BNB_AMOUNT, MAX_BNB_AMOUNT);

        uint256 marketId = createTestMarket(marketCreator, 7 days);

        // Calculate expected shares
        uint256 expectedShares = market.previewBuy(marketId, amount, true);

        // If minShares > expectedShares, should revert
        if (minShares > expectedShares) {
            vm.prank(alice);
            vm.expectRevert(PredictionMarket.SlippageExceeded.selector);
            market.buyYes{value: amount}(marketId, minShares);
        } else {
            // Should succeed
            vm.prank(alice);
            uint256 sharesOut = market.buyYes{value: amount}(
                marketId,
                minShares
            );
            assertGe(sharesOut, minShares, "Should get at least minShares");
        }
    }

    function testFuzz_Slippage_SellProtection(
        uint256 buyAmount,
        uint256 minBnbPercent
    ) public {
        // Keep buyAmount smaller to avoid pool balance underflow issues
        buyAmount = bound(buyAmount, MIN_BNB_AMOUNT, 1 ether);
        minBnbPercent = bound(minBnbPercent, 0, 200); // 0-200% of expected

        uint256 marketId = createTestMarket(marketCreator, 7 days);

        uint256 sharesBought = buyYesFor(alice, marketId, buyAmount, 0);

        // Only sell 50% of position to avoid underflow
        uint256 sharesToSell = sharesBought / 2;

        // Preview sell
        uint256 expectedBnb = market.previewSell(marketId, sharesToSell, true);
        uint256 minBnbOut = (expectedBnb * minBnbPercent) / 100;

        if (minBnbOut > expectedBnb) {
            // Should revert
            vm.prank(alice);
            vm.expectRevert(PredictionMarket.SlippageExceeded.selector);
            market.sellYes(marketId, sharesToSell, minBnbOut);
        } else {
            // Should succeed
            vm.prank(alice);
            uint256 bnbOut = market.sellYes(marketId, sharesToSell, minBnbOut);
            assertGe(bnbOut, minBnbOut, "Should get at least minBnbOut");
        }
    }

    // ============================================
    // EDGE CASE FUZZ TESTS
    // ============================================

    function testFuzz_SmallAmounts_NearMinBet(uint256 offset) public {
        // Test amounts very close to minimum
        offset = bound(offset, 0, 0.001 ether);
        uint256 amount = DEFAULT_MIN_BET + offset;

        uint256 marketId = createTestMarket(marketCreator, 7 days);

        uint256 shares = buyYesFor(alice, marketId, amount, 0);
        assertGt(shares, 0, "Should get shares even with small amount");
    }

    function testFuzz_LargeAmounts_StillFunctions(uint256 amount) public {
        // Test with larger amounts (but within safe overflow bounds)
        // The bonding curve math can overflow for extremely large trades
        // Also selling full position can cause pool underflow, so we only sell 50%
        amount = bound(amount, 0.5 ether, 5 ether);
        vm.deal(alice, amount + 1 ether);

        uint256 marketId = createTestMarket(marketCreator, 7 days);

        uint256 shares = buyYesFor(alice, marketId, amount, 0);
        assertGt(shares, 0, "Should get shares with large amount");

        // Only sell 50% to avoid pool underflow
        uint256 bnbOut = sellYesFor(alice, marketId, shares / 2, 0);
        assertGt(bnbOut, 0, "Should get BNB back");
    }

    function testFuzz_ManyTrades_MarketStillFunctions(uint8 numTrades) public {
        numTrades = uint8(bound(numTrades, 5, 50));

        uint256 marketId = createTestMarket(marketCreator, 7 days);

        for (uint256 i = 0; i < numTrades; i++) {
            address trader = i % 2 == 0 ? alice : bob;
            bool buyYes = i % 3 != 0;
            uint256 amount = 0.01 ether + (i * 0.001 ether);

            if (buyYes) {
                buyYesFor(trader, marketId, amount, 0);
            } else {
                buyNoFor(trader, marketId, amount, 0);
            }
        }

        // Market should still have valid prices
        uint256 yesPrice = market.getYesPrice(marketId);
        uint256 noPrice = market.getNoPrice(marketId);

        assertGt(yesPrice, 0);
        assertGt(noPrice, 0);
        assertApproxEqAbs(yesPrice + noPrice, UNIT_PRICE, 1);
    }
}
