"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Users, Gamepad2, Trophy, Zap } from "lucide-react"
import { AnimatedBackground } from "@/components/animated-background"
import { GameArena } from "@/components/game-arena"
import { VolumeControls } from "@/components/volume-controls"
import { BotGame } from "@/components/bot-game"
import { useWallet } from "@solana/wallet-adapter-react"
import { WalletButton } from "@/components/wallet-button"
import { useToast } from "@/hooks/use-toast"
import { gameClient } from "@/lib/solana-game"
import { PublicKey } from "@solana/web3.js"

function TrinityShowdownGame() {
  const { connected, publicKey, wallet } = useWallet()
  const [gameMode, setGameMode] = useState<"menu" | "create" | "join" | "playing" | "bot">("menu")
  const [botDifficulty, setBotDifficulty] = useState<"easy" | "medium" | "hard" | null>(null)
  const [betAmount, setBetAmount] = useState("0.001")
  const [gameAddress, setGameAddress] = useState("")
  const [isCreatingGame, setIsCreatingGame] = useState(false)
  const [isJoiningGame, setIsJoiningGame] = useState(false)
  const [existingGame, setExistingGame] = useState<any>(null)
  const { toast } = useToast()

  const checkExistingGame = async () => {
    if (!connected || !publicKey || !wallet?.adapter) return

    try {
      console.log("[v0] Checking for existing game...")
      const [gameAccount] = PublicKey.findProgramAddressSync(
        [Buffer.from("game"), publicKey.toBytes()],
        new PublicKey("pPYPJwpeo16rTvhJNdX4wGs2DzX7fUPpFQKo9AzMt3E"),
      )

      const game = await gameClient.getGameAccount(gameAccount.toString())
      console.log("[v0] Game account data:", game)

      if (game && !game.gameState.finished) {
        console.log("[v0] Setting existing game:", gameAccount.toString())
        setExistingGame({ address: gameAccount.toString(), data: game })
      } else {
        console.log("[v0] No active game found")
        setExistingGame(null)
      }
    } catch (error) {
      console.log("[v0] No existing game found:", error)
      setExistingGame(null)
    }
  }

  useEffect(() => {
    if (connected && publicKey) {
      checkExistingGame()
    } else {
      setExistingGame(null)
    }
  }, [connected, publicKey])

  useEffect(() => {
    if (gameMode === "create" && connected && publicKey) {
      checkExistingGame()
    }
  }, [gameMode, connected, publicKey])

  const createGame = async () => {
    if (!connected || !publicKey) {
      toast({
        title: "Wallet Required",
        description: "Please connect your Solana wallet first",
        variant: "destructive",
      })
      return
    }

    await checkExistingGame()
    if (existingGame) {
      toast({
        title: "Active Game Found",
        description: "You already have an active game. Please continue or reset it first.",
        variant: "destructive",
      })
      return
    }

    setIsCreatingGame(true)
    try {
      console.log("[v0] Creating game with bet amount:", betAmount)
      console.log("[v0] Wallet connected:", connected)
      console.log("[v0] Public key:", publicKey.toString())

      const gameAddr = await gameClient.createGame(Number.parseFloat(betAmount), wallet?.adapter)
      setGameAddress(gameAddr)
      setGameMode("playing")
      setExistingGame(null)
      toast({
        title: "Game Created! 🎮",
        description: `Game Address: ${gameAddr.slice(0, 8)}...${gameAddr.slice(-8)}`,
      })
    } catch (error: any) {
      console.error("[v0] Error creating game:", error)
      await checkExistingGame()
      toast({
        title: "Failed to Create Game",
        description: error.message || "Please try again. Make sure your wallet is connected.",
        variant: "destructive",
      })
    } finally {
      setIsCreatingGame(false)
    }
  }

  const joinGame = async () => {
    if (!connected || !publicKey) {
      toast({
        title: "Wallet Required",
        description: "Please connect your Solana wallet first",
        variant: "destructive",
      })
      return
    }

    if (!gameAddress.trim()) {
      toast({
        title: "Game Address Required",
        description: "Please enter a valid game address",
        variant: "destructive",
      })
      return
    }

    if (existingGame && gameAddress.trim() === existingGame.address) {
      toast({
        title: "Cannot Join Own Game",
        description: "You cannot play against yourself. Share this address with another player.",
        variant: "destructive",
      })
      return
    }

    setIsJoiningGame(true)
    try {
      console.log("[v0] Joining game:", gameAddress)
      console.log("[v0] Wallet connected:", connected)
      console.log("[v0] Public key:", publicKey.toString())

      await gameClient.joinGame(gameAddress.trim(), wallet?.adapter)
      setGameMode("playing")
      toast({
        title: "Joined Game! 🚀",
        description: "Entering the arena...",
      })
    } catch (error: any) {
      console.error("[v0] Error joining game:", error)
      toast({
        title: "Failed to Join Game",
        description: error.message || "Please check the game address and try again",
        variant: "destructive",
      })
    } finally {
      setIsJoiningGame(false)
    }
  }

  const startBotGame = (difficulty: "easy" | "medium" | "hard") => {
    setBotDifficulty(difficulty)
    setGameMode("bot")
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      <AnimatedBackground />

      {/* Header */}
      <header className="relative z-10 p-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Zap className="w-8 h-8 text-primary animate-pulse-glow" />
              <h1 className="text-3xl font-bold neon-text">TRINITY SHOWDOWN</h1>
            </div>
            <Badge variant="secondary" className="glassmorphism">
              <Gamepad2 className="w-4 h-4 mr-1" />
              Solana DApp
            </Badge>
          </div>

          <div className="flex items-center gap-4">
            <VolumeControls />
            <WalletButton />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 flex-1 p-6">
        <div className="max-w-4xl mx-auto">
          {gameMode === "menu" && (
            <div className="text-center space-y-8">
              <div className="space-y-4">
                <h2 className="text-6xl font-bold neon-text mb-4">ENTER THE ARENA</h2>
                <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                  The ultimate Rock-Paper-Scissors battle on Solana blockchain. Connect your wallet and challenge
                  opponents in real-time combat.
                </p>
                {!connected && (
                  <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4 max-w-md mx-auto">
                    <p className="text-yellow-400 text-sm">🔗 Connect your Solana wallet to start playing live games</p>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-12">
                <Card
                  className="glassmorphism neon-border p-6 hover:animate-pulse-glow transition-all cursor-pointer"
                  onClick={() => startBotGame("easy")}
                >
                  <div className="text-center space-y-4">
                    <div className="w-16 h-16 mx-auto bg-green-500/20 rounded-full flex items-center justify-center">
                      <Gamepad2 className="w-8 h-8 text-green-400" />
                    </div>
                    <h3 className="text-xl font-bold">Easy Mode</h3>
                    <p className="text-sm text-muted-foreground">Practice Boss   </p>
                    <Button variant="outline" className="w-full bg-transparent">
                      Play 
                    </Button>
                  </div>
                </Card>

                <Card
                  className="glassmorphism neon-border p-6 hover:animate-pulse-glow transition-all cursor-pointer"
                  onClick={() => startBotGame("medium")}
                >
                  <div className="text-center space-y-4">
                    <div className="w-16 h-16 mx-auto bg-yellow-500/20 rounded-full flex items-center justify-center">
                      <Trophy className="w-8 h-8 text-yellow-400" />
                    </div>
                    <h3 className="text-xl font-bold">Medium Mode</h3>
                    <p className="text-sm text-muted-foreground">Challenge Boss  </p>
                    <Button variant="outline" className="w-full bg-transparent">
                      Play 
                    </Button>
                  </div>
                </Card>

                <Card
                  className="glassmorphism neon-border p-6 hover:animate-pulse-glow transition-all cursor-pointer"
                  onClick={() => startBotGame("hard")}
                >
                  <div className="text-center space-y-4">
                    <div className="w-16 h-16 mx-auto bg-red-500/20 rounded-full flex items-center justify-center">
                      <Zap className="w-8 h-8 text-red-400" />
                    </div>
                    <h3 className="text-xl font-bold">Hard Mode</h3>
                    <p className="text-sm text-muted-foreground"> Kill Boss</p>
                    <Button variant="outline" className="w-full bg-transparent">
                      Play 
                    </Button>
                  </div>
                </Card>

                <Card className="glassmorphism neon-border p-6 hover:animate-pulse-glow transition-all cursor-pointer">
                  <div className="text-center space-y-4">
                    <div className="w-16 h-16 mx-auto bg-accent/20 rounded-full flex items-center justify-center">
                      <Users className="w-8 h-8 text-accent" />
                    </div>
                    <h3 className="text-xl font-bold">Play Live</h3>
                    <p className="text-sm text-muted-foreground">Real opponents</p>
                    <Button
                      className="w-full animate-pulse-glow"
                      onClick={() => setGameMode("create")}
                      disabled={!connected}
                    >
                      {connected ? "Enter Arena" : "Connect Wallet"}
                    </Button>
                  </div>
                </Card>
              </div>
            </div>
          )}

          {gameMode === "create" && (
            <div className="max-w-md mx-auto">
              <Card className="glassmorphism neon-border p-8">
                <div className="text-center space-y-6">
                  <h2 className="text-3xl font-bold neon-text">Create Battle</h2>
                  <p className="text-muted-foreground">Set your bet and create a new game</p>

                  {!connected && (
                    <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
                      <p className="text-red-400 text-sm">Please connect your wallet first</p>
                    </div>
                  )}

                  {existingGame && (
                    <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
                      <p className="text-yellow-400 text-sm mb-3">You have an active game waiting for a player</p>
                      <div className="space-y-2">
                        <p className="text-xs text-muted-foreground font-mono">
                          {existingGame.address.slice(0, 8)}...{existingGame.address.slice(-8)}
                        </p>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setGameAddress(existingGame.address)
                            setGameMode("playing")
                          }}
                          className="w-full"
                        >
                          Continue Game
                        </Button>
                      </div>
                    </div>
                  )}

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Bet Amount (SOL)</label>
                      <Input
                        type="number"
                        value={betAmount}
                        onChange={(e) => setBetAmount(e.target.value)}
                        min="0.001"
                        step="0.001"
                        className="glassmorphism neon-border text-center text-lg"
                        placeholder="0.001"
                        disabled={!connected}
                      />
                    </div>

                    <div className="flex gap-3">
                      <Button variant="outline" onClick={() => setGameMode("menu")} className="flex-1">
                        Back
                      </Button>
                      <Button
                        onClick={createGame}
                        className="flex-1 animate-pulse-glow"
                        disabled={isCreatingGame || !connected || existingGame}
                      >
                        {isCreatingGame ? "Creating..." : existingGame ? "Continue Existing" : "Create Game"}
                      </Button>
                    </div>

                    <div className="pt-4 border-t border-border">
                      <p className="text-sm text-muted-foreground mb-3">Or join existing game:</p>
                      <Input
                        value={gameAddress}
                        onChange={(e) => setGameAddress(e.target.value)}
                        placeholder="Enter game address..."
                        className="glassmorphism mb-3"
                        disabled={!connected}
                      />
                      <Button
                        onClick={joinGame}
                        variant="secondary"
                        className="w-full"
                        disabled={isJoiningGame || !connected || !gameAddress.trim()}
                      >
                        {isJoiningGame ? "Joining..." : "Join Game"}
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          )}

          {gameMode === "playing" && (
            <GameArena gameAddress={gameAddress} betAmount={betAmount} onBack={() => setGameMode("menu")} />
          )}

          {gameMode === "bot" && botDifficulty && (
            <BotGame difficulty={botDifficulty} onBack={() => setGameMode("menu")} />
          )}
        </div>
      </main>
    </div>
  )
}

export default function TrinityShowdown() {
  return (
    <div>
      <TrinityShowdownGame />
    </div>
  )
}
