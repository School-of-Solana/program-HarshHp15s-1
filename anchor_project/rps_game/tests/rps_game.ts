import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { RpsGame } from "../target/types/rps_game";
import { expect } from "chai";

describe("rps_game", () => {
  // Configure the client to use the local cluster.
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.RpsGame as Program<RpsGame>;

  // Test keypairs
  let player1: anchor.web3.Keypair;
  let player2: anchor.web3.Keypair;
  let gameAccount: anchor.web3.PublicKey;

  before(async () => {
    // Create test players
    player1 = anchor.web3.Keypair.generate();
    player2 = anchor.web3.Keypair.generate();

    // Airdrop SOL to test accounts
    await provider.connection.confirmTransaction(
      await provider.connection.requestAirdrop(player1.publicKey, 2 * anchor.web3.LAMPORTS_PER_SOL),
      "confirmed"
    );
    await provider.connection.confirmTransaction(
      await provider.connection.requestAirdrop(player2.publicKey, 2 * anchor.web3.LAMPORTS_PER_SOL),
      "confirmed"
    );

    // Derive game PDA
    [gameAccount] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("game"), player1.publicKey.toBuffer()],
      program.programId
    );
  });

  describe("Happy Path Tests", () => {
    it("Create a new game", async () => {
      const betAmount = new anchor.BN(1000000); // 0.001 SOL

      const tx = await program.methods
        .createGame(betAmount)
        .accounts({
          game: gameAccount,
          player: player1.publicKey,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .signers([player1])
        .rpc();

      console.log("Create game transaction signature", tx);

      // Verify game state
      const gameState = await program.account.game.fetch(gameAccount);
      expect(gameState.player1.toString()).to.equal(player1.publicKey.toString());
      expect(gameState.player2.toString()).to.equal(anchor.web3.PublicKey.default.toString());
      expect(gameState.betAmount.toString()).to.equal(betAmount.toString());
      expect(gameState.gameState).to.deep.equal({ waitingForPlayer: {} });
      expect(gameState.player1Move).to.deep.equal({ none: {} });
      expect(gameState.player2Move).to.deep.equal({ none: {} });
    });

    it("Player 2 joins the game", async () => {
      const tx = await program.methods
        .joinGame()
        .accounts({
          game: gameAccount,
          player: player2.publicKey,
        })
        .signers([player2])
        .rpc();

      console.log("Join game transaction signature", tx);

      // Verify game state
      const gameState = await program.account.game.fetch(gameAccount);
      expect(gameState.player2.toString()).to.equal(player2.publicKey.toString());
      expect(gameState.gameState).to.deep.equal({ inProgress: {} });
    });

    it("Player 1 makes a move (Rock)", async () => {
      const tx = await program.methods
        .makeMove({ rock: {} })
        .accounts({
          game: gameAccount,
          player: player1.publicKey,
        })
        .signers([player1])
        .rpc();

      console.log("Player 1 move transaction signature", tx);

      // Verify game state
      const gameState = await program.account.game.fetch(gameAccount);
      expect(gameState.player1Move).to.deep.equal({ rock: {} });
      expect(gameState.gameState).to.deep.equal({ inProgress: {} });
    });

    it("Player 2 makes a move (Scissors) - Player 1 should win", async () => {
      const tx = await program.methods
        .makeMove({ scissors: {} })
        .accounts({
          game: gameAccount,
          player: player2.publicKey,
        })
        .signers([player2])
        .rpc();

      console.log("Player 2 move transaction signature", tx);

      // Verify game state - Rock beats Scissors, Player 1 wins
      const gameState = await program.account.game.fetch(gameAccount);
      expect(gameState.player2Move).to.deep.equal({ scissors: {} });
      expect(gameState.gameState).to.deep.equal({ finished: {} });
      expect(gameState.winner.toString()).to.equal(player1.publicKey.toString());
    });

    it("Reset game for another round", async () => {
      const tx = await program.methods
        .resetGame()
        .accounts({
          game: gameAccount,
          player: player1.publicKey,
        })
        .signers([player1])
        .rpc();

      console.log("Reset game transaction signature", tx);

      // Verify game state
      const gameState = await program.account.game.fetch(gameAccount);
      expect(gameState.player1Move).to.deep.equal({ none: {} });
      expect(gameState.player2Move).to.deep.equal({ none: {} });
      expect(gameState.gameState).to.deep.equal({ inProgress: {} });
      expect(gameState.winner.toString()).to.equal(anchor.web3.PublicKey.default.toString());
    });

    it("Test Paper beats Rock", async () => {
      // Player 1 plays Rock
      await program.methods
        .makeMove({ rock: {} })
        .accounts({
          game: gameAccount,
          player: player1.publicKey,
        })
        .signers([player1])
        .rpc();

      // Player 2 plays Paper - should win
      await program.methods
        .makeMove({ paper: {} })
        .accounts({
          game: gameAccount,
          player: player2.publicKey,
        })
        .signers([player2])
        .rpc();

      const gameState = await program.account.game.fetch(gameAccount);
      expect(gameState.winner.toString()).to.equal(player2.publicKey.toString());
      expect(gameState.gameState).to.deep.equal({ finished: {} });
    });

    it("Test Scissors beats Paper", async () => {
      // Reset for new round
      await program.methods
        .resetGame()
        .accounts({
          game: gameAccount,
          player: player1.publicKey,
        })
        .signers([player1])
        .rpc();

      // Player 1 plays Scissors
      await program.methods
        .makeMove({ scissors: {} })
        .accounts({
          game: gameAccount,
          player: player1.publicKey,
        })
        .signers([player1])
        .rpc();

      // Player 2 plays Paper - Player 1 should win
      await program.methods
        .makeMove({ paper: {} })
        .accounts({
          game: gameAccount,
          player: player2.publicKey,
        })
        .signers([player2])
        .rpc();

      const gameState = await program.account.game.fetch(gameAccount);
      expect(gameState.winner.toString()).to.equal(player1.publicKey.toString());
    });

    it("Test Draw scenario", async () => {
      // Reset for new round
      await program.methods
        .resetGame()
        .accounts({
          game: gameAccount,
          player: player2.publicKey,
        })
        .signers([player2])
        .rpc();

      // Both players play Rock
      await program.methods
        .makeMove({ rock: {} })
        .accounts({
          game: gameAccount,
          player: player1.publicKey,
        })
        .signers([player1])
        .rpc();

      await program.methods
        .makeMove({ rock: {} })
        .accounts({
          game: gameAccount,
          player: player2.publicKey,
        })
        .signers([player2])
        .rpc();

      const gameState = await program.account.game.fetch(gameAccount);
      expect(gameState.winner.toString()).to.equal(anchor.web3.PublicKey.default.toString());
      expect(gameState.gameState).to.deep.equal({ finished: {} });
    });
  });

  describe("Unhappy Path Tests (Error Scenarios)", () => {
    let newGameAccount: anchor.web3.PublicKey;
    let player3: anchor.web3.Keypair;

    before(async () => {
      player3 = anchor.web3.Keypair.generate();
      await provider.connection.confirmTransaction(
        await provider.connection.requestAirdrop(player3.publicKey, anchor.web3.LAMPORTS_PER_SOL),
        "confirmed"
      );

      [newGameAccount] = anchor.web3.PublicKey.findProgramAddressSync(
        [Buffer.from("game"), player3.publicKey.toBuffer()],
        program.programId
      );

      // Create a fresh game for error testing
      await program.methods
        .createGame(new anchor.BN(1000000))
        .accounts({
          game: newGameAccount,
          player: player3.publicKey,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .signers([player3])
        .rpc();
    });

    it("Should fail when player tries to play against themselves", async () => {
      try {
        await program.methods
          .joinGame()
          .accounts({
            game: newGameAccount,
            player: player3.publicKey, // Same as player1
          })
          .signers([player3])
          .rpc();
        expect.fail("Should have thrown an error");
      } catch (error) {
        expect(error.error.errorMessage).to.include("Cannot play against yourself");
      }
    });

    it("Should fail when trying to make a move before game starts", async () => {
      try {
        await program.methods
          .makeMove({ rock: {} })
          .accounts({
            game: newGameAccount,
            player: player3.publicKey,
          })
          .signers([player3])
          .rpc();
        expect.fail("Should have thrown an error");
      } catch (error) {
        expect(error.error.errorMessage).to.include("Invalid game state");
      }
    });

    it("Should fail when unauthorized player tries to make a move", async () => {
      // First, let player1 join the game
      await program.methods
        .joinGame()
        .accounts({
          game: newGameAccount,
          player: player1.publicKey,
        })
        .signers([player1])
        .rpc();

      // Now try to make a move with unauthorized player
      try {
        await program.methods
          .makeMove({ rock: {} })
          .accounts({
            game: newGameAccount,
            player: player2.publicKey, // Not part of this game
          })
          .signers([player2])
          .rpc();
        expect.fail("Should have thrown an error");
      } catch (error) {
        expect(error.error.errorMessage).to.include("Unauthorized player");
      }
    });

    it("Should fail when player tries to make invalid move (None)", async () => {
      try {
        await program.methods
          .makeMove({ none: {} })
          .accounts({
            game: newGameAccount,
            player: player3.publicKey,
          })
          .signers([player3])
          .rpc();
        expect.fail("Should have thrown an error");
      } catch (error) {
        expect(error.error.errorMessage).to.include("Invalid move");
      }
    });

    it("Should fail when player tries to make move twice", async () => {
      // Player3 makes first move
      await program.methods
        .makeMove({ rock: {} })
        .accounts({
          game: newGameAccount,
          player: player3.publicKey,
        })
        .signers([player3])
        .rpc();

      // Try to make another move
      try {
        await program.methods
          .makeMove({ paper: {} })
          .accounts({
            game: newGameAccount,
            player: player3.publicKey,
          })
          .signers([player3])
          .rpc();
        expect.fail("Should have thrown an error");
      } catch (error) {
        expect(error.error.errorMessage).to.include("Move already made");
      }
    });

    it("Should fail when trying to reset game before it's finished", async () => {
      try {
        await program.methods
          .resetGame()
          .accounts({
            game: newGameAccount,
            player: player3.publicKey,
          })
          .signers([player3])
          .rpc();
        expect.fail("Should have thrown an error");
      } catch (error) {
        expect(error.error.errorMessage).to.include("Invalid game state");
      }
    });

    it("Should fail when unauthorized player tries to reset game", async () => {
      // Complete the game first
      await program.methods
        .makeMove({ paper: {} })
        .accounts({
          game: newGameAccount,
          player: player1.publicKey,
        })
        .signers([player1])
        .rpc();

      // Try to reset with unauthorized player
      try {
        await program.methods
          .resetGame()
          .accounts({
            game: newGameAccount,
            player: player2.publicKey, // Not part of this game
          })
          .signers([player2])
          .rpc();
        expect.fail("Should have thrown an error");
      } catch (error) {
        expect(error.error.errorMessage).to.include("Unauthorized player");
      }
    });
  });
});