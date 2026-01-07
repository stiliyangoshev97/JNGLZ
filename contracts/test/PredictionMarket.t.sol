// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import "./helpers/TestHelper.sol";

/**
 * @title PredictionMarketTest
 * @notice Comprehensive tests for PredictionMarket contract
 */
contract PredictionMarketTest is TestHelper {
    // ============================================
    // MARKET CREATION TESTS
    // ============================================

    function test_CreateMarket_Success() public {
        uint256 expiryTime = block.timestamp + 7 days;

        vm.prank(marketCreator);
        uint256 marketId = market.createMarket(
            "Will BTC hit $100k?",
            "https://coinmarketcap.com/currencies/bitcoin/",
            "Resolve YES if BTC > $100,000 USD at expiry",
            expiryTime
        );

        assertEq(marketId, 0, "First market should have ID 0");
        assertEq(market.marketCount(), 1, "Market count should be 1");

        (
            string memory question,
            string memory evidenceLink,
            string memory resolutionRules,
            address creator,
            uint256 expiry,
            uint256 yesSupply,
            uint256 noSupply,
            uint256 poolBalance,
            bool resolved,
            ,
            ,

        ) = market.getMarket(marketId);

        assertEq(question, "Will BTC hit $100k?");
        assertEq(evidenceLink, "https://coinmarketcap.com/currencies/bitcoin/");
        assertEq(
            resolutionRules,
            "Resolve YES if BTC > $100,000 USD at expiry"
        );
        assertEq(creator, marketCreator);
        assertEq(expiry, expiryTime);
        assertEq(yesSupply, 0);
        assertEq(noSupply, 0);
        assertEq(poolBalance, 0);
        assertFalse(resolved);
    }

    function test_CreateMarket_EmitsEvent() public {
        uint256 expiryTime = block.timestamp + 7 days;

        vm.expectEmit(true, true, false, true);
        emit PredictionMarket.MarketCreated(
            0,
            marketCreator,
            "Test question",
            expiryTime
        );

        vm.prank(marketCreator);
        market.createMarket(
            "Test question",
            "https://example.com",
            "Rules",
            expiryTime
        );
    }

    function test_CreateMarket_RevertOnEmptyQuestion() public {
        vm.prank(marketCreator);
        vm.expectRevert(PredictionMarket.EmptyQuestion.selector);
        market.createMarket(
            "",
            "https://example.com",
            "Rules",
            block.timestamp + 1 days
        );
    }

    function test_CreateMarket_RevertOnEmptyEvidenceLink() public {
        vm.prank(marketCreator);
        vm.expectRevert(PredictionMarket.EmptyEvidenceLink.selector);
        market.createMarket("Question", "", "Rules", block.timestamp + 1 days);
    }

    function test_CreateMarket_RevertOnPastExpiry() public {
        vm.prank(marketCreator);
        vm.expectRevert(PredictionMarket.InvalidExpiryTimestamp.selector);
        market.createMarket(
            "Question",
            "https://example.com",
            "Rules",
            block.timestamp - 1
        );
    }

    // ============================================
    // TRADING TESTS - BUY
    // ============================================

    function test_BuyYes_Success() public {
        uint256 marketId = createTestMarket(marketCreator, 7 days);

        uint256 aliceBalanceBefore = alice.balance;
        uint256 sharesOut = buyYesFor(alice, marketId, 0.1 ether, 0);

        assertGt(sharesOut, 0, "Should receive shares");

        (uint256 yesShares, uint256 noShares, ) = market.getPosition(
            marketId,
            alice
        );
        assertEq(yesShares, sharesOut, "Position should match");
        assertEq(noShares, 0, "Should have no NO shares");

        assertLt(alice.balance, aliceBalanceBefore, "Should spend BNB");
    }

    function test_BuyNo_Success() public {
        uint256 marketId = createTestMarket(marketCreator, 7 days);

        uint256 sharesOut = buyNoFor(bob, marketId, 0.1 ether, 0);

        assertGt(sharesOut, 0, "Should receive shares");

        (uint256 yesShares, uint256 noShares, ) = market.getPosition(
            marketId,
            bob
        );
        assertEq(yesShares, 0, "Should have no YES shares");
        assertEq(noShares, sharesOut, "Position should match");
    }

    function test_Buy_UpdatesMarketState() public {
        uint256 marketId = createTestMarket(marketCreator, 7 days);

        buyYesFor(alice, marketId, 0.1 ether, 0);
        buyNoFor(bob, marketId, 0.05 ether, 0);

        (
            ,
            ,
            ,
            ,
            ,
            uint256 yesSupply,
            uint256 noSupply,
            uint256 poolBalance,
            ,
            ,
            ,

        ) = market.getMarket(marketId);

        assertGt(yesSupply, 0, "YES supply should increase");
        assertGt(noSupply, 0, "NO supply should increase");
        assertGt(poolBalance, 0, "Pool should have BNB");
    }

    function test_Buy_CollectsFees() public {
        uint256 marketId = createTestMarket(marketCreator, 7 days);

        uint256 treasuryBefore = treasury.balance;
        buyYesFor(alice, marketId, 1 ether, 0);

        uint256 expectedFee = (1 ether * DEFAULT_FEE_BPS) / BPS_DENOMINATOR;
        assertEq(
            treasury.balance - treasuryBefore,
            expectedFee,
            "Treasury should receive fee"
        );
    }

    function test_Buy_RevertBelowMinBet() public {
        uint256 marketId = createTestMarket(marketCreator, 7 days);

        vm.prank(alice);
        vm.expectRevert(PredictionMarket.BelowMinBet.selector);
        market.buyYes{value: 0.001 ether}(marketId, 0); // Below 0.005 min
    }

    function test_Buy_RevertOnExpiredMarket() public {
        uint256 marketId = createTestMarket(marketCreator, 7 days);

        // Fast forward past expiry
        expireMarket(marketId);

        vm.prank(alice);
        vm.expectRevert(PredictionMarket.MarketNotActive.selector);
        market.buyYes{value: 0.1 ether}(marketId, 0);
    }

    function test_Buy_SlippageProtection() public {
        uint256 marketId = createTestMarket(marketCreator, 7 days);

        // Request impossibly high shares
        vm.prank(alice);
        vm.expectRevert(PredictionMarket.SlippageExceeded.selector);
        market.buyYes{value: 0.1 ether}(marketId, 1000000 ether);
    }

    // ============================================
    // TRADING TESTS - SELL
    // ============================================

    function test_SellYes_Success() public {
        uint256 marketId = createTestMarket(marketCreator, 7 days);

        // Buy first
        uint256 sharesBought = buyYesFor(alice, marketId, 1 ether, 0);

        // Sell half
        uint256 sharesToSell = sharesBought / 2;
        uint256 aliceBalanceBefore = alice.balance;

        uint256 bnbOut = sellYesFor(alice, marketId, sharesToSell, 0);

        assertGt(bnbOut, 0, "Should receive BNB");
        assertGt(alice.balance, aliceBalanceBefore, "Balance should increase");

        (uint256 yesShares, , ) = market.getPosition(marketId, alice);
        assertEq(
            yesShares,
            sharesBought - sharesToSell,
            "Shares should decrease"
        );
    }

    function test_SellNo_Success() public {
        uint256 marketId = createTestMarket(marketCreator, 7 days);

        uint256 sharesBought = buyNoFor(bob, marketId, 1 ether, 0);

        uint256 sharesToSell = sharesBought / 2;
        uint256 bnbOut = sellNoFor(bob, marketId, sharesToSell, 0);

        assertGt(bnbOut, 0, "Should receive BNB");

        (, uint256 noShares, ) = market.getPosition(marketId, bob);
        assertEq(
            noShares,
            sharesBought - sharesToSell,
            "Shares should decrease"
        );
    }

    function test_Sell_RevertInsufficientShares() public {
        uint256 marketId = createTestMarket(marketCreator, 7 days);

        buyYesFor(alice, marketId, 0.1 ether, 0);

        vm.prank(alice);
        vm.expectRevert(PredictionMarket.InsufficientShares.selector);
        market.sellYes(marketId, 1000000 ether, 0); // More than owned
    }

    function test_Sell_SlippageProtection() public {
        uint256 marketId = createTestMarket(marketCreator, 7 days);

        uint256 sharesBought = buyYesFor(alice, marketId, 1 ether, 0);

        // Sell only a SMALL portion of shares (10%) so pool definitely has enough
        // This ensures we test slippage, not pool balance
        uint256 sharesToSell = sharesBought / 10;

        // Preview what we'd actually get for this small amount
        uint256 previewBnb = market.previewSell(marketId, sharesToSell, true);

        // Ask for 50% more than we'd actually get - should trigger SlippageExceeded
        uint256 unreasonableMinOut = previewBnb + (previewBnb / 2);

        vm.prank(alice);
        vm.expectRevert(PredictionMarket.SlippageExceeded.selector);
        market.sellYes(marketId, sharesToSell, unreasonableMinOut);
    }

    // ============================================
    // PRICING TESTS
    // ============================================

    function test_InitialPrices_Are50_50() public {
        uint256 marketId = createTestMarket(marketCreator, 7 days);

        uint256 yesPrice = market.getYesPrice(marketId);
        uint256 noPrice = market.getNoPrice(marketId);

        // With 0 supply and 100 virtual liquidity each:
        // YES price = 0.01 * 100 / 200 = 0.005 BNB
        // NO price = 0.01 * 100 / 200 = 0.005 BNB
        assertEq(
            yesPrice,
            0.005 ether,
            "Initial YES price should be 0.005 BNB"
        );
        assertEq(noPrice, 0.005 ether, "Initial NO price should be 0.005 BNB");
        assertEq(
            yesPrice + noPrice,
            UNIT_PRICE,
            "Prices should sum to unit price"
        );
    }

    function test_PricesShift_OnBuy() public {
        uint256 marketId = createTestMarket(marketCreator, 7 days);

        uint256 initialYesPrice = market.getYesPrice(marketId);

        // Buy a lot of YES shares
        buyYesFor(alice, marketId, 5 ether, 0);

        uint256 newYesPrice = market.getYesPrice(marketId);
        uint256 newNoPrice = market.getNoPrice(marketId);

        assertGt(newYesPrice, initialYesPrice, "YES price should increase");
        // Allow for 1 wei rounding error due to integer division
        assertApproxEqAbs(
            newYesPrice + newNoPrice,
            UNIT_PRICE,
            1,
            "Prices should still sum to unit price (within rounding)"
        );
    }

    function test_PreviewBuy_MatchesActual() public {
        uint256 marketId = createTestMarket(marketCreator, 7 days);

        uint256 previewShares = market.previewBuy(marketId, 0.5 ether, true);
        uint256 actualShares = buyYesFor(alice, marketId, 0.5 ether, 0);

        assertEq(
            previewShares,
            actualShares,
            "Preview should match actual shares"
        );
    }

    // ============================================
    // RESOLUTION TESTS
    // ============================================

    function test_AssertOutcome_Success() public {
        uint256 marketId = createTestMarket(marketCreator, 7 days);

        // Some trading
        buyYesFor(alice, marketId, 1 ether, 0);

        // Expire the market
        expireMarket(marketId);

        // Setup WBNB for assertion
        setupWbnbForAssertion(charlie, DEFAULT_UMA_BOND);

        // Assert outcome
        vm.prank(charlie);
        bytes32 assertionId = market.assertOutcome(marketId, true);

        assertNotEq(assertionId, bytes32(0), "Should get assertion ID");

        // Check market state
        (
            ,
            ,
            ,
            ,
            ,
            ,
            ,
            ,
            ,
            ,
            bytes32 storedAssertionId,
            address asserter
        ) = market.getMarket(marketId);
        assertEq(
            storedAssertionId,
            assertionId,
            "Assertion ID should be stored"
        );
        assertEq(asserter, charlie, "Asserter should be stored");
    }

    function test_AssertOutcome_RevertIfNotExpired() public {
        uint256 marketId = createTestMarket(marketCreator, 7 days);

        setupWbnbForAssertion(charlie, DEFAULT_UMA_BOND);

        vm.prank(charlie);
        vm.expectRevert(PredictionMarket.MarketNotExpired.selector);
        market.assertOutcome(marketId, true);
    }

    function test_Resolution_YesWins() public {
        uint256 marketId = createTestMarket(marketCreator, 7 days);

        // Alice bets YES, Bob bets NO
        buyYesFor(alice, marketId, 1 ether, 0);
        buyNoFor(bob, marketId, 1 ether, 0);

        // Expire and resolve YES
        expireMarket(marketId);
        assertAndResolve(marketId, charlie, true, true);

        // Check resolution
        (, , , , , , , , bool resolved, bool outcome, , ) = market.getMarket(
            marketId
        );
        assertTrue(resolved, "Market should be resolved");
        assertTrue(outcome, "Outcome should be YES");
    }

    function test_Resolution_NoWins() public {
        uint256 marketId = createTestMarket(marketCreator, 7 days);

        buyYesFor(alice, marketId, 1 ether, 0);
        buyNoFor(bob, marketId, 1 ether, 0);

        expireMarket(marketId);
        assertAndResolve(marketId, charlie, false, true);

        (, , , , , , , , bool resolved, bool outcome, , ) = market.getMarket(
            marketId
        );
        assertTrue(resolved, "Market should be resolved");
        assertFalse(outcome, "Outcome should be NO");
    }

    function test_Resolution_DisputedAssertion() public {
        uint256 marketId = createTestMarket(marketCreator, 7 days);

        buyYesFor(alice, marketId, 1 ether, 0);

        expireMarket(marketId);

        // First assertion (disputed/lost)
        setupWbnbForAssertion(charlie, DEFAULT_UMA_BOND);
        vm.prank(charlie);
        bytes32 firstAssertionId = market.assertOutcome(marketId, true);

        // UMA says it was NOT truthful
        umaOOv3.resolveAssertion(firstAssertionId, false);

        // Market should NOT be resolved, can assert again
        (, , , , , , , , bool resolved, , , ) = market.getMarket(marketId);
        assertFalse(
            resolved,
            "Market should not be resolved after disputed assertion"
        );

        // Now assert correctly
        assertAndResolve(marketId, bob, false, true);

        (, , , , , , , , bool resolvedNow, bool outcome, , ) = market.getMarket(
            marketId
        );
        assertTrue(resolvedNow, "Market should be resolved now");
        assertFalse(outcome, "Outcome should be NO");
    }

    // ============================================
    // CLAIM TESTS
    // ============================================

    function test_Claim_WinnerGetsPool() public {
        uint256 marketId = createTestMarket(marketCreator, 7 days);

        // Alice bets YES, Bob bets NO
        buyYesFor(alice, marketId, 1 ether, 0);
        buyNoFor(bob, marketId, 1 ether, 0);

        // Resolve YES wins
        expireMarket(marketId);
        assertAndResolve(marketId, charlie, true, true);

        // Alice claims
        uint256 aliceBalanceBefore = alice.balance;
        vm.prank(alice);
        uint256 payout = market.claim(marketId);

        assertGt(payout, 0, "Alice should get payout");
        assertGt(
            alice.balance,
            aliceBalanceBefore,
            "Alice balance should increase"
        );

        // Check position claimed
        (, , bool claimed) = market.getPosition(marketId, alice);
        assertTrue(claimed, "Position should be marked claimed");
    }

    function test_Claim_LoserGetsNothing() public {
        uint256 marketId = createTestMarket(marketCreator, 7 days);

        buyYesFor(alice, marketId, 1 ether, 0);
        buyNoFor(bob, marketId, 1 ether, 0);

        // YES wins
        expireMarket(marketId);
        assertAndResolve(marketId, charlie, true, true);

        // Bob (loser) tries to claim
        vm.prank(bob);
        vm.expectRevert(PredictionMarket.NothingToClaim.selector);
        market.claim(marketId);
    }

    function test_Claim_RevertIfNotResolved() public {
        uint256 marketId = createTestMarket(marketCreator, 7 days);

        buyYesFor(alice, marketId, 1 ether, 0);

        vm.prank(alice);
        vm.expectRevert(PredictionMarket.MarketNotAsserted.selector);
        market.claim(marketId);
    }

    function test_Claim_RevertIfAlreadyClaimed() public {
        uint256 marketId = createTestMarket(marketCreator, 7 days);

        buyYesFor(alice, marketId, 1 ether, 0);

        expireMarket(marketId);
        assertAndResolve(marketId, charlie, true, true);

        // First claim
        vm.prank(alice);
        market.claim(marketId);

        // Second claim reverts
        vm.prank(alice);
        vm.expectRevert(PredictionMarket.AlreadyClaimed.selector);
        market.claim(marketId);
    }

    // ============================================
    // MULTISIG GOVERNANCE TESTS
    // ============================================

    function test_MultiSig_SetFee() public {
        uint256 newFee = 200; // 2%

        executeMultiSigAction(
            PredictionMarket.ActionType.SetFee,
            abi.encode(newFee)
        );

        assertEq(market.platformFeeBps(), newFee, "Fee should be updated");
    }

    function test_MultiSig_SetMinBet() public {
        uint256 newMinBet = 0.01 ether;

        executeMultiSigAction(
            PredictionMarket.ActionType.SetMinBet,
            abi.encode(newMinBet)
        );

        assertEq(market.minBet(), newMinBet, "Min bet should be updated");
    }

    function test_MultiSig_Pause() public {
        executeMultiSigAction(PredictionMarket.ActionType.Pause, "");

        assertTrue(market.paused(), "Contract should be paused");
    }

    function test_MultiSig_Unpause() public {
        // First pause
        executeMultiSigAction(PredictionMarket.ActionType.Pause, "");

        // Then unpause
        executeMultiSigAction(PredictionMarket.ActionType.Unpause, "");

        assertFalse(market.paused(), "Contract should be unpaused");
    }

    function test_MultiSig_RevertNonSigner() public {
        vm.prank(alice);
        vm.expectRevert(PredictionMarket.NotSigner.selector);
        market.proposeAction(
            PredictionMarket.ActionType.SetFee,
            abi.encode(200)
        );
    }

    function test_MultiSig_RevertFeeTooHigh() public {
        uint256 tooHighFee = 600; // 6% > 5% max

        // Propose
        vm.prank(signer1);
        uint256 actionId = market.proposeAction(
            PredictionMarket.ActionType.SetFee,
            abi.encode(tooHighFee)
        );

        // Confirm
        vm.prank(signer2);
        market.confirmAction(actionId);

        // Third confirm should revert on execute
        vm.prank(signer3);
        vm.expectRevert(PredictionMarket.InvalidFee.selector);
        market.confirmAction(actionId);
    }

    function test_MultiSig_ActionExpiry() public {
        vm.prank(signer1);
        uint256 actionId = market.proposeAction(
            PredictionMarket.ActionType.SetFee,
            abi.encode(200)
        );

        // Fast forward past expiry
        vm.warp(block.timestamp + ACTION_EXPIRY + 1);

        vm.prank(signer2);
        vm.expectRevert(PredictionMarket.ActionExpired.selector);
        market.confirmAction(actionId);
    }

    // ============================================
    // PAUSE TESTS
    // ============================================

    function test_Paused_BlocksMarketCreation() public {
        executeMultiSigAction(PredictionMarket.ActionType.Pause, "");

        vm.prank(marketCreator);
        vm.expectRevert(PredictionMarket.ContractPaused.selector);
        market.createMarket(
            "Question",
            "https://example.com",
            "Rules",
            block.timestamp + 1 days
        );
    }

    function test_Paused_BlocksTrading() public {
        uint256 marketId = createTestMarket(marketCreator, 7 days);

        executeMultiSigAction(PredictionMarket.ActionType.Pause, "");

        vm.prank(alice);
        vm.expectRevert(PredictionMarket.ContractPaused.selector);
        market.buyYes{value: 0.1 ether}(marketId, 0);
    }
}
