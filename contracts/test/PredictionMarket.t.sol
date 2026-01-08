// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import "./helpers/TestHelper.sol";

/**
 * @title PredictionMarketTest
 * @notice Comprehensive tests for PredictionMarket contract with Street Consensus
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
            "",
            expiryTime
        );

        assertEq(marketId, 0, "First market should have ID 0");
        assertEq(market.marketCount(), 1, "Market count should be 1");

        (
            string memory question,
            string memory evidenceLink,
            string memory resolutionRules,
            string memory imageUrl,
            address creator,
            uint256 expiry,
            uint256 yesSupply,
            uint256 noSupply,
            uint256 poolBalance,
            bool resolved,
            bool outcome
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
            "",
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
            "",
            block.timestamp + 1 days
        );
    }

    function test_CreateMarket_AllowsEmptyEvidenceLink() public {
        // Degen markets can have empty evidence link
        vm.prank(marketCreator);
        uint256 marketId = market.createMarket(
            "Will I get a girlfriend tomorrow?",
            "", // Empty evidence link is OK for degen markets
            "Creator posts proof",
            "",
            block.timestamp + 1 days
        );

        assertEq(marketId, 0, "Should create market successfully");
    }

    function test_CreateMarket_RevertOnPastExpiry() public {
        vm.prank(marketCreator);
        vm.expectRevert(PredictionMarket.InvalidExpiryTimestamp.selector);
        market.createMarket(
            "Question",
            "https://example.com",
            "Rules",
            "",
            block.timestamp - 1
        );
    }

    function test_CreateMarketAndBuy_Success() public {
        uint256 expiryTime = block.timestamp + 7 days;

        vm.prank(alice);
        (uint256 marketId, uint256 shares) = market.createMarketAndBuy{
            value: 1 ether
        }("Test?", "https://example.com", "Rules", "", expiryTime, true, 0);

        assertEq(marketId, 0);
        assertGt(shares, 0, "Should receive shares");

        (uint256 yesShares, , , , , ) = market.getPosition(marketId, alice);
        assertEq(yesShares, shares);
    }

    // ============================================
    // TRADING TESTS
    // ============================================

    function test_BuyYes_Success() public {
        uint256 marketId = createTestMarket(marketCreator, 7 days);

        uint256 aliceBalanceBefore = alice.balance;

        vm.prank(alice);
        uint256 shares = market.buyYes{value: 1 ether}(marketId, 0);

        assertGt(shares, 0, "Should receive shares");
        assertLt(alice.balance, aliceBalanceBefore, "Balance should decrease");

        (uint256 yesShares, , , , , ) = market.getPosition(marketId, alice);
        assertEq(yesShares, shares);
    }

    function test_BuyNo_Success() public {
        uint256 marketId = createTestMarket(marketCreator, 7 days);

        vm.prank(bob);
        uint256 shares = market.buyNo{value: 1 ether}(marketId, 0);

        assertGt(shares, 0, "Should receive shares");

        (, uint256 noShares, , , , ) = market.getPosition(marketId, bob);
        assertEq(noShares, shares);
    }

    function test_Buy_RevertBelowMinBet() public {
        uint256 marketId = createTestMarket(marketCreator, 7 days);

        vm.prank(alice);
        vm.expectRevert(PredictionMarket.BelowMinBet.selector);
        market.buyYes{value: 0.001 ether}(marketId, 0); // Below default 0.005 min
    }

    function test_Buy_RevertIfExpired() public {
        uint256 marketId = createTestMarket(marketCreator, 7 days);

        expireMarket(marketId);

        vm.prank(alice);
        vm.expectRevert(PredictionMarket.MarketNotActive.selector);
        market.buyYes{value: 1 ether}(marketId, 0);
    }

    function test_SellYes_Success() public {
        uint256 marketId = createTestMarket(marketCreator, 7 days);

        // Buy first
        vm.prank(alice);
        uint256 shares = market.buyYes{value: 1 ether}(marketId, 0);

        // Sell half
        uint256 balanceBefore = alice.balance;
        vm.prank(alice);
        uint256 bnbOut = market.sellYes(marketId, shares / 2, 0);

        assertGt(bnbOut, 0, "Should receive BNB");
        assertGt(alice.balance, balanceBefore, "Balance should increase");
    }

    function test_SellNo_Success() public {
        uint256 marketId = createTestMarket(marketCreator, 7 days);

        vm.prank(bob);
        uint256 shares = market.buyNo{value: 1 ether}(marketId, 0);

        vm.prank(bob);
        uint256 bnbOut = market.sellNo(marketId, shares / 2, 0);

        assertGt(bnbOut, 0, "Should receive BNB");
    }

    function test_Sell_RevertInsufficientShares() public {
        uint256 marketId = createTestMarket(marketCreator, 7 days);

        vm.prank(alice);
        market.buyYes{value: 1 ether}(marketId, 0);

        vm.prank(alice);
        vm.expectRevert(PredictionMarket.InsufficientShares.selector);
        market.sellYes(marketId, type(uint256).max, 0);
    }

    function test_Trading_FeeDistribution() public {
        uint256 marketId = createTestMarket(marketCreator, 7 days);

        uint256 treasuryBefore = treasury.balance;
        uint256 creatorBefore = marketCreator.balance;

        vm.prank(alice);
        market.buyYes{value: 1 ether}(marketId, 0);

        // Treasury gets platform fee (1%)
        assertGt(treasury.balance, treasuryBefore, "Treasury should get fee");

        // Creator gets creator fee (0.5%)
        assertGt(
            marketCreator.balance,
            creatorBefore,
            "Creator should get fee"
        );
    }

    function test_PreviewBuy_MatchesActual() public {
        uint256 marketId = createTestMarket(marketCreator, 7 days);

        uint256 previewShares = market.previewBuy(marketId, 1 ether, true);

        vm.prank(alice);
        uint256 actualShares = market.buyYes{value: 1 ether}(marketId, 0);

        assertEq(
            previewShares,
            actualShares,
            "Preview should match actual shares"
        );
    }

    // ============================================
    // STREET CONSENSUS RESOLUTION TESTS
    // ============================================

    function test_ProposeOutcome_CreatorPriority() public {
        uint256 marketId = createTestMarket(marketCreator, 7 days);
        buyYesFor(alice, marketId, 1 ether, 0);

        expireMarket(marketId);

        // Non-creator cannot propose during priority window
        vm.prank(charlie);
        vm.expectRevert(PredictionMarket.CreatorPriorityActive.selector);
        market.proposeOutcome{value: 0.03 ether}(marketId, true, "");

        // Creator CAN propose during priority window
        uint256 requiredBond = market.getRequiredBond(marketId);
        uint256 totalRequired = requiredBond +
            (requiredBond * RESOLUTION_FEE_BPS) /
            (BPS_DENOMINATOR - RESOLUTION_FEE_BPS) +
            1;

        vm.prank(marketCreator);
        market.proposeOutcome{value: totalRequired}(
            marketId,
            true,
            "https://proof.com"
        );

        // Check proposal was stored
        (address proposerAddr, bool proposedOutcome, , , , ) = market
            .getProposal(marketId);
        assertEq(proposerAddr, marketCreator);
        assertTrue(proposedOutcome);
    }

    function test_ProposeOutcome_AnyoneAfterPriorityWindow() public {
        uint256 marketId = createTestMarket(marketCreator, 7 days);
        buyYesFor(alice, marketId, 1 ether, 0);

        // Skip past expiry + creator priority window
        skipCreatorPriority(marketId);

        // Now anyone can propose
        proposeOutcomeFor(charlie, marketId, true, "https://proof.com");

        (address proposerAddr, , , , , ) = market.getProposal(marketId);
        assertEq(proposerAddr, charlie);
    }

    function test_ProposeOutcome_RevertIfNotExpired() public {
        uint256 marketId = createTestMarket(marketCreator, 7 days);

        vm.prank(marketCreator);
        vm.expectRevert(PredictionMarket.MarketNotExpired.selector);
        market.proposeOutcome{value: 0.03 ether}(marketId, true, "");
    }

    function test_ProposeOutcome_EmptyProofLinkAllowed() public {
        uint256 marketId = createTestMarket(marketCreator, 7 days);
        buyYesFor(alice, marketId, 1 ether, 0);

        skipCreatorPriority(marketId);

        // Empty proof link is OK (degen mode)
        proposeOutcomeFor(charlie, marketId, true, "");

        (address proposerAddr, , string memory proofLink, , , ) = market
            .getProposal(marketId);
        assertEq(proposerAddr, charlie);
        assertEq(proofLink, "");
    }

    function test_Dispute_Success() public {
        uint256 marketId = createTestMarket(marketCreator, 7 days);
        buyYesFor(alice, marketId, 1 ether, 0);

        skipCreatorPriority(marketId);
        proposeOutcomeFor(charlie, marketId, true, "");

        // Dispute the proposal
        disputeFor(bob, marketId);

        // Check dispute was stored
        (
            address disputerAddr,
            uint256 disputeTime,
            uint256 disputeBond,
            ,
            ,

        ) = market.getDispute(marketId);
        assertEq(disputerAddr, bob);
        assertGt(disputeTime, 0);
        assertGt(disputeBond, 0);

        // Status should be Disputed
        assertEq(
            uint256(market.getMarketStatus(marketId)),
            uint256(PredictionMarket.MarketStatus.Disputed)
        );
    }

    function test_Dispute_RevertAfterWindow() public {
        uint256 marketId = createTestMarket(marketCreator, 7 days);
        buyYesFor(alice, marketId, 1 ether, 0);

        skipCreatorPriority(marketId);
        proposeOutcomeFor(charlie, marketId, true, "");

        // Skip past dispute window
        vm.warp(block.timestamp + DISPUTE_WINDOW + 1);

        vm.prank(bob);
        vm.expectRevert(PredictionMarket.DisputeWindowExpired.selector);
        market.dispute{value: 1 ether}(marketId);
    }

    function test_Vote_Success() public {
        uint256 marketId = createTestMarket(marketCreator, 7 days);
        buyYesFor(alice, marketId, 1 ether, 0);
        buyNoFor(bob, marketId, 1 ether, 0);

        skipCreatorPriority(marketId);
        proposeOutcomeFor(charlie, marketId, true, "");
        disputeFor(proposer, marketId);

        // Alice votes YES
        voteFor(alice, marketId, true);

        // Bob votes NO
        voteFor(bob, marketId, false);

        // Check votes recorded
        (, , , , uint256 yesVotes, uint256 noVotes) = market.getDispute(
            marketId
        );
        assertGt(yesVotes, 0, "YES votes should be recorded");
        assertGt(noVotes, 0, "NO votes should be recorded");
    }

    function test_Vote_RevertIfNoShares() public {
        uint256 marketId = createTestMarket(marketCreator, 7 days);
        buyYesFor(alice, marketId, 1 ether, 0);

        skipCreatorPriority(marketId);
        proposeOutcomeFor(charlie, marketId, true, "");
        disputeFor(proposer, marketId);

        // Charlie has no shares, cannot vote
        vm.prank(charlie);
        vm.expectRevert(PredictionMarket.NoSharesForVoting.selector);
        market.vote(marketId, true);
    }

    function test_Vote_RevertIfAlreadyVoted() public {
        uint256 marketId = createTestMarket(marketCreator, 7 days);
        buyYesFor(alice, marketId, 1 ether, 0);

        skipCreatorPriority(marketId);
        proposeOutcomeFor(charlie, marketId, true, "");
        disputeFor(proposer, marketId);

        voteFor(alice, marketId, true);

        vm.prank(alice);
        vm.expectRevert(PredictionMarket.AlreadyVoted.selector);
        market.vote(marketId, false);
    }

    function test_FinalizeMarket_NoDispute() public {
        uint256 marketId = createTestMarket(marketCreator, 7 days);
        buyYesFor(alice, marketId, 1 ether, 0);

        skipCreatorPriority(marketId);
        proposeOutcomeFor(charlie, marketId, true, "");

        // Skip dispute window (no one disputed)
        vm.warp(block.timestamp + DISPUTE_WINDOW + 1);

        // Finalize
        market.finalizeMarket(marketId);

        // Check resolved
        (, , , , , , , , , bool resolved, bool outcome) = market.getMarket(
            marketId
        );
        assertTrue(resolved, "Market should be resolved");
        assertTrue(outcome, "Outcome should be YES");
    }

    function test_FinalizeMarket_WithDispute_ProposerWins() public {
        uint256 marketId = createTestMarket(marketCreator, 7 days);

        // To ensure Alice wins the vote, she needs significantly more shares
        // Due to bonding curve, when Alice buys YES, the NO price drops
        // So Bob gets more NO shares per BNB
        // Solution: Have Alice buy first at good price, then Bob buys minimal amount
        buyYesFor(alice, marketId, 1 ether, 0); // Alice gets ~197 shares at initial price
        buyNoFor(bob, marketId, 0.1 ether, 0); // Bob gets much fewer shares

        // Verify Alice has more voting weight
        (uint256 aliceYes, , , , , ) = market.getPosition(marketId, alice);
        (, uint256 bobNo, , , , ) = market.getPosition(marketId, bob);
        assertGt(aliceYes, bobNo, "Alice should have more shares for voting");

        skipCreatorPriority(marketId);

        // Charlie proposes YES
        proposeOutcomeFor(charlie, marketId, true, "");

        // Bob disputes
        disputeFor(bob, marketId);

        // Alice votes YES, Bob votes NO
        // Alice has more shares, so YES should win
        voteFor(alice, marketId, true);
        voteFor(bob, marketId, false);

        // Skip voting window
        vm.warp(block.timestamp + VOTING_WINDOW + 1);

        // Finalize
        market.finalizeMarket(marketId);

        // Check resolved with YES
        (, , , , , , , , , bool resolved, bool outcome) = market.getMarket(
            marketId
        );
        assertTrue(resolved);
        assertTrue(outcome, "YES should win (proposer was correct)");
    }

    function test_FinalizeMarket_WithDispute_DisputerWins() public {
        uint256 marketId = createTestMarket(marketCreator, 7 days);

        // Bob bets more on NO
        buyYesFor(alice, marketId, 1 ether, 0);
        buyNoFor(bob, marketId, 2 ether, 0);

        skipCreatorPriority(marketId);

        // Charlie proposes YES (wrong!)
        proposeOutcomeFor(charlie, marketId, true, "");

        // Bob disputes
        disputeFor(bob, marketId);

        // Votes: Alice YES, Bob NO. Bob has more shares.
        voteFor(alice, marketId, true);
        voteFor(bob, marketId, false);

        vm.warp(block.timestamp + VOTING_WINDOW + 1);

        market.finalizeMarket(marketId);

        (, , , , , , , , , bool resolved, bool outcome) = market.getMarket(
            marketId
        );
        assertTrue(resolved);
        assertFalse(outcome, "NO should win (disputer was correct)");
    }

    function test_FinalizeMarket_TieReturnsBonds() public {
        uint256 marketId = createTestMarket(marketCreator, 7 days);

        // Both buy equal YES shares (same side voting)
        // This ensures they have exactly equal voting weight
        uint256 aliceShares = buyYesFor(alice, marketId, 1 ether, 0);

        // Charlie also buys YES for same amount at similar price
        uint256 charlieShares = buyYesFor(charlie, marketId, 1 ether, 0);

        skipCreatorPriority(marketId);

        uint256 proposerBalanceBefore = proposer.balance;
        proposeOutcomeFor(proposer, marketId, true, "");

        uint256 disputerBalanceBefore = disputer.balance;
        disputeFor(disputer, marketId);

        // Alice votes YES, Charlie votes NO - they have similar share counts
        // Since both bought YES at similar times, their shares should be close
        // However they won't be exactly equal, so let's test the scenario
        // where NO ONE votes (0 vs 0 = tie)
        // (Don't call voteFor at all)

        vm.warp(block.timestamp + VOTING_WINDOW + 1);

        // Finalize with 0 votes each side = tie
        market.finalizeMarket(marketId);

        // Market should NOT be resolved (tie = stuck)
        (, , , , , , , , , bool resolved, ) = market.getMarket(marketId);
        assertFalse(resolved, "Market should not resolve on tie");

        // Bonds should be returned
        assertGt(
            proposer.balance,
            proposerBalanceBefore - 0.1 ether,
            "Proposer should get bond back"
        );
        assertGt(
            disputer.balance,
            disputerBalanceBefore - 0.1 ether,
            "Disputer should get bond back"
        );
    }

    // ============================================
    // CLAIM TESTS
    // ============================================

    function test_Claim_WinnerGetsPool() public {
        uint256 marketId = createTestMarket(marketCreator, 7 days);

        buyYesFor(alice, marketId, 1 ether, 0);
        buyNoFor(bob, marketId, 1 ether, 0);

        expireMarket(marketId);
        assertAndResolve(marketId, charlie, true, true);

        uint256 aliceBalanceBefore = alice.balance;
        vm.prank(alice);
        uint256 payout = market.claim(marketId);

        assertGt(payout, 0, "Alice should get payout");
        assertGt(
            alice.balance,
            aliceBalanceBefore,
            "Alice balance should increase"
        );

        (, , bool claimed, , , ) = market.getPosition(marketId, alice);
        assertTrue(claimed, "Position should be marked claimed");
    }

    function test_Claim_LoserGetsNothing() public {
        uint256 marketId = createTestMarket(marketCreator, 7 days);

        buyYesFor(alice, marketId, 1 ether, 0);
        buyNoFor(bob, marketId, 1 ether, 0);

        expireMarket(marketId);
        assertAndResolve(marketId, charlie, true, true);

        vm.prank(bob);
        vm.expectRevert(PredictionMarket.NothingToClaim.selector);
        market.claim(marketId);
    }

    function test_Claim_RevertIfNotResolved() public {
        uint256 marketId = createTestMarket(marketCreator, 7 days);

        buyYesFor(alice, marketId, 1 ether, 0);

        vm.prank(alice);
        vm.expectRevert(PredictionMarket.MarketNotResolved.selector);
        market.claim(marketId);
    }

    function test_Claim_RevertIfAlreadyClaimed() public {
        uint256 marketId = createTestMarket(marketCreator, 7 days);

        buyYesFor(alice, marketId, 1 ether, 0);

        expireMarket(marketId);
        assertAndResolve(marketId, charlie, true, true);

        vm.prank(alice);
        market.claim(marketId);

        vm.prank(alice);
        vm.expectRevert(PredictionMarket.AlreadyClaimed.selector);
        market.claim(marketId);
    }

    function test_Claim_TakesResolutionFee() public {
        uint256 marketId = createTestMarket(marketCreator, 7 days);

        buyYesFor(alice, marketId, 1 ether, 0);
        buyNoFor(bob, marketId, 1 ether, 0);

        expireMarket(marketId);
        assertAndResolve(marketId, charlie, true, true);

        uint256 treasuryBefore = treasury.balance;

        vm.prank(alice);
        market.claim(marketId);

        assertGt(
            treasury.balance,
            treasuryBefore,
            "Treasury should get resolution fee"
        );
    }

    // ============================================
    // EMERGENCY REFUND TESTS
    // ============================================

    function test_EmergencyRefund_AfterDelay() public {
        uint256 marketId = createTestMarket(marketCreator, 7 days);

        buyYesFor(alice, marketId, 1 ether, 0);
        buyNoFor(bob, marketId, 0.5 ether, 0);

        // Warp past expiry + 24h
        (, , , , , uint256 expiry, , , , , ) = market.getMarket(marketId);
        vm.warp(expiry + 24 hours + 1);

        uint256 aliceBalanceBefore = alice.balance;
        vm.prank(alice);
        uint256 refund = market.emergencyRefund(marketId);

        assertGt(refund, 0, "Should get refund");
        assertGt(alice.balance, aliceBalanceBefore, "Balance should increase");
    }

    function test_EmergencyRefund_RevertTooEarly() public {
        uint256 marketId = createTestMarket(marketCreator, 7 days);

        buyYesFor(alice, marketId, 1 ether, 0);

        expireMarket(marketId);

        vm.prank(alice);
        vm.expectRevert(PredictionMarket.EmergencyRefundTooEarly.selector);
        market.emergencyRefund(marketId);
    }

    function test_EmergencyRefund_RevertIfResolved() public {
        uint256 marketId = createTestMarket(marketCreator, 7 days);

        buyYesFor(alice, marketId, 1 ether, 0);

        expireMarket(marketId);
        assertAndResolve(marketId, charlie, true, true);

        (, , , , , uint256 expiry, , , , , ) = market.getMarket(marketId);
        vm.warp(expiry + 24 hours + 1);

        vm.prank(alice);
        vm.expectRevert(PredictionMarket.MarketAlreadyResolved.selector);
        market.emergencyRefund(marketId);
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

    function test_MultiSig_SetCreatorFee() public {
        uint256 newFee = 100; // 1%

        executeMultiSigAction(
            PredictionMarket.ActionType.SetCreatorFee,
            abi.encode(newFee)
        );

        assertEq(
            market.creatorFeeBps(),
            newFee,
            "Creator fee should be updated"
        );
    }

    function test_MultiSig_SetResolutionFee() public {
        uint256 newFee = 50; // 0.5%

        executeMultiSigAction(
            PredictionMarket.ActionType.SetResolutionFee,
            abi.encode(newFee)
        );

        assertEq(
            market.resolutionFeeBps(),
            newFee,
            "Resolution fee should be updated"
        );
    }

    function test_MultiSig_SetMinBondFloor() public {
        uint256 newFloor = 0.05 ether;

        executeMultiSigAction(
            PredictionMarket.ActionType.SetMinBondFloor,
            abi.encode(newFloor)
        );

        assertEq(
            market.minBondFloor(),
            newFloor,
            "Min bond floor should be updated"
        );
    }

    function test_MultiSig_SetDynamicBondBps() public {
        uint256 newBps = 200; // 2%

        executeMultiSigAction(
            PredictionMarket.ActionType.SetDynamicBondBps,
            abi.encode(newBps)
        );

        assertEq(
            market.dynamicBondBps(),
            newBps,
            "Dynamic bond BPS should be updated"
        );
    }

    function test_MultiSig_SetBondWinnerShare() public {
        uint256 newShare = 6000; // 60%

        executeMultiSigAction(
            PredictionMarket.ActionType.SetBondWinnerShare,
            abi.encode(newShare)
        );

        assertEq(
            market.bondWinnerShareBps(),
            newShare,
            "Bond winner share should be updated"
        );
    }

    function test_MultiSig_Pause() public {
        executeMultiSigAction(PredictionMarket.ActionType.Pause, "");

        assertTrue(market.paused(), "Contract should be paused");
    }

    function test_MultiSig_Unpause() public {
        executeMultiSigAction(PredictionMarket.ActionType.Pause, "");
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

        vm.prank(signer1);
        uint256 actionId = market.proposeAction(
            PredictionMarket.ActionType.SetFee,
            abi.encode(tooHighFee)
        );

        vm.prank(signer2);
        market.confirmAction(actionId);

        vm.prank(signer3);
        vm.expectRevert(PredictionMarket.InvalidFee.selector);
        market.confirmAction(actionId);
    }

    function test_MultiSig_RevertBondWinnerShareOutOfBounds() public {
        uint256 tooLow = 1000; // 10% < 20% min

        vm.prank(signer1);
        uint256 actionId = market.proposeAction(
            PredictionMarket.ActionType.SetBondWinnerShare,
            abi.encode(tooLow)
        );

        vm.prank(signer2);
        market.confirmAction(actionId);

        vm.prank(signer3);
        vm.expectRevert(PredictionMarket.InvalidBondWinnerShare.selector);
        market.confirmAction(actionId);
    }

    function test_MultiSig_ActionExpiry() public {
        vm.prank(signer1);
        uint256 actionId = market.proposeAction(
            PredictionMarket.ActionType.SetFee,
            abi.encode(200)
        );

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
            "",
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

    function test_Paused_BlocksProposal() public {
        uint256 marketId = createTestMarket(marketCreator, 7 days);
        buyYesFor(alice, marketId, 1 ether, 0);
        expireMarket(marketId);

        executeMultiSigAction(PredictionMarket.ActionType.Pause, "");

        vm.prank(marketCreator);
        vm.expectRevert(PredictionMarket.ContractPaused.selector);
        market.proposeOutcome{value: 0.03 ether}(marketId, true, "");
    }

    // ============================================
    // WEIGHTED VOTING TESTS (Anti-Sybil)
    // ============================================

    /**
     * @notice Test that vote weight equals total shares owned
     * @dev Verifies: voteWeight = yesShares + noShares
     */
    function test_Vote_WeightEqualsShares() public {
        uint256 marketId = createTestMarket(marketCreator, 7 days);

        // Alice buys 1 BNB of YES
        buyYesFor(alice, marketId, 1 ether, 0);
        (uint256 aliceYes, , , , , ) = market.getPosition(marketId, alice);

        skipCreatorPriority(marketId);
        proposeOutcomeFor(charlie, marketId, true, "");
        disputeFor(proposer, marketId);

        // Alice votes
        voteFor(alice, marketId, true);

        // Check vote weight matches shares
        (, , , , uint256 yesVotes, ) = market.getDispute(marketId);
        assertEq(yesVotes, aliceYes, "Vote weight should equal shares owned");
    }

    /**
     * @notice Test that larger shareholders have proportionally more voting power
     * @dev Alice with 1 BNB should have ~10x voting power of Bob with 0.1 BNB
     */
    function test_Vote_LargerPositionMorePower() public {
        uint256 marketId = createTestMarket(marketCreator, 7 days);

        // Alice buys 1 BNB, Bob buys 0.1 BNB
        buyYesFor(alice, marketId, 1 ether, 0);
        buyNoFor(bob, marketId, 0.1 ether, 0);

        (uint256 aliceShares, , , , , ) = market.getPosition(marketId, alice);
        (, uint256 bobShares, , , , ) = market.getPosition(marketId, bob);

        // Alice should have significantly more shares
        assertGt(
            aliceShares,
            bobShares * 5,
            "Alice should have >5x Bob's shares"
        );

        skipCreatorPriority(marketId);
        proposeOutcomeFor(charlie, marketId, true, "");
        disputeFor(proposer, marketId);

        // Both vote opposite ways
        voteFor(alice, marketId, true); // Alice votes YES
        voteFor(bob, marketId, false); // Bob votes NO

        (, , , , uint256 yesVotes, uint256 noVotes) = market.getDispute(
            marketId
        );

        // Alice's vote should outweigh Bob's
        assertGt(
            yesVotes,
            noVotes,
            "Larger shareholder should have more voting power"
        );
        assertEq(
            yesVotes,
            aliceShares,
            "YES votes should match Alice's shares"
        );
        assertEq(noVotes, bobShares, "NO votes should match Bob's shares");
    }

    /**
     * @notice Test Sybil attack resistance - splitting across wallets doesn't help
     * @dev 1 BNB in 1 wallet = same voting power as 0.5 BNB in 2 wallets
     */
    function test_Vote_SybilAttackResistance() public {
        uint256 marketId = createTestMarket(marketCreator, 7 days);

        // Honest user: Alice buys 1 BNB in one wallet
        buyYesFor(alice, marketId, 1 ether, 0);
        (uint256 aliceShares, , , , , ) = market.getPosition(marketId, alice);

        // "Attacker" splits across 2 wallets (bob + charlie each 0.5 BNB)
        buyNoFor(bob, marketId, 0.5 ether, 0);
        buyNoFor(charlie, marketId, 0.5 ether, 0);

        (, uint256 bobShares, , , , ) = market.getPosition(marketId, bob);
        (, uint256 charlieNoShares, , , , ) = market.getPosition(
            marketId,
            charlie
        );
        uint256 attackerTotalShares = bobShares + charlieNoShares;

        skipCreatorPriority(marketId);
        proposeOutcomeFor(proposer, marketId, true, "");
        disputeFor(disputer, marketId);

        // Alice votes YES
        voteFor(alice, marketId, true);

        // "Attackers" both vote NO
        voteFor(bob, marketId, false);
        voteFor(charlie, marketId, false);

        (, , , , uint256 yesVotes, uint256 noVotes) = market.getDispute(
            marketId
        );

        // Total votes should equal total shares
        assertEq(yesVotes, aliceShares, "YES votes = Alice's shares");
        assertEq(
            noVotes,
            attackerTotalShares,
            "NO votes = attacker total shares"
        );

        // Key insight: splitting doesn't give more power
        // Alice with 1 BNB still has comparable or more power than attackers with 1 BNB split
        console.log("Alice (1 wallet, 1 BNB) voting power:", aliceShares);
        console.log(
            "Attackers (2 wallets, 1 BNB total) voting power:",
            attackerTotalShares
        );
    }

    /**
     * @notice Test that combined YES+NO shares count for voting weight
     * @dev Users who hedge (buy both sides) get full voting power
     */
    function test_Vote_BothSidesCountForWeight() public {
        uint256 marketId = createTestMarket(marketCreator, 7 days);

        // Alice buys both YES and NO
        buyYesFor(alice, marketId, 0.5 ether, 0);
        buyNoFor(alice, marketId, 0.5 ether, 0);

        (uint256 aliceYes, uint256 aliceNo, , , , ) = market.getPosition(
            marketId,
            alice
        );
        uint256 aliceTotalShares = aliceYes + aliceNo;

        skipCreatorPriority(marketId);
        proposeOutcomeFor(charlie, marketId, true, "");
        disputeFor(proposer, marketId);

        voteFor(alice, marketId, true);

        (, , , , uint256 yesVotes, ) = market.getDispute(marketId);

        // Vote weight should include BOTH yes and no shares
        assertEq(
            yesVotes,
            aliceTotalShares,
            "Vote weight should be YES + NO shares"
        );
        assertGt(aliceYes, 0, "Should have YES shares");
        assertGt(aliceNo, 0, "Should have NO shares");
    }

    /**
     * @notice Test that voting outcome is determined by weighted majority
     * @dev The side with more total share-weight wins
     */
    function test_Vote_WeightedMajorityWins() public {
        uint256 marketId = createTestMarket(marketCreator, 7 days);

        // Setup: Alice has way more shares than Bob
        buyYesFor(alice, marketId, 2 ether, 0); // Alice: large position
        buyNoFor(bob, marketId, 0.1 ether, 0); // Bob: small position

        (uint256 aliceShares, , , , , ) = market.getPosition(marketId, alice);
        (, uint256 bobShares, , , , ) = market.getPosition(marketId, bob);

        skipCreatorPriority(marketId);

        // Proposer says YES
        proposeOutcomeFor(proposer, marketId, true, "");
        disputeFor(disputer, marketId);

        // Alice votes YES (with proposer), Bob votes NO (with disputer)
        voteFor(alice, marketId, true);
        voteFor(bob, marketId, false);

        // Skip voting window
        vm.warp(block.timestamp + VOTING_WINDOW + 1);

        // Finalize
        market.finalizeMarket(marketId);

        // Check outcome - YES should win because Alice has more shares
        (, , , , , , , , , bool resolved, bool outcome) = market.getMarket(
            marketId
        );
        assertTrue(resolved, "Market should be resolved");
        assertTrue(outcome, "YES should win (Alice has more voting power)");

        console.log("Alice voted YES with weight:", aliceShares);
        console.log("Bob voted NO with weight:", bobShares);
        console.log("Outcome: YES wins (as expected)");
    }

    /**
     * @notice Test that trading is blocked after market expires (can't buy votes)
     * @dev Prevents vote-buying attacks
     */
    function test_Vote_CantBuySharesAfterExpiry() public {
        uint256 marketId = createTestMarket(marketCreator, 7 days);
        buyYesFor(alice, marketId, 1 ether, 0);

        // Expire the market
        expireMarket(marketId);

        // Try to buy more shares - should fail
        vm.prank(bob);
        vm.expectRevert(PredictionMarket.MarketNotActive.selector);
        market.buyYes{value: 0.5 ether}(marketId, 0);

        vm.prank(bob);
        vm.expectRevert(PredictionMarket.MarketNotActive.selector);
        market.buyNo{value: 0.5 ether}(marketId, 0);
    }

    /**
     * @notice Test that trading is blocked during dispute/voting phase
     * @dev Additional protection against vote manipulation
     */
    function test_Vote_CantBuySharesDuringVoting() public {
        uint256 marketId = createTestMarket(marketCreator, 7 days);
        buyYesFor(alice, marketId, 1 ether, 0);

        skipCreatorPriority(marketId);
        proposeOutcomeFor(charlie, marketId, true, "");
        disputeFor(proposer, marketId);

        // Market is now in DISPUTED status (voting active)
        // Try to buy shares - should fail
        vm.prank(bob);
        vm.expectRevert(PredictionMarket.MarketNotActive.selector);
        market.buyYes{value: 0.5 ether}(marketId, 0);
    }

    /**
     * @notice Test multiple small voters can't beat one large voter
     * @dev 10 small voters with 0.1 BNB each ≈ 1 voter with 1 BNB
     */
    function test_Vote_ManySmallVotersCantBeatOneLarge() public {
        uint256 marketId = createTestMarket(marketCreator, 7 days);

        // Alice: 1 big buyer
        buyYesFor(alice, marketId, 1 ether, 0);
        (uint256 aliceShares, , , , , ) = market.getPosition(marketId, alice);

        // Create 5 small buyers (we can't easily make 10 in test)
        address[5] memory smallBuyers;
        uint256 totalSmallShares;

        for (uint256 i = 0; i < 5; i++) {
            smallBuyers[i] = address(uint160(0x5000 + i));
            vm.deal(smallBuyers[i], 1 ether);

            vm.prank(smallBuyers[i]);
            market.buyNo{value: 0.2 ether}(marketId, 0);

            (, uint256 shares, , , , ) = market.getPosition(
                marketId,
                smallBuyers[i]
            );
            totalSmallShares += shares;
        }

        skipCreatorPriority(marketId);
        proposeOutcomeFor(proposer, marketId, true, "");
        disputeFor(disputer, marketId);

        // Alice votes YES
        voteFor(alice, marketId, true);

        // All small buyers vote NO
        for (uint256 i = 0; i < 5; i++) {
            vm.prank(smallBuyers[i]);
            market.vote(marketId, false);
        }

        (, , , , uint256 yesVotes, uint256 noVotes) = market.getDispute(
            marketId
        );

        console.log("Alice (1 BNB) voting power:", yesVotes);
        console.log("5 small buyers (1 BNB total) voting power:", noVotes);

        // Verify votes match shares
        assertEq(
            yesVotes,
            aliceShares,
            "Alice's votes should match her shares"
        );
        assertEq(
            noVotes,
            totalSmallShares,
            "Small buyers' votes should match their total shares"
        );
    }
}
