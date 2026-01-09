// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import "./helpers/TestHelper.sol";

/**
 * @title IntegrationTest
 * @notice Full lifecycle integration tests for PredictionMarket
 * @dev Tests complete user journeys from market creation to payout/refund
 *
 * Test Categories:
 * 1. Happy Path - Normal resolution flows
 * 2. Disputed Path - Markets that go to voting
 * 3. Emergency Path - Timeout refunds
 * 4. Edge Cases - Dust amounts, timing boundaries, single shareholders
 */
contract IntegrationTest is TestHelper {
    // ============================================
    // TEST 1: HAPPY PATH - Undisputed Resolution
    // ============================================

    /**
     * @notice Full lifecycle: Create → Trade → Propose → Finalize → Claim
     * @dev The most common flow (~90% of markets)
     */
    function test_Integration_HappyPath_UndisputedResolution() public {
        // === SETUP: Create market ===
        uint256 marketId = createTestMarket(marketCreator, 1 days);

        // === TRADING PHASE ===
        // Alice buys YES (thinks it will happen)
        uint256 aliceYesShares = buyYesFor(alice, marketId, 1 ether, 0);
        assertGt(aliceYesShares, 0, "Alice should have YES shares");

        // Bob buys NO (thinks it won't happen)
        uint256 bobNoShares = buyNoFor(bob, marketId, 0.5 ether, 0);
        assertGt(bobNoShares, 0, "Bob should have NO shares");

        // Charlie also buys YES
        buyYesFor(charlie, marketId, 0.3 ether, 0);

        // Record pool size before resolution
        (, , , , , , , uint256 poolBefore, , , ) = market.getMarket(marketId);
        assertGt(poolBefore, 0, "Pool should have BNB");

        // === EXPIRY ===
        vm.warp(block.timestamp + 1 days + 1);

        // === RESOLUTION PHASE ===
        // Creator proposes YES won (within priority window) - using helper
        proposeOutcomeFor(marketCreator, marketId, true);

        // === WAIT FOR DISPUTE WINDOW (no dispute) ===
        vm.warp(block.timestamp + DISPUTE_WINDOW + 1);

        // === FINALIZE ===
        market.finalizeMarket(marketId);

        // Verify market is resolved
        assertEq(
            uint256(market.getMarketStatus(marketId)),
            uint256(PredictionMarket.MarketStatus.Resolved)
        );

        // === CLAIM PHASE ===
        // Alice claims (winner - had YES)
        uint256 aliceBalanceBefore = alice.balance;
        vm.prank(alice);
        uint256 alicePayout = market.claim(marketId);
        assertGt(alicePayout, 0, "Alice should get payout");
        assertEq(
            alice.balance,
            aliceBalanceBefore + alicePayout,
            "Alice balance should increase"
        );

        // Charlie claims (winner - had YES)
        vm.prank(charlie);
        uint256 charliePayout = market.claim(marketId);
        assertGt(charliePayout, 0, "Charlie should get payout");

        // Bob tries to claim (loser - had NO)
        vm.prank(bob);
        vm.expectRevert(PredictionMarket.NothingToClaim.selector);
        market.claim(marketId);

        // Verify proportional payouts (Alice had more shares than Charlie)
        assertGt(
            alicePayout,
            charliePayout,
            "Alice payout > Charlie payout (more shares)"
        );

        emit log_named_decimal_uint("Alice payout", alicePayout, 18);
        emit log_named_decimal_uint("Charlie payout", charliePayout, 18);
    }

    // ============================================
    // TEST 2: DISPUTED PATH - Proposer Wins
    // ============================================

    /**
     * @notice Full lifecycle with dispute where proposer wins
     * @dev Tests jury fee distribution to voters
     */
    function test_Integration_DisputedPath_ProposerWins() public {
        // === SETUP: Use PRO market for larger bet amounts ===
        uint256 marketId = createTestMarketWithHeatLevel(
            marketCreator,
            1 days,
            PredictionMarket.HeatLevel.PRO
        );

        // === TRADING: Multiple users on both sides (scaled for PRO) ===
        buyYesFor(alice, marketId, 0.5 ether, 0);
        buyNoFor(bob, marketId, 0.25 ether, 0);
        buyYesFor(charlie, marketId, 0.15 ether, 0);

        // === EXPIRY ===
        vm.warp(block.timestamp + 1 days + 1);

        // === PROPOSE: Creator says YES won ===
        proposeOutcomeFor(marketCreator, marketId, true);

        // === DISPUTE: Bob disagrees (he has NO shares) ===
        uint256 bobBalanceBeforeDispute = bob.balance;
        disputeFor(bob, marketId);

        // Verify Bob paid the dispute bond
        assertLt(
            bob.balance,
            bobBalanceBeforeDispute,
            "Bob should pay dispute bond"
        );

        // === VOTING PHASE ===
        // Alice votes for proposer (she has YES shares, proposer said YES)
        voteFor(alice, marketId, true);

        // Charlie votes for proposer too
        voteFor(charlie, marketId, true);

        // Bob votes for disputer (himself)
        voteFor(bob, marketId, false);

        // === WAIT FOR VOTING TO END ===
        vm.warp(block.timestamp + VOTING_WINDOW + 1);

        // === FINALIZE ===
        uint256 creatorPendingBefore = market.getPendingWithdrawal(
            marketCreator
        );
        market.finalizeMarket(marketId);

        // Verify proposer (creator) got bond back + bonus credited (Pull Pattern v3.4.0)
        uint256 creatorPendingAfter = market.getPendingWithdrawal(
            marketCreator
        );
        assertGt(
            creatorPendingAfter,
            creatorPendingBefore,
            "Proposer should get bond + bonus"
        );

        // Creator withdraws their bond + bonus
        uint256 creatorBalanceBefore = marketCreator.balance;
        vm.prank(marketCreator);
        market.withdrawBond();
        assertEq(
            marketCreator.balance,
            creatorBalanceBefore + creatorPendingAfter,
            "Proposer should receive withdrawal"
        );

        // === CLAIM WINNINGS ===
        vm.prank(alice);
        uint256 alicePayout = market.claim(marketId);
        assertGt(alicePayout, 0, "Alice should get payout");

        emit log_named_decimal_uint("Alice total payout", alicePayout, 18);
    }

    // ============================================
    // TEST 3: DISPUTED PATH - Disputer Wins
    // ============================================

    /**
     * @notice Dispute where the disputer wins (proposer lied)
     */
    function test_Integration_DisputedPath_DisputerWins() public {
        // === SETUP ===
        uint256 marketId = createTestMarket(marketCreator, 1 days);

        // Alice buys YES, Bob buys NO (Bob has more)
        buyYesFor(alice, marketId, 0.5 ether, 0);
        buyNoFor(bob, marketId, 1 ether, 0);

        // === EXPIRY ===
        vm.warp(block.timestamp + 1 days + 1);

        // === PROPOSE: Someone LIES and says YES won ===
        vm.warp(block.timestamp + CREATOR_PRIORITY_WINDOW + 1); // Wait for priority window
        proposeOutcomeFor(proposer, marketId, true); // LIES: says YES

        // === DISPUTE: Bob knows NO actually won ===
        disputeFor(bob, marketId);

        // === VOTING: Bob has more shares, votes for himself ===
        voteFor(alice, marketId, true); // Alice votes for proposer (wrong!)
        voteFor(bob, marketId, false); // Bob votes for disputer (himself)

        // === FINALIZE ===
        vm.warp(block.timestamp + VOTING_WINDOW + 1);

        uint256 bobPendingBefore = market.getPendingWithdrawal(bob);
        market.finalizeMarket(marketId);

        // Bob (disputer) should get bond back + bonus credited (Pull Pattern v3.4.0)
        uint256 bobPendingAfter = market.getPendingWithdrawal(bob);
        assertGt(
            bobPendingAfter,
            bobPendingBefore,
            "Disputer should get bond + bonus"
        );

        // Bob withdraws their bond + bonus
        uint256 bobBalanceBefore = bob.balance;
        vm.prank(bob);
        market.withdrawBond();
        assertEq(
            bob.balance,
            bobBalanceBefore + bobPendingAfter,
            "Disputer should receive withdrawal"
        );

        // === VERIFY OUTCOME: NO won (disputer's position) ===
        (, , , , , , , , , , bool outcome) = market.getMarket(marketId);
        assertEq(outcome, false, "NO should have won");

        // === CLAIM: Bob wins, Alice loses ===
        vm.prank(bob);
        uint256 bobPayout = market.claim(marketId);
        assertGt(bobPayout, 0, "Bob should get payout");

        vm.prank(alice);
        vm.expectRevert(PredictionMarket.NothingToClaim.selector);
        market.claim(marketId);
    }

    // ============================================
    // TEST 4: EMERGENCY REFUND PATH
    // ============================================

    /**
     * @notice "Lone Survivor" Test - Emergency refund after 24h timeout
     * @dev User should get ~98.5% back (pool minus original buy fee)
     */
    function test_Integration_LoneSurvivor_EmergencyRefund() public {
        // === SETUP: Solo buyer ===
        uint256 marketId = createTestMarket(marketCreator, 1 days);

        uint256 buyAmount = 0.5 ether;

        // Alice is the ONLY buyer
        uint256 aliceShares = buyYesFor(alice, marketId, buyAmount, 0);
        assertGt(aliceShares, 0, "Alice should have shares");

        // Calculate expected pool (after 1.5% fee)
        uint256 expectedPool = (buyAmount * (BPS_DENOMINATOR - TOTAL_FEE_BPS)) /
            BPS_DENOMINATOR;

        // === EXPIRY: Market expires ===
        vm.warp(block.timestamp + 1 days + 1);

        // === NO PROPOSAL FOR 24 HOURS ===
        // Fast forward 25 hours (past 24h emergency refund delay)
        vm.warp(block.timestamp + 25 hours);

        // Check eligibility
        (bool eligible, uint256 timeUntil) = market.canEmergencyRefund(
            marketId
        );
        assertTrue(eligible, "Should be eligible for emergency refund");
        assertEq(timeUntil, 0, "No time remaining");

        // === EMERGENCY REFUND ===
        uint256 aliceBalanceBefore = alice.balance;
        vm.prank(alice);
        uint256 refund = market.emergencyRefund(marketId);

        // === VERIFY REFUND AMOUNT ===
        assertEq(refund, expectedPool, "Refund should equal pool balance");
        assertEq(
            alice.balance,
            aliceBalanceBefore + refund,
            "Alice balance should increase"
        );

        // Calculate actual loss percentage
        uint256 totalLoss = buyAmount - refund;
        uint256 lossPercentage = (totalLoss * 10000) / buyAmount;

        emit log_named_decimal_uint("Original buy", buyAmount, 18);
        emit log_named_decimal_uint("Refund received", refund, 18);
        emit log_named_uint("Loss percentage (bps)", lossPercentage);

        // Should be ~150 bps (1.5% fee)
        assertApproxEqAbs(
            lossPercentage,
            150,
            5,
            "Loss should be ~1.5% (trading fee)"
        );
    }

    // ============================================
    // TEST 5: DUST TEST - Minimum Amounts
    // ============================================

    /**
     * @notice "Dust" Test - Verify bond calculation for tiny pools
     * @dev Ensures getRequiredBond() returns minBondFloor, not zero
     */
    function test_Integration_Dust_MinimumBondNotZero() public {
        // === SETUP: Create market with dust buy ===
        uint256 marketId = createTestMarket(marketCreator, 1 days);

        // Buy minimum amount (0.005 BNB)
        uint256 dustAmount = 0.005 ether;
        buyYesFor(alice, marketId, dustAmount, 0);

        // Check pool size
        (, , , , , , , uint256 pool, , , ) = market.getMarket(marketId);
        emit log_named_decimal_uint("Pool after dust buy", pool, 18);

        // === VERIFY BOND CALCULATION ===
        uint256 requiredBond = market.getRequiredBond(marketId);

        // Bond should be minBondFloor (0.005 BNB), NOT zero or tiny amount
        assertEq(
            requiredBond,
            0.005 ether,
            "Bond should be minBondFloor (0.005 BNB)"
        );
        assertGt(requiredBond, 0, "Bond should never be zero");

        // 1% of dust pool would be very small, but floor kicks in
        uint256 onePercentOfPool = (pool * 100) / 10000;
        emit log_named_decimal_uint("1% of pool", onePercentOfPool, 18);
        emit log_named_decimal_uint("Required bond (floor)", requiredBond, 18);

        assertGt(
            requiredBond,
            onePercentOfPool,
            "Floor should be higher than 1% of dust pool"
        );
    }

    // ============================================
    // TEST 6: SINGLE SHAREHOLDER PROTECTION
    // ============================================

    /**
     * @notice Test that single shareholder can protect themselves
     * @dev If someone proposes wrong outcome, single holder can dispute and win
     */
    function test_Integration_SingleShareholder_CanDispute() public {
        // === SETUP: Alice is the ONLY buyer ===
        uint256 marketId = createTestMarket(marketCreator, 1 days);
        buyYesFor(alice, marketId, 1 ether, 0);

        // === EXPIRY ===
        vm.warp(block.timestamp + 1 days + 1);
        vm.warp(block.timestamp + CREATOR_PRIORITY_WINDOW + 1);

        // === MALICIOUS PROPOSAL: Someone says NO won (LIE!) ===
        proposeOutcomeFor(proposer, marketId, false); // LIES: says NO

        // === ALICE DISPUTES ===
        uint256 aliceBalanceBefore = alice.balance;
        disputeFor(alice, marketId);

        // === VOTING: Alice is the ONLY voter ===
        // Alice votes YES (the true outcome) - this makes disputer win since proposer said NO
        voteFor(alice, marketId, true); // Vote for YES outcome

        // === FINALIZE ===
        vm.warp(block.timestamp + VOTING_WINDOW + 1);
        market.finalizeMarket(marketId);

        // === VERIFY: YES won (Alice's position), disputer won the dispute ===
        (, , , , , , , , , , bool outcome) = market.getMarket(marketId);
        assertEq(outcome, true, "YES should have won");

        // Claim winnings
        vm.prank(alice);
        uint256 claimPayout = market.claim(marketId);
        assertGt(claimPayout, 0, "Alice should get her position payout");

        emit log_named_decimal_uint("Alice claim payout", claimPayout, 18);
    }

    // ============================================
    // TEST 7: TIMING BOUNDARY - Dispute at Last Second
    // ============================================

    /**
     * @notice Test dispute exactly at end of dispute window
     */
    function test_Integration_TimingBoundary_DisputeAtEnd() public {
        uint256 marketId = createTestMarket(marketCreator, 1 days);
        buyYesFor(alice, marketId, 0.5 ether, 0);
        buyNoFor(bob, marketId, 0.5 ether, 0);

        // Expire and propose
        vm.warp(block.timestamp + 1 days + 1);
        proposeOutcomeFor(marketCreator, marketId, true);

        // Warp to EXACTLY end of dispute window (should still work)
        vm.warp(block.timestamp + DISPUTE_WINDOW);

        // Dispute should succeed
        disputeFor(bob, marketId);

        assertEq(
            uint256(market.getMarketStatus(marketId)),
            uint256(PredictionMarket.MarketStatus.Disputed)
        );
    }

    /**
     * @notice Test dispute AFTER dispute window (should fail)
     */
    function test_Integration_TimingBoundary_DisputeTooLate() public {
        uint256 marketId = createTestMarket(marketCreator, 1 days);
        buyYesFor(alice, marketId, 0.5 ether, 0);

        // Expire and propose
        vm.warp(block.timestamp + 1 days + 1);
        proposeOutcomeFor(marketCreator, marketId, true);

        // Warp PAST dispute window
        vm.warp(block.timestamp + DISPUTE_WINDOW + 1);

        // Dispute should fail - calculate required bond with fee
        uint256 requiredDisputeBond = market.getRequiredDisputeBond(marketId);
        uint256 totalRequired = requiredDisputeBond +
            (requiredDisputeBond * RESOLUTION_FEE_BPS) /
            (BPS_DENOMINATOR - RESOLUTION_FEE_BPS) +
            1;

        vm.prank(bob);
        vm.expectRevert(PredictionMarket.DisputeWindowExpired.selector);
        market.dispute{value: totalRequired}(marketId);
    }

    // ============================================
    // TEST 8: VOTE BOUNDARY - Vote at Last Second
    // ============================================

    /**
     * @notice Test voting exactly at end of voting window
     */
    function test_Integration_TimingBoundary_VoteAtEnd() public {
        uint256 marketId = createTestMarket(marketCreator, 1 days);
        buyYesFor(alice, marketId, 0.5 ether, 0);
        buyNoFor(bob, marketId, 0.5 ether, 0);

        // Expire, propose, dispute
        vm.warp(block.timestamp + 1 days + 1);
        proposeOutcomeFor(marketCreator, marketId, true);
        disputeFor(bob, marketId);

        // Warp to EXACTLY end of voting window
        vm.warp(block.timestamp + VOTING_WINDOW);

        // Vote should succeed
        voteFor(alice, marketId, true);

        // Verify vote was counted
        (, , , , bool hasVoted, ) = market.getPosition(marketId, alice);
        assertTrue(hasVoted, "Alice should have voted");
    }

    // ============================================
    // TEST 9: TIE SCENARIO (0 vs 0 votes)
    // ============================================

    /**
     * @notice Test tie scenario where no one votes
     * @dev Both bonds should be returned
     */
    function test_Integration_TieScenario_NoVotes() public {
        uint256 marketId = createTestMarket(marketCreator, 1 days);
        buyYesFor(alice, marketId, 0.5 ether, 0);

        // Expire and propose
        vm.warp(block.timestamp + 1 days + 1);
        proposeOutcomeFor(marketCreator, marketId, true);

        // Dispute
        disputeFor(disputer, marketId);

        // NO ONE VOTES - warp past voting
        vm.warp(block.timestamp + VOTING_WINDOW + 1);

        // Record pending before finalize (Pull Pattern v3.4.0)
        uint256 creatorPendingBefore = market.getPendingWithdrawal(
            marketCreator
        );
        uint256 disputerPendingBefore = market.getPendingWithdrawal(disputer);

        // Finalize - should be a tie
        market.finalizeMarket(marketId);

        // Both should get bonds credited to pendingWithdrawals (tie = both returned)
        uint256 creatorPendingAfter = market.getPendingWithdrawal(
            marketCreator
        );
        uint256 disputerPendingAfter = market.getPendingWithdrawal(disputer);

        assertGt(
            creatorPendingAfter,
            creatorPendingBefore,
            "Proposer should get bond back on tie"
        );
        assertGt(
            disputerPendingAfter,
            disputerPendingBefore,
            "Disputer should get bond back on tie"
        );

        // Withdraw to verify actual funds received
        uint256 creatorBalanceBefore = marketCreator.balance;
        vm.prank(marketCreator);
        market.withdrawBond();
        assertEq(
            marketCreator.balance,
            creatorBalanceBefore + creatorPendingAfter,
            "Proposer should receive withdrawal"
        );

        uint256 disputerBalanceBefore = disputer.balance;
        vm.prank(disputer);
        market.withdrawBond();
        assertEq(
            disputer.balance,
            disputerBalanceBefore + disputerPendingAfter,
            "Disputer should receive withdrawal"
        );
    }

    // ============================================
    // TEST 10: MULTI-USER COMPLEX SCENARIO
    // ============================================

    /**
     * @notice Complex scenario with many users and actions
     * @dev Tests system under realistic conditions
     */
    function test_Integration_MultiUser_ComplexScenario() public {
        // === SETUP: Use PRO market for larger amounts ===
        uint256 marketId = createTestMarketWithHeatLevel(
            marketCreator,
            1 days,
            PredictionMarket.HeatLevel.PRO
        );

        // Multiple trades - scaled for PRO (YES side has more volume)
        buyYesFor(alice, marketId, 0.5 ether, 0);
        buyNoFor(bob, marketId, 0.25 ether, 0);
        buyYesFor(charlie, marketId, 0.4 ether, 0);

        // Alice sells a small amount (use getMaxSellableShares to ensure it's possible)
        (uint256 aliceYes, , , , , ) = market.getPosition(marketId, alice);
        uint256 sellAmount = aliceYes / 10; // Sell only 10%

        // Only sell if there's enough in the pool
        (uint256 maxSellable, ) = market.getMaxSellableShares(
            marketId,
            sellAmount,
            true
        );
        if (maxSellable >= sellAmount) {
            vm.prank(alice);
            market.sellYes(marketId, sellAmount, 0);
        }

        // === RESOLUTION ===
        vm.warp(block.timestamp + 1 days + 1);
        proposeOutcomeFor(marketCreator, marketId, true);

        // Dispute
        disputeFor(bob, marketId);

        // Voting - YES side votes YES, NO side votes NO
        voteFor(alice, marketId, true); // YES holder votes YES
        voteFor(charlie, marketId, true); // YES holder votes YES
        voteFor(bob, marketId, false); // NO holder votes NO

        // Finalize - YES should win (more votes)
        vm.warp(block.timestamp + VOTING_WINDOW + 1);
        market.finalizeMarket(marketId);

        // Everyone claims
        vm.prank(alice);
        uint256 alicePayout = market.claim(marketId);

        vm.prank(charlie);
        uint256 charliePayout = market.claim(marketId);

        // Bob lost
        vm.prank(bob);
        vm.expectRevert(PredictionMarket.NothingToClaim.selector);
        market.claim(marketId);

        emit log_named_decimal_uint("Alice payout", alicePayout, 18);
        emit log_named_decimal_uint("Charlie payout", charliePayout, 18);

        assertGt(alicePayout + charliePayout, 0, "Winners should get payouts");
    }

    // ============================================
    // TEST 11: CREATOR PRIORITY WINDOW
    // ============================================

    /**
     * @notice Test that non-creator cannot propose during priority window
     */
    function test_Integration_CreatorPriority_NonCreatorBlocked() public {
        uint256 marketId = createTestMarket(marketCreator, 1 days);
        buyYesFor(alice, marketId, 0.5 ether, 0);

        // Expire
        vm.warp(block.timestamp + 1 days + 1);

        // Non-creator tries to propose during priority window
        uint256 requiredBond = market.getRequiredBond(marketId);
        uint256 totalRequired = requiredBond +
            (requiredBond * RESOLUTION_FEE_BPS) /
            (BPS_DENOMINATOR - RESOLUTION_FEE_BPS) +
            1;

        vm.prank(alice);
        vm.expectRevert(PredictionMarket.CreatorPriorityActive.selector);
        market.proposeOutcome{value: totalRequired}(marketId, true);

        // Creator CAN propose
        proposeOutcomeFor(marketCreator, marketId, true);
    }

    /**
     * @notice Test that non-creator CAN propose after priority window
     */
    function test_Integration_CreatorPriority_NonCreatorAllowedAfter() public {
        uint256 marketId = createTestMarket(marketCreator, 1 days);
        buyYesFor(alice, marketId, 0.5 ether, 0);

        // Expire + wait past priority window
        vm.warp(block.timestamp + 1 days + 1 + CREATOR_PRIORITY_WINDOW + 1);

        // Non-creator CAN propose now
        proposeOutcomeFor(alice, marketId, true);

        assertEq(
            uint256(market.getMarketStatus(marketId)),
            uint256(PredictionMarket.MarketStatus.Proposed)
        );
    }

    // ============================================
    // TEST 12: NON-SHAREHOLDER CANNOT VOTE
    // ============================================

    /**
     * @notice Verify non-shareholders cannot vote
     */
    function test_Integration_NonShareholderCannotVote() public {
        uint256 marketId = createTestMarket(marketCreator, 1 days);
        buyYesFor(alice, marketId, 0.5 ether, 0);

        // Expire, propose, dispute
        vm.warp(block.timestamp + 1 days + 1);
        proposeOutcomeFor(marketCreator, marketId, true);
        disputeFor(disputer, marketId);

        // Bob (no shares) tries to vote
        vm.prank(bob);
        vm.expectRevert(PredictionMarket.NoSharesForVoting.selector);
        market.vote(marketId, true);
    }

    // ============================================
    // TEST 13: DOUBLE CLAIM PROTECTION
    // ============================================

    /**
     * @notice Verify users cannot claim twice
     */
    function test_Integration_DoubleClaimBlocked() public {
        uint256 marketId = createTestMarket(marketCreator, 1 days);
        buyYesFor(alice, marketId, 0.5 ether, 0);

        // Resolve market
        vm.warp(block.timestamp + 1 days + 1);
        proposeOutcomeFor(marketCreator, marketId, true);
        vm.warp(block.timestamp + DISPUTE_WINDOW + 1);
        market.finalizeMarket(marketId);

        // First claim works
        vm.prank(alice);
        market.claim(marketId);

        // Second claim fails
        vm.prank(alice);
        vm.expectRevert(PredictionMarket.AlreadyClaimed.selector);
        market.claim(marketId);
    }

    // ============================================
    // TEST 14: EMERGENCY REFUND + CLAIM MUTUAL EXCLUSION
    // ============================================

    /**
     * @notice Verify user can't emergency refund on resolved market
     */
    function test_Integration_EmergencyRefundVsClaim_MutualExclusion() public {
        // Scenario: Market resolves normally, user claims, then tries emergency refund
        uint256 marketId = createTestMarket(marketCreator, 1 days);
        buyYesFor(alice, marketId, 0.5 ether, 0);

        // Resolve
        vm.warp(block.timestamp + 1 days + 1);
        proposeOutcomeFor(marketCreator, marketId, true);
        vm.warp(block.timestamp + DISPUTE_WINDOW + 1);
        market.finalizeMarket(marketId);

        // Claim
        vm.prank(alice);
        market.claim(marketId);

        // Try emergency refund (market is resolved, not eligible)
        vm.warp(block.timestamp + 25 hours);
        vm.prank(alice);
        vm.expectRevert(); // Market is resolved, can't emergency refund
        market.emergencyRefund(marketId);
    }
}
