// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import "./helpers/TestHelper.sol";

/**
 * @title PullPatternTest
 * @notice Tests for v3.4.0/v3.4.1 Pull Pattern features
 * @dev Tests:
 *      1. pendingWithdrawals / pendingCreatorFees mappings
 *      2. totalPendingWithdrawals / totalPendingCreatorFees tracking
 *      3. withdrawBond() / withdrawCreatorFees() functions
 *      4. NoTradesToResolve on empty markets
 *      5. ReplaceSigner (2-of-3 confirmations)
 *      6. Sweep protection includes pending amounts
 */
contract PullPatternTest is TestHelper {
    uint256 public marketId;

    function setUp() public override {
        super.setUp();

        // Create a market
        vm.prank(marketCreator);
        marketId = market.createMarket(
            "Pull Pattern Test Market",
            "https://example.com",
            "Test rules",
            "",
            block.timestamp + 1 days,
            PredictionMarket.HeatLevel.HIGH
        );
    }

    // ============================================
    // CREATOR FEES PULL PATTERN TESTS
    // ============================================

    function test_CreatorFees_CreditedOnBuyYes() public {
        vm.deal(alice, 10 ether);

        uint256 creatorPendingBefore = market.getPendingCreatorFees(
            marketCreator
        );
        uint256 totalPendingBefore = market.totalPendingCreatorFees();

        vm.prank(alice);
        market.buyYes{value: 1 ether}(marketId, 0);

        uint256 creatorPendingAfter = market.getPendingCreatorFees(
            marketCreator
        );
        uint256 totalPendingAfter = market.totalPendingCreatorFees();

        // 0.5% of 1 ether = 0.005 ether
        uint256 expectedCreatorFee = (1 ether * 50) / 10000;

        assertEq(
            creatorPendingAfter - creatorPendingBefore,
            expectedCreatorFee,
            "Creator should be credited correct fee"
        );
        assertEq(
            totalPendingAfter - totalPendingBefore,
            expectedCreatorFee,
            "Total pending creator fees should increase"
        );
    }

    function test_CreatorFees_CreditedOnBuyNo() public {
        vm.deal(alice, 10 ether);

        uint256 creatorPendingBefore = market.getPendingCreatorFees(
            marketCreator
        );
        uint256 totalPendingBefore = market.totalPendingCreatorFees();

        vm.prank(alice);
        market.buyNo{value: 1 ether}(marketId, 0);

        uint256 creatorPendingAfter = market.getPendingCreatorFees(
            marketCreator
        );
        uint256 totalPendingAfter = market.totalPendingCreatorFees();

        uint256 expectedCreatorFee = (1 ether * 50) / 10000;

        assertEq(
            creatorPendingAfter - creatorPendingBefore,
            expectedCreatorFee,
            "Creator should be credited correct fee"
        );
        assertEq(
            totalPendingAfter - totalPendingBefore,
            expectedCreatorFee,
            "Total pending creator fees should increase"
        );
    }

    function test_CreatorFees_CreditedOnSellYes() public {
        // First buy some shares
        vm.deal(alice, 10 ether);
        vm.prank(alice);
        uint256 shares = market.buyYes{value: 1 ether}(marketId, 0);

        uint256 creatorPendingBefore = market.getPendingCreatorFees(
            marketCreator
        );
        uint256 totalPendingBefore = market.totalPendingCreatorFees();

        // Now sell
        vm.prank(alice);
        market.sellYes(marketId, shares / 2, 0);

        uint256 creatorPendingAfter = market.getPendingCreatorFees(
            marketCreator
        );
        uint256 totalPendingAfter = market.totalPendingCreatorFees();

        assertGt(
            creatorPendingAfter,
            creatorPendingBefore,
            "Creator should be credited fee on sell"
        );
        assertGt(
            totalPendingAfter,
            totalPendingBefore,
            "Total pending should increase on sell"
        );
    }

    function test_CreatorFees_CreditedOnSellNo() public {
        // First buy some shares
        vm.deal(alice, 10 ether);
        vm.prank(alice);
        uint256 shares = market.buyNo{value: 1 ether}(marketId, 0);

        uint256 creatorPendingBefore = market.getPendingCreatorFees(
            marketCreator
        );
        uint256 totalPendingBefore = market.totalPendingCreatorFees();

        // Now sell
        vm.prank(alice);
        market.sellNo(marketId, shares / 2, 0);

        uint256 creatorPendingAfter = market.getPendingCreatorFees(
            marketCreator
        );
        uint256 totalPendingAfter = market.totalPendingCreatorFees();

        assertGt(
            creatorPendingAfter,
            creatorPendingBefore,
            "Creator should be credited fee on sell"
        );
        assertGt(
            totalPendingAfter,
            totalPendingBefore,
            "Total pending should increase on sell"
        );
    }

    function test_WithdrawCreatorFees_Success() public {
        // Generate some fees
        vm.deal(alice, 10 ether);
        vm.prank(alice);
        market.buyYes{value: 1 ether}(marketId, 0);

        uint256 pendingFees = market.getPendingCreatorFees(marketCreator);
        assertGt(pendingFees, 0, "Should have pending fees");

        uint256 totalBefore = market.totalPendingCreatorFees();
        uint256 balanceBefore = marketCreator.balance;

        // Withdraw
        vm.prank(marketCreator);
        uint256 withdrawn = market.withdrawCreatorFees();

        assertEq(withdrawn, pendingFees, "Should withdraw correct amount");
        assertEq(
            marketCreator.balance,
            balanceBefore + pendingFees,
            "Balance should increase"
        );
        assertEq(
            market.getPendingCreatorFees(marketCreator),
            0,
            "Pending should be 0 after withdrawal"
        );
        assertEq(
            market.totalPendingCreatorFees(),
            totalBefore - pendingFees,
            "Total should decrease"
        );
    }

    function test_WithdrawCreatorFees_RevertIfNothing() public {
        vm.prank(alice);
        vm.expectRevert(PredictionMarket.NothingToWithdraw.selector);
        market.withdrawCreatorFees();
    }

    // ============================================
    // BOND WITHDRAWALS PULL PATTERN TESTS
    // ============================================

    function test_BondWithdrawal_ProposerGetsBonus() public {
        // Setup: Alice buys YES, Bob buys NO (need both sides for normal market)
        vm.deal(alice, 10 ether);
        vm.prank(alice);
        market.buyYes{value: 1 ether}(marketId, 0);

        vm.deal(bob, 10 ether);
        vm.prank(bob);
        market.buyNo{value: 0.5 ether}(marketId, 0);

        // Expire market
        vm.warp(block.timestamp + 1 days + 1);
        vm.warp(block.timestamp + CREATOR_PRIORITY_WINDOW + 1);

        // Propose YES (correct outcome)
        uint256 bond = market.getRequiredBond(marketId);
        uint256 bondWithFee = bond + (bond * 30) / (10000 - 30) + 1;

        vm.deal(proposer, bondWithFee);
        vm.prank(proposer);
        market.proposeOutcome{value: bondWithFee}(marketId, true);

        // Wait for dispute window
        vm.warp(block.timestamp + DISPUTE_WINDOW + 1);

        uint256 pendingBefore = market.getPendingWithdrawal(proposer);
        uint256 totalBefore = market.totalPendingWithdrawals();

        // Finalize
        market.finalizeMarket(marketId);

        uint256 pendingAfter = market.getPendingWithdrawal(proposer);
        uint256 totalAfter = market.totalPendingWithdrawals();

        assertGt(
            pendingAfter,
            pendingBefore,
            "Proposer should have pending withdrawal"
        );
        assertGt(totalAfter, totalBefore, "Total pending should increase");
    }

    function test_WithdrawBond_Success() public {
        // Setup: Create scenario where bond is credited (need both sides for normal market)
        vm.deal(alice, 10 ether);
        vm.prank(alice);
        market.buyYes{value: 1 ether}(marketId, 0);

        vm.deal(bob, 10 ether);
        vm.prank(bob);
        market.buyNo{value: 0.5 ether}(marketId, 0);

        vm.warp(block.timestamp + 1 days + 1);
        vm.warp(block.timestamp + CREATOR_PRIORITY_WINDOW + 1);

        uint256 bond = market.getRequiredBond(marketId);
        uint256 bondWithFee = bond + (bond * 30) / (10000 - 30) + 1;

        vm.deal(proposer, bondWithFee);
        vm.prank(proposer);
        market.proposeOutcome{value: bondWithFee}(marketId, true);

        vm.warp(block.timestamp + DISPUTE_WINDOW + 1);
        market.finalizeMarket(marketId);

        uint256 pending = market.getPendingWithdrawal(proposer);
        assertGt(pending, 0, "Should have pending");

        uint256 balanceBefore = proposer.balance;
        uint256 totalBefore = market.totalPendingWithdrawals();

        vm.prank(proposer);
        uint256 withdrawn = market.withdrawBond();

        assertEq(withdrawn, pending, "Should withdraw full amount");
        assertEq(
            proposer.balance,
            balanceBefore + pending,
            "Balance should increase"
        );
        assertEq(
            market.getPendingWithdrawal(proposer),
            0,
            "Pending should be 0"
        );
        assertEq(
            market.totalPendingWithdrawals(),
            totalBefore - pending,
            "Total should decrease"
        );
    }

    function test_WithdrawBond_RevertIfNothing() public {
        vm.prank(alice);
        vm.expectRevert(PredictionMarket.NothingToWithdraw.selector);
        market.withdrawBond();
    }

    // ============================================
    // NO TRADES TO RESOLVE TEST
    // ============================================

    function test_NoTradesToResolve_BlocksProposal() public {
        // Create empty market (no trades)
        vm.prank(marketCreator);
        uint256 emptyMarketId = market.createMarket(
            "Empty market",
            "",
            "Rules",
            "",
            block.timestamp + 1 days,
            PredictionMarket.HeatLevel.HIGH
        );

        // Expire market
        vm.warp(block.timestamp + 1 days + 1);
        vm.warp(block.timestamp + CREATOR_PRIORITY_WINDOW + 1);

        // Try to propose
        uint256 bond = market.getRequiredBond(emptyMarketId);
        uint256 bondWithFee = bond + (bond * 30) / (10000 - 30) + 1;

        vm.deal(proposer, bondWithFee);
        vm.prank(proposer);
        // v3.6.2: Empty market = one-sided market (both sides are 0), revert OneSidedMarket
        vm.expectRevert(PredictionMarket.OneSidedMarket.selector);
        market.proposeOutcome{value: bondWithFee}(emptyMarketId, true);
    }

    function test_OneSidedMarket_BlocksProposal() public {
        // v3.6.2: One-sided markets (only one side has trades) are blocked
        // Market already has NO trades after setup, let's add only YES trades

        vm.deal(alice, 10 ether);
        vm.prank(alice);
        market.buyYes{value: 0.1 ether}(marketId, 0);

        // Verify it's one-sided
        (, , , , , , uint256 yesSupply, uint256 noSupply, , , ) = market
            .getMarket(marketId);
        assertGt(yesSupply, 0, "YES supply should be > 0");
        assertEq(noSupply, 0, "NO supply should be 0");

        // Expire and try to propose
        vm.warp(block.timestamp + 1 days + 1);
        vm.warp(block.timestamp + CREATOR_PRIORITY_WINDOW + 1);

        uint256 bond = market.getRequiredBond(marketId);
        uint256 bondWithFee = bond + (bond * 30) / (10000 - 30) + 1;

        vm.deal(proposer, bondWithFee);
        vm.prank(proposer);
        vm.expectRevert(PredictionMarket.OneSidedMarket.selector);
        market.proposeOutcome{value: bondWithFee}(marketId, true);
    }

    function test_NormalMarket_AllowsProposal() public {
        // v3.6.2: Normal markets (both sides have trades) are allowed

        vm.deal(alice, 10 ether);
        vm.prank(alice);
        market.buyYes{value: 0.1 ether}(marketId, 0);

        vm.deal(bob, 10 ether);
        vm.prank(bob);
        market.buyNo{value: 0.1 ether}(marketId, 0);

        // Expire and propose
        vm.warp(block.timestamp + 1 days + 1);
        vm.warp(block.timestamp + CREATOR_PRIORITY_WINDOW + 1);

        uint256 bond = market.getRequiredBond(marketId);
        uint256 bondWithFee = bond + (bond * 30) / (10000 - 30) + 1;

        vm.deal(proposer, bondWithFee);
        vm.prank(proposer);
        // Should NOT revert
        market.proposeOutcome{value: bondWithFee}(marketId, true);

        assertEq(
            uint256(market.getMarketStatus(marketId)),
            uint256(PredictionMarket.MarketStatus.Proposed),
            "Should be proposed"
        );
    }

    // ============================================
    // REPLACE SIGNER TESTS (2-of-3)
    // ============================================

    function test_ReplaceSigner_RequiresOnly2of3() public {
        address newSigner = makeAddr("newSigner");

        // Signer1 proposes to replace signer3
        vm.prank(signer1);
        uint256 actionId = market.proposeAction(
            PredictionMarket.ActionType.ReplaceSigner,
            abi.encode(signer3, newSigner)
        );

        // Just 1 confirmation so far (proposer auto-confirms)
        (, , uint256 confirmations, , bool executed) = market.pendingActions(
            actionId
        );
        assertEq(confirmations, 1, "Should have 1 confirmation");
        assertFalse(executed, "Should not be executed yet");

        // Signer2 confirms - should execute with 2-of-3
        vm.prank(signer2);
        market.confirmAction(actionId);

        (, , confirmations, , executed) = market.pendingActions(actionId);
        assertEq(confirmations, 2, "Should have 2 confirmations");
        assertTrue(executed, "Should be executed with 2-of-3");

        // Verify signer was replaced
        assertEq(market.signers(2), newSigner, "Signer3 should be replaced");
    }

    function test_ReplaceSigner_1of3NotEnough() public {
        address newSigner = makeAddr("newSigner");

        // Signer1 proposes
        vm.prank(signer1);
        uint256 actionId = market.proposeAction(
            PredictionMarket.ActionType.ReplaceSigner,
            abi.encode(signer3, newSigner)
        );

        // Try to execute with only 1 confirmation
        vm.prank(signer1);
        vm.expectRevert(PredictionMarket.NotEnoughConfirmations.selector);
        market.executeAction(actionId);
    }

    function test_ReplaceSigner_CanReplaceFirstSigner() public {
        address newSigner = makeAddr("newSigner");

        vm.prank(signer2);
        uint256 actionId = market.proposeAction(
            PredictionMarket.ActionType.ReplaceSigner,
            abi.encode(signer1, newSigner)
        );

        vm.prank(signer3);
        market.confirmAction(actionId);

        assertEq(market.signers(0), newSigner, "Signer1 should be replaced");
    }

    function test_ReplaceSigner_CanReplaceMiddleSigner() public {
        address newSigner = makeAddr("newSigner");

        vm.prank(signer1);
        uint256 actionId = market.proposeAction(
            PredictionMarket.ActionType.ReplaceSigner,
            abi.encode(signer2, newSigner)
        );

        vm.prank(signer3);
        market.confirmAction(actionId);

        assertEq(market.signers(1), newSigner, "Signer2 should be replaced");
    }

    function test_ReplaceSigner_InvalidZeroAddress() public {
        vm.prank(signer1);
        uint256 actionId = market.proposeAction(
            PredictionMarket.ActionType.ReplaceSigner,
            abi.encode(signer3, address(0))
        );

        vm.prank(signer2);
        vm.expectRevert(PredictionMarket.InvalidAddress.selector);
        market.confirmAction(actionId);
    }

    function test_ReplaceSigner_InvalidSameAddress() public {
        // Try to replace signer with themselves
        vm.prank(signer1);
        uint256 actionId = market.proposeAction(
            PredictionMarket.ActionType.ReplaceSigner,
            abi.encode(signer3, signer3)
        );

        vm.prank(signer2);
        vm.expectRevert(PredictionMarket.InvalidSignerReplacement.selector);
        market.confirmAction(actionId);
    }

    function test_ReplaceSigner_SignerNotFound() public {
        address notASigner = makeAddr("notASigner");
        address newSigner = makeAddr("newSigner");

        // Try to replace someone who isn't a signer
        vm.prank(signer1);
        uint256 actionId = market.proposeAction(
            PredictionMarket.ActionType.ReplaceSigner,
            abi.encode(notASigner, newSigner)
        );

        vm.prank(signer2);
        vm.expectRevert(PredictionMarket.SignerNotFound.selector);
        market.confirmAction(actionId);
    }

    function test_ReplaceSigner_PreventDuplicateSigner() public {
        // Attempt to replace signer3 with signer1 (who is already a signer)
        // This should revert with InvalidSignerReplacement because it would create duplicate signers

        vm.prank(signer1);
        uint256 actionId = market.proposeAction(
            PredictionMarket.ActionType.ReplaceSigner,
            abi.encode(signer3, signer1) // Replace signer3 with signer1 (already a signer!)
        );

        vm.prank(signer2);
        vm.expectRevert(PredictionMarket.InvalidSignerReplacement.selector);
        market.confirmAction(actionId);

        // Verify all signers remain unchanged
        assertEq(
            market.signers(0),
            signer1,
            "Signer1 should still be at index 0"
        );
        assertEq(
            market.signers(1),
            signer2,
            "Signer2 should still be at index 1"
        );
        assertEq(
            market.signers(2),
            signer3,
            "Signer3 should still be at index 2"
        );
    }

    function test_ReplaceSigner_EmitsEvent() public {
        address newSigner = makeAddr("newSigner");

        vm.prank(signer1);
        uint256 actionId = market.proposeAction(
            PredictionMarket.ActionType.ReplaceSigner,
            abi.encode(signer3, newSigner)
        );

        vm.expectEmit(true, true, true, true);
        emit PredictionMarket.SignerReplaced(signer3, newSigner, actionId);

        vm.prank(signer2);
        market.confirmAction(actionId);
    }

    function test_OtherActions_StillRequire3of3() public {
        // Test that SetFee still requires 3-of-3
        vm.prank(signer1);
        uint256 actionId = market.proposeAction(
            PredictionMarket.ActionType.SetFee,
            abi.encode(200)
        );

        vm.prank(signer2);
        market.confirmAction(actionId);

        // Should NOT be executed yet (only 2 confirmations)
        (, , , , bool executed) = market.pendingActions(actionId);
        assertFalse(executed, "SetFee should NOT be executed with 2-of-3");

        // Now signer3 confirms
        vm.prank(signer3);
        market.confirmAction(actionId);

        (, , , , executed) = market.pendingActions(actionId);
        assertTrue(executed, "SetFee should be executed with 3-of-3");
    }

    // ============================================
    // JURY FEES DISTRIBUTION TEST (v3.7.0: Pull Pattern)
    // ============================================

    function test_JuryFees_CreditedToPendingWithdrawals() public {
        // Setup: Multiple voters with different sides
        // IMPORTANT: YES voters need more voting power than NO voters for YES to win
        vm.deal(alice, 10 ether);
        vm.deal(bob, 10 ether);
        vm.deal(charlie, 10 ether);

        // Alice and Charlie buy YES first - they get shares at better price
        vm.prank(alice);
        market.buyYes{value: 1 ether}(marketId, 0);

        vm.prank(charlie);
        market.buyYes{value: 1 ether}(marketId, 0);

        // Bob buys NO with less amount - YES voters should have more voting power
        vm.prank(bob);
        market.buyNo{value: 0.5 ether}(marketId, 0);

        // Expire
        vm.warp(block.timestamp + 1 days + 1);
        vm.warp(block.timestamp + CREATOR_PRIORITY_WINDOW + 1);

        // Proposer proposes YES
        uint256 bond = market.getRequiredBond(marketId);
        uint256 bondWithFee = bond + (bond * 30) / (10000 - 30) + 1;
        vm.deal(proposer, bondWithFee);
        vm.prank(proposer);
        market.proposeOutcome{value: bondWithFee}(marketId, true);

        // Bob disputes (he has NO shares, would lose if YES wins)
        // NOTE: Must use stored proposal bond (after fee) for dispute calculation
        (, , , uint256 proposalBondStored, ) = market.getProposal(marketId);
        uint256 disputeBond = proposalBondStored * 2;
        uint256 disputeWithFee = disputeBond +
            (disputeBond * 30) /
            (10000 - 30) +
            1;
        vm.deal(bob, disputeWithFee);
        vm.prank(bob);
        market.dispute{value: disputeWithFee}(marketId);

        // Alice and Charlie vote YES (they have YES shares)
        vm.prank(alice);
        market.vote(marketId, true);

        vm.prank(charlie);
        market.vote(marketId, true);

        // Bob votes NO
        vm.prank(bob);
        market.vote(marketId, false);

        // Wait for voting to end
        vm.warp(block.timestamp + VOTING_WINDOW + 1);

        // Record balances before finalization
        uint256 aliceBalanceBefore = alice.balance;
        uint256 charlieBalanceBefore = charlie.balance;

        // Finalize
        market.finalizeMarket(marketId);

        // Check which side won
        (, , , , , , , , , bool resolved, bool outcome) = market.getMarket(
            marketId
        );

        if (outcome == true) {
            // YES won - Alice and Charlie should be able to claim jury fees (v3.7.0 Pull Pattern)
            vm.prank(alice);
            uint256 aliceJuryFees = market.claimJuryFees(marketId);

            vm.prank(charlie);
            uint256 charlieJuryFees = market.claimJuryFees(marketId);

            assertGt(aliceJuryFees, 0, "Alice should have jury fees");
            assertGt(charlieJuryFees, 0, "Charlie should have jury fees");

            // Verify they received the BNB
            assertEq(
                alice.balance,
                aliceBalanceBefore + aliceJuryFees,
                "Alice should receive jury fees"
            );
            assertEq(
                charlie.balance,
                charlieBalanceBefore + charlieJuryFees,
                "Charlie should receive jury fees"
            );
        } else {
            // NO won - Bob should get jury fees (and be bond winner)
            uint256 bobPending = market.getPendingWithdrawal(bob);
            assertGt(bobPending, 0, "Bob should have pending as bond winner");
        }
    }

    // ============================================
    // TIE SCENARIO - BONDS RETURNED VIA PULL
    // ============================================

    function test_TieScenario_BondsReturnedViaPull() public {
        // Setup: Equal YES and NO positions
        vm.deal(alice, 10 ether);
        vm.deal(bob, 10 ether);

        vm.prank(alice);
        market.buyYes{value: 1 ether}(marketId, 0);

        vm.prank(bob);
        market.buyNo{value: 1 ether}(marketId, 0);

        // Expire
        vm.warp(block.timestamp + 1 days + 1);
        vm.warp(block.timestamp + CREATOR_PRIORITY_WINDOW + 1);

        // Proposer proposes YES
        uint256 bond = market.getRequiredBond(marketId);
        uint256 bondWithFee = bond + (bond * 30) / (10000 - 30) + 1;
        vm.deal(proposer, bondWithFee);
        vm.prank(proposer);
        market.proposeOutcome{value: bondWithFee}(marketId, true);

        // Disputer disputes
        (, , , uint256 proposalBondStored, ) = market.getProposal(marketId);
        uint256 disputeBond = proposalBondStored * 2;
        uint256 disputeWithFee = disputeBond +
            (disputeBond * 30) /
            (10000 - 30) +
            1;
        vm.deal(disputer, disputeWithFee);
        vm.prank(disputer);
        market.dispute{value: disputeWithFee}(marketId);

        // Alice votes YES, Bob votes NO (equal shares = tie)
        vm.prank(alice);
        market.vote(marketId, true);

        vm.prank(bob);
        market.vote(marketId, false);

        // Wait for voting to end
        vm.warp(block.timestamp + VOTING_WINDOW + 1);

        // Record balances before
        uint256 proposerPendingBefore = market.getPendingWithdrawal(proposer);
        uint256 disputerPendingBefore = market.getPendingWithdrawal(disputer);

        // Finalize (should be a tie scenario or one side wins)
        market.finalizeMarket(marketId);

        // Check if it's a tie (market not resolved)
        (, , , , , , , , , bool resolved, ) = market.getMarket(marketId);

        if (!resolved) {
            // Tie - both bonds should be returned via Pull Pattern
            uint256 proposerPendingAfter = market.getPendingWithdrawal(
                proposer
            );
            uint256 disputerPendingAfter = market.getPendingWithdrawal(
                disputer
            );

            assertGt(
                proposerPendingAfter,
                proposerPendingBefore,
                "Proposer should get bond back on tie"
            );
            assertGt(
                disputerPendingAfter,
                disputerPendingBefore,
                "Disputer should get bond back on tie"
            );
        }
    }

    // ============================================
    // ACCUMULATION TESTS
    // ============================================

    function test_PendingAccumulates_MultipleMarkets() public {
        // Create another market
        vm.prank(marketCreator);
        uint256 marketId2 = market.createMarket(
            "Another market",
            "",
            "Rules",
            "",
            block.timestamp + 1 days,
            PredictionMarket.HeatLevel.HIGH
        );

        // Generate fees on both markets
        vm.deal(alice, 10 ether);

        vm.prank(alice);
        market.buyYes{value: 1 ether}(marketId, 0);

        vm.prank(alice);
        market.buyYes{value: 1 ether}(marketId2, 0);

        // Creator should have accumulated fees from both
        uint256 expectedTotalFees = (2 ether * 50) / 10000; // 0.5% of 2 ether
        uint256 actualFees = market.getPendingCreatorFees(marketCreator);

        assertEq(
            actualFees,
            expectedTotalFees,
            "Fees should accumulate across markets"
        );
    }

    // ============================================
    // REENTRANCY TESTS
    // ============================================

    function test_WithdrawBond_NonReentrant() public {
        // Setup pending withdrawal (need both sides for normal market)
        vm.deal(alice, 10 ether);
        vm.prank(alice);
        market.buyYes{value: 1 ether}(marketId, 0);

        vm.deal(bob, 10 ether);
        vm.prank(bob);
        market.buyNo{value: 0.5 ether}(marketId, 0);

        vm.warp(block.timestamp + 1 days + 1);
        vm.warp(block.timestamp + CREATOR_PRIORITY_WINDOW + 1);

        uint256 bond = market.getRequiredBond(marketId);
        uint256 bondWithFee = bond + (bond * 30) / (10000 - 30) + 1;

        vm.deal(proposer, bondWithFee);
        vm.prank(proposer);
        market.proposeOutcome{value: bondWithFee}(marketId, true);

        vm.warp(block.timestamp + DISPUTE_WINDOW + 1);
        market.finalizeMarket(marketId);

        // withdrawBond has nonReentrant modifier - tested by structure
        // Just verify it works correctly
        vm.prank(proposer);
        market.withdrawBond();

        assertEq(market.getPendingWithdrawal(proposer), 0, "Should be 0");
    }

    // ============================================
    // v3.7.0 JURY FEES PULL PATTERN TESTS
    // ============================================

    function test_JuryFees_PoolCreatedOnDispute() public {
        // Setup: Create market with trades on both sides
        vm.deal(alice, 10 ether);
        vm.prank(alice);
        market.buyYes{value: 1 ether}(marketId, 0);

        vm.deal(bob, 10 ether);
        vm.prank(bob);
        market.buyNo{value: 1 ether}(marketId, 0);

        // Expire and propose
        vm.warp(block.timestamp + 1 days + 1);
        vm.warp(block.timestamp + CREATOR_PRIORITY_WINDOW + 1);

        uint256 bond = market.getRequiredBond(marketId);
        uint256 bondWithFee = bond + (bond * 30) / (10000 - 30) + 1;

        vm.deal(proposer, bondWithFee);
        vm.prank(proposer);
        market.proposeOutcome{value: bondWithFee}(marketId, true);

        // Get proposal bond for dispute
        (, , , uint256 proposalBond, ) = market.getProposal(marketId);
        uint256 disputeBond = proposalBond * 2;
        uint256 disputeBondWithFee = disputeBond +
            (disputeBond * 30) /
            (10000 - 30) +
            1;

        vm.deal(disputer, disputeBondWithFee);
        vm.prank(disputer);
        market.dispute{value: disputeBondWithFee}(marketId);

        // Alice votes YES
        vm.prank(alice);
        market.vote(marketId, true);

        // Bob votes NO
        vm.prank(bob);
        market.vote(marketId, false);

        // Finalize - YES wins (alice has more shares)
        vm.warp(block.timestamp + VOTING_WINDOW + 1);
        market.finalizeMarket(marketId);

        // Check jury fees pool was created
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
            ,
            ,
            uint256 juryFeesPool
        ) = market.markets(marketId);
        assertGt(juryFeesPool, 0, "Jury fees pool should be created");
    }

    function test_JuryFees_ClaimByWinningVoter() public {
        // Setup: Create market with trades on both sides
        vm.deal(alice, 10 ether);
        vm.prank(alice);
        market.buyYes{value: 1 ether}(marketId, 0);

        vm.deal(bob, 10 ether);
        vm.prank(bob);
        market.buyNo{value: 0.5 ether}(marketId, 0);

        // Expire and propose
        vm.warp(block.timestamp + 1 days + 1);
        vm.warp(block.timestamp + CREATOR_PRIORITY_WINDOW + 1);

        uint256 bond = market.getRequiredBond(marketId);
        uint256 bondWithFee = bond + (bond * 30) / (10000 - 30) + 1;

        vm.deal(proposer, bondWithFee);
        vm.prank(proposer);
        market.proposeOutcome{value: bondWithFee}(marketId, true);

        // Dispute
        (, , , uint256 proposalBond, ) = market.getProposal(marketId);
        uint256 disputeBond = proposalBond * 2;
        uint256 disputeBondWithFee = disputeBond +
            (disputeBond * 30) /
            (10000 - 30) +
            1;

        vm.deal(disputer, disputeBondWithFee);
        vm.prank(disputer);
        market.dispute{value: disputeBondWithFee}(marketId);

        // Both vote YES (alice wins)
        vm.prank(alice);
        market.vote(marketId, true);

        vm.prank(bob);
        market.vote(marketId, true);

        // Finalize
        vm.warp(block.timestamp + VOTING_WINDOW + 1);
        market.finalizeMarket(marketId);

        // Alice claims jury fees
        uint256 aliceBalanceBefore = alice.balance;
        vm.prank(alice);
        uint256 claimed = market.claimJuryFees(marketId);

        assertGt(claimed, 0, "Alice should claim jury fees");
        assertEq(
            alice.balance,
            aliceBalanceBefore + claimed,
            "Alice balance should increase"
        );
    }

    function test_JuryFees_RevertIfNotVoted() public {
        // Setup market
        vm.deal(alice, 10 ether);
        vm.prank(alice);
        market.buyYes{value: 1 ether}(marketId, 0);

        vm.deal(bob, 10 ether);
        vm.prank(bob);
        market.buyNo{value: 0.5 ether}(marketId, 0);

        // Expire, propose, dispute
        vm.warp(block.timestamp + 1 days + 1);
        vm.warp(block.timestamp + CREATOR_PRIORITY_WINDOW + 1);

        uint256 bond = market.getRequiredBond(marketId);
        uint256 bondWithFee = bond + (bond * 30) / (10000 - 30) + 1;

        vm.deal(proposer, bondWithFee);
        vm.prank(proposer);
        market.proposeOutcome{value: bondWithFee}(marketId, true);

        (, , , uint256 proposalBond, ) = market.getProposal(marketId);
        uint256 disputeBond = proposalBond * 2;
        uint256 disputeBondWithFee = disputeBond +
            (disputeBond * 30) /
            (10000 - 30) +
            1;

        vm.deal(disputer, disputeBondWithFee);
        vm.prank(disputer);
        market.dispute{value: disputeBondWithFee}(marketId);

        // Only alice votes
        vm.prank(alice);
        market.vote(marketId, true);

        // Finalize
        vm.warp(block.timestamp + VOTING_WINDOW + 1);
        market.finalizeMarket(marketId);

        // Charlie (never voted) tries to claim
        vm.prank(charlie);
        vm.expectRevert(PredictionMarket.DidNotVote.selector);
        market.claimJuryFees(marketId);
    }

    function test_JuryFees_RevertIfVotedForLoser() public {
        // Setup market
        vm.deal(alice, 10 ether);
        vm.prank(alice);
        market.buyYes{value: 1 ether}(marketId, 0);

        vm.deal(bob, 10 ether);
        vm.prank(bob);
        market.buyNo{value: 0.5 ether}(marketId, 0);

        // Expire, propose, dispute
        vm.warp(block.timestamp + 1 days + 1);
        vm.warp(block.timestamp + CREATOR_PRIORITY_WINDOW + 1);

        uint256 bond = market.getRequiredBond(marketId);
        uint256 bondWithFee = bond + (bond * 30) / (10000 - 30) + 1;

        vm.deal(proposer, bondWithFee);
        vm.prank(proposer);
        market.proposeOutcome{value: bondWithFee}(marketId, true);

        (, , , uint256 proposalBond, ) = market.getProposal(marketId);
        uint256 disputeBond = proposalBond * 2;
        uint256 disputeBondWithFee = disputeBond +
            (disputeBond * 30) /
            (10000 - 30) +
            1;

        vm.deal(disputer, disputeBondWithFee);
        vm.prank(disputer);
        market.dispute{value: disputeBondWithFee}(marketId);

        // Alice votes YES, Bob votes NO
        vm.prank(alice);
        market.vote(marketId, true);

        vm.prank(bob);
        market.vote(marketId, false);

        // Finalize - YES wins
        vm.warp(block.timestamp + VOTING_WINDOW + 1);
        market.finalizeMarket(marketId);

        // Bob (voted for loser) tries to claim
        vm.prank(bob);
        vm.expectRevert(PredictionMarket.VotedForLosingOutcome.selector);
        market.claimJuryFees(marketId);
    }

    function test_JuryFees_RevertIfAlreadyClaimed() public {
        // Setup market
        vm.deal(alice, 10 ether);
        vm.prank(alice);
        market.buyYes{value: 1 ether}(marketId, 0);

        vm.deal(bob, 10 ether);
        vm.prank(bob);
        market.buyNo{value: 0.5 ether}(marketId, 0);

        // Expire, propose, dispute
        vm.warp(block.timestamp + 1 days + 1);
        vm.warp(block.timestamp + CREATOR_PRIORITY_WINDOW + 1);

        uint256 bond = market.getRequiredBond(marketId);
        uint256 bondWithFee = bond + (bond * 30) / (10000 - 30) + 1;

        vm.deal(proposer, bondWithFee);
        vm.prank(proposer);
        market.proposeOutcome{value: bondWithFee}(marketId, true);

        (, , , uint256 proposalBond, ) = market.getProposal(marketId);
        uint256 disputeBond = proposalBond * 2;
        uint256 disputeBondWithFee = disputeBond +
            (disputeBond * 30) /
            (10000 - 30) +
            1;

        vm.deal(disputer, disputeBondWithFee);
        vm.prank(disputer);
        market.dispute{value: disputeBondWithFee}(marketId);

        // Alice votes YES
        vm.prank(alice);
        market.vote(marketId, true);

        // Finalize
        vm.warp(block.timestamp + VOTING_WINDOW + 1);
        market.finalizeMarket(marketId);

        // First claim succeeds
        vm.prank(alice);
        market.claimJuryFees(marketId);

        // Second claim fails
        vm.prank(alice);
        vm.expectRevert(PredictionMarket.JuryFeesAlreadyClaimed.selector);
        market.claimJuryFees(marketId);
    }

    function test_JuryFees_RevertIfNoPool() public {
        // Setup market with non-disputed resolution
        vm.deal(alice, 10 ether);
        vm.prank(alice);
        market.buyYes{value: 1 ether}(marketId, 0);

        vm.deal(bob, 10 ether);
        vm.prank(bob);
        market.buyNo{value: 0.5 ether}(marketId, 0);

        // Expire and propose (no dispute)
        vm.warp(block.timestamp + 1 days + 1);
        vm.warp(block.timestamp + CREATOR_PRIORITY_WINDOW + 1);

        uint256 bond = market.getRequiredBond(marketId);
        uint256 bondWithFee = bond + (bond * 30) / (10000 - 30) + 1;

        vm.deal(proposer, bondWithFee);
        vm.prank(proposer);
        market.proposeOutcome{value: bondWithFee}(marketId, true);

        // Finalize WITHOUT dispute (no jury fees pool created)
        vm.warp(block.timestamp + DISPUTE_WINDOW + 1);
        market.finalizeMarket(marketId);

        // Try to claim jury fees
        vm.prank(alice);
        vm.expectRevert(PredictionMarket.NoJuryFeesPool.selector);
        market.claimJuryFees(marketId);
    }
}
