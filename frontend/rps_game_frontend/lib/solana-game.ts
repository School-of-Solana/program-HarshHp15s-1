import { Connection, PublicKey, SystemProgram, LAMPORTS_PER_SOL } from "@solana/web3.js"
import { Program, AnchorProvider, BN, type Idl } from "@coral-xyz/anchor"
import rpsGameIdl from "./rps-game-idl.json"

const PROGRAM_ID = new PublicKey("pPYPJwpeo16rTvhJNdX4wGs2DzX7fUPpFQKo9AzMt3E")
const NETWORK = "https://api.devnet.solana.com"

export interface GameAccount {
  player1: PublicKey
  player2: PublicKey
  betAmount: BN
  gameState: { waitingForPlayer?: {} } | { inProgress?: {} } | { finished?: {} }
  player1Move: { none?: {} } | { rock?: {} } | { paper?: {} } | { scissors?: {} }
  player2Move: { none?: {} } | { rock?: {} } | { paper?: {} } | { scissors?: {} }
  winner: PublicKey
  createdAt: BN
  bump: number
}

export enum Move {
  None = "None",
  Rock = "Rock",
  Paper = "Paper",
  Scissors = "Scissors",
}

export enum GameState {
  WaitingForPlayer = "WaitingForPlayer",
  InProgress = "InProgress",
  Finished = "Finished",
}

export class SolanaGameClient {
  private connection: Connection
  private program: Program | null = null

  constructor() {
    this.connection = new Connection(NETWORK, "confirmed")
  }

  async initialize(wallet: any) {
    if (!wallet) throw new Error("Wallet not connected")

    // Use the wallet adapter directly - it already implements the required interface
    const provider = new AnchorProvider(this.connection, wallet, { commitment: "confirmed" })

    this.program = new Program(rpsGameIdl as Idl, provider)
    return this.program
  }

  async createGame(betAmount: number, wallet: any): Promise<string> {
    if (!this.program) await this.initialize(wallet)
    if (!this.program) throw new Error("Program not initialized")

    if (!wallet || !wallet.publicKey) {
      throw new Error("Wallet public key is not available")
    }

    const betAmountLamports = new BN(betAmount * LAMPORTS_PER_SOL)
    const player = wallet.publicKey

    console.log("[v0] Player public key:", player.toString())
    console.log("[v0] Creating PDA with correct seeds matching IDL")

    const [gameAccount] = PublicKey.findProgramAddressSync([Buffer.from("game"), player.toBytes()], PROGRAM_ID)

    console.log("[v0] Creating game with bet amount:", betAmountLamports.toString())
    console.log("[v0] Game account address:", gameAccount.toString())

    try {
      const existingGame = await this.getGameAccount(gameAccount.toString())
      if (existingGame) {
        console.log("[v0] Game already exists, checking state...")
        if (existingGame.gameState.finished) {
          console.log("[v0] Existing game is finished, resetting...")
          await this.resetGame(gameAccount.toString(), wallet)
        } else {
          throw new Error("You already have an active game. Please finish or reset it first.")
        }
      }
    } catch (error) {
      if (!error.message.includes("Account does not exist")) {
        throw error
      }
    }

    const tx = await this.program.methods
      .createGame(betAmountLamports)
      .accounts({
        game: gameAccount,
        player: player,
        systemProgram: SystemProgram.programId,
      })
      .rpc()

    console.log("[v0] Game created with transaction:", tx)
    return gameAccount.toString()
  }

  async joinGame(gameAddress: string, wallet: any): Promise<string> {
    if (!this.program) await this.initialize(wallet)
    if (!this.program) throw new Error("Program not initialized")

    if (!wallet || !wallet.publicKey) {
      throw new Error("Wallet public key is not available")
    }

    let gameAccount: PublicKey
    try {
      gameAccount = new PublicKey(gameAddress)
    } catch (error) {
      throw new Error("Invalid public key input")
    }

    const player = wallet.publicKey

    const gameData = await this.getGameAccount(gameAddress)
    if (!gameData) throw new Error("Game not found")

    const [derivedGameAccount] = PublicKey.findProgramAddressSync(
      [Buffer.from("game"), gameData.player1.toBytes()],
      PROGRAM_ID,
    )

    console.log("[v0] Joining game:", gameAddress)
    console.log("[v0] Derived game account:", derivedGameAccount.toString())
    console.log("[v0] Player:", player.toString())

    const tx = await this.program.methods
      .joinGame()
      .accounts({
        game: derivedGameAccount,
        player: player,
      })
      .rpc()

    console.log("[v0] Joined game with transaction:", tx)
    return tx
  }

  async makeMove(gameAddress: string, move: Move, wallet: any): Promise<string> {
    if (!this.program) await this.initialize(wallet)
    if (!this.program) throw new Error("Program not initialized")

    if (!wallet || !wallet.publicKey) {
      throw new Error("Wallet public key is not available")
    }

    const gameAccount = new PublicKey(gameAddress)
    const player = wallet.publicKey

    const gameData = await this.getGameAccount(gameAddress)
    if (!gameData) throw new Error("Game not found")

    const [derivedGameAccount] = PublicKey.findProgramAddressSync(
      [Buffer.from("game"), gameData.player1.toBytes()],
      PROGRAM_ID,
    )

    const moveVariant = { [move.toLowerCase()]: {} }

    console.log("[v0] Making move:", move)
    console.log("[v0] Move variant:", moveVariant)
    console.log("[v0] Derived game account:", derivedGameAccount.toString())

    const tx = await this.program.methods
      .makeMove(moveVariant)
      .accounts({
        game: derivedGameAccount,
        player: player,
      })
      .rpc()

    console.log("[v0] Move made with transaction:", tx)
    return tx
  }

  async resetGame(gameAddress: string, wallet: any): Promise<string> {
    if (!this.program) await this.initialize(wallet)
    if (!this.program) throw new Error("Program not initialized")

    if (!wallet || !wallet.publicKey) {
      throw new Error("Wallet public key is not available")
    }

    const gameAccount = new PublicKey(gameAddress)
    const player = wallet.publicKey

    const gameData = await this.getGameAccount(gameAddress)
    if (!gameData) throw new Error("Game not found")

    const [derivedGameAccount] = PublicKey.findProgramAddressSync(
      [Buffer.from("game"), gameData.player1.toBytes()],
      PROGRAM_ID,
    )

    console.log("[v0] Resetting game with derived account:", derivedGameAccount.toString())

    const tx = await this.program.methods
      .resetGame()
      .accounts({
        game: derivedGameAccount,
        player: player,
      })
      .rpc()

    console.log("[v0] Game reset with transaction:", tx)
    return tx
  }

  async getGameAccount(gameAddress: string): Promise<GameAccount | null> {
    if (!this.program) throw new Error("Program not initialized")

    try {
      const gameAccount = new PublicKey(gameAddress)
      const account = await this.program.account.game.fetch(gameAccount)
      console.log("[v0] Fetched game account:", account)
      return account as GameAccount
    } catch (error) {
      console.error("[v0] Error fetching game account:", error)
      return null
    }
  }

  async getAllGames(wallet: any): Promise<Array<{ publicKey: PublicKey; account: GameAccount }>> {
    if (!this.program) await this.initialize(wallet)
    if (!this.program) throw new Error("Program not initialized")

    try {
      const games = await this.program.account.game.all()
      console.log("[v0] Fetched all games:", games.length)
      return games as Array<{ publicKey: PublicKey; account: GameAccount }>
    } catch (error) {
      console.error("[v0] Error fetching games:", error)
      return []
    }
  }
}

export const gameClient = new SolanaGameClient()
