"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Clock, Trophy, Zap } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useWallet } from "@solana/wallet-adapter-react"
import { gameClient, Move as SolanaMove, type GameAccount } from "@/lib/solana-game"

interface GameArenaProps {
  gameAddress: string
  betAmount: string
  onBack: () => void
}

type Move = "rock" | "paper" | "scissors" | null
type GameState = "waiting" | "playing" | "finished"

export function GameArena({ gameAddress, betAmount, onBack }: GameArenaProps) {
  const [playerMove, setPlayerMove] = useState<Move>(null)
  const [opponentMove, setOpponentMove] = useState<Move>(null)
  const [gameState, setGameState] = useState<GameState>("waiting")
  const [winner, setWinner] = useState<"player" | "opponent" | "tie" | null>(null)
  const [timeLeft, setTimeLeft] = useState(30)
  const [gameData, setGameData] = useState<GameAccount | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()
  const { connected, publicKey, wallet } = useWallet()

  const moves = [
    { id: "rock", emoji: "🪨", name: "Rock", color: "text-destructive" },
    { id: "paper", emoji: "📄", name: "Paper", color: "text-secondary" },
    { id: "scissors", emoji: "✂️", name: "Scissors", color: "text-accent" },
  ]

  useEffect(() => {
    const pollGameState = async () => {
      try {
        const data = await gameClient.getGameAccount(gameAddress)
        if (data) {
          setGameData(data)

          // Check if game state changed
          if (data.gameState.inProgress && gameState === "waiting") {
            setGameState("playing")
            toast({
              title: "Opponent Joined!",
              description: "Battle begins now!",
            })
          }

          // Check if both players made moves
          if (data.player1Move && !data.player1Move.none && data.player2Move && !data.player2Move.none) {
            const p1Move = Object.keys(data.player1Move)[0] as Move
            const p2Move = Object.keys(data.player2Move)[0] as Move

            const isPlayer1 = publicKey?.toString() === data.player1.toString()

            setPlayerMove(isPlayer1 ? p1Move : p2Move)
            setOpponentMove(isPlayer1 ? p2Move : p1Move)

            // Determine winner
            const result = determineWinner(isPlayer1 ? p1Move : p2Move, isPlayer1 ? p2Move : p1Move)
            setWinner(result)
            setGameState("finished")

            toast({
              title: result === "player" ? "Victory!" : result === "opponent" ? "Defeat!" : "Tie!",
              description:
                result === "player"
                  ? `You won ${betAmount} SOL!`
                  : result === "opponent"
                    ? "Better luck next time!"
                    : "No winner this round",
              variant: result === "opponent" ? "destructive" : "default",
            })
          }
        }
      } catch (error) {
        console.error("[v0] Error polling game state:", error)
      }
    }

    const interval = setInterval(pollGameState, 2000) // Poll every 2 seconds
    pollGameState() // Initial poll

    return () => clearInterval(interval)
  }, [gameAddress, gameState, publicKey, betAmount, toast])

  useEffect(() => {
    if (gameState === "playing" && timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000)
      return () => clearTimeout(timer)
    } else if (timeLeft === 0 && gameState === "playing" && !playerMove) {
      // Auto-select random move if time runs out
      const randomMove = moves[Math.floor(Math.random() * moves.length)].id as Move
      makeMove(randomMove)
    }
  }, [timeLeft, gameState, playerMove])

  const makeMove = async (move: Move) => {
    if (playerMove || gameState !== "playing" || !connected || !publicKey || isLoading) return

    setIsLoading(true)
    try {
      setPlayerMove(move)

      // Convert move to Solana enum
      const solanaMove = move === "rock" ? SolanaMove.Rock : move === "paper" ? SolanaMove.Paper : SolanaMove.Scissors

      toast({
        title: "Submitting Move...",
        description: "Please confirm the transaction in your wallet",
      })

      const walletContextObject = {
        publicKey: publicKey,
        signTransaction: wallet?.adapter?.signTransaction,
        signAllTransactions: wallet?.adapter?.signAllTransactions,
        sendTransaction: wallet?.adapter?.sendTransaction,
      }

      const tx = await gameClient.makeMove(gameAddress, solanaMove, walletContextObject)

      toast({
        title: "Move Submitted!",
        description: "Waiting for opponent...",
      })

      console.log("[v0] Move transaction:", tx)
    } catch (error) {
      console.error("[v0] Error making move:", error)
      toast({
        title: "Error",
        description: "Failed to submit move. Please try again.",
        variant: "destructive",
      })
      setPlayerMove(null) // Reset on error
    } finally {
      setIsLoading(false)
    }
  }

  const determineWinner = (playerMove: Move, opponentMove: Move): "player" | "opponent" | "tie" => {
    if (playerMove === opponentMove) return "tie"

    const winConditions = {
      rock: "scissors",
      paper: "rock",
      scissors: "paper",
    }

    return winConditions[playerMove as keyof typeof winConditions] === opponentMove ? "player" : "opponent"
  }

  const resetGame = async () => {
    if (!connected || !publicKey || isLoading) return

    setIsLoading(true)
    try {
      toast({
        title: "Resetting Game...",
        description: "Please confirm the transaction in your wallet",
      })

      const walletContextObject = {
        publicKey: publicKey,
        signTransaction: wallet?.adapter?.signTransaction,
        signAllTransactions: wallet?.adapter?.signAllTransactions,
        sendTransaction: wallet?.adapter?.sendTransaction,
      }

      const tx = await gameClient.resetGame(gameAddress, walletContextObject)

      setPlayerMove(null)
      setOpponentMove(null)
      setGameState("playing")
      setWinner(null)
      setTimeLeft(30)

      toast({
        title: "Game Reset!",
        description: "Ready for another round",
      })

      console.log("[v0] Reset transaction:", tx)
    } catch (error) {
      console.error("[v0] Error resetting game:", error)
      toast({
        title: "Error",
        description: "Failed to reset game. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button variant="outline" onClick={onBack} className="glassmorphism bg-transparent">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Menu
        </Button>

        <div className="flex items-center gap-4">
          <Badge variant="secondary" className="glassmorphism">
            Bet: {betAmount} SOL
          </Badge>
          <Badge variant="outline" className="glassmorphism">
            Game: {gameAddress.slice(0, 8)}...
          </Badge>
          {gameData && (
            <Badge variant="outline" className="glassmorphism">
              Players: {gameData.player2.toString() !== "11111111111111111111111111111111" ? "2/2" : "1/2"}
            </Badge>
          )}
        </div>
      </div>

      {/* Game Status */}
      <Card className="glassmorphism neon-border p-6">
        <div className="text-center space-y-4">
          {gameState === "waiting" && (
            <>
              <div className="animate-pulse">
                <Clock className="w-12 h-12 mx-auto text-secondary mb-4" />
                <h2 className="text-2xl font-bold">Waiting for Opponent...</h2>
                <p className="text-muted-foreground">Share your game address to invite players</p>
                <Button
                  variant="outline"
                  onClick={() => {
                    navigator.clipboard.writeText(gameAddress)
                    toast({ title: "Copied!", description: "Game address copied to clipboard" })
                  }}
                  className="mt-2"
                >
                  Copy Game Address
                </Button>
              </div>
            </>
          )}

          {gameState === "playing" && (
            <>
              <div className="flex items-center justify-center gap-2 mb-4">
                <Zap className="w-6 h-6 text-accent animate-pulse" />
                <h2 className="text-2xl font-bold neon-text">BATTLE IN PROGRESS</h2>
                <Zap className="w-6 h-6 text-accent animate-pulse" />
              </div>
              <div className="text-4xl font-bold text-primary">{timeLeft}s</div>
              <p className="text-muted-foreground">Choose your weapon!</p>
            </>
          )}

          {gameState === "finished" && (
            <>
              <Trophy className="w-12 h-12 mx-auto text-accent mb-4" />
              <h2 className="text-2xl font-bold">
                {winner === "player" && <span className="text-accent neon-text">VICTORY!</span>}
                {winner === "opponent" && <span className="text-destructive">DEFEAT!</span>}
                {winner === "tie" && <span className="text-secondary">TIE GAME!</span>}
              </h2>
            </>
          )}
        </div>
      </Card>

      {/* Battle Arena */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Player Side */}
        <Card className="glassmorphism neon-border p-6">
          <div className="text-center space-y-4">
            <h3 className="text-lg font-bold text-accent">YOU</h3>
            <div className="w-24 h-24 mx-auto bg-accent/20 rounded-full flex items-center justify-center text-4xl">
              {playerMove ? moves.find((m) => m.id === playerMove)?.emoji : "❓"}
            </div>
            <p className="text-sm text-muted-foreground">
              {playerMove ? moves.find((m) => m.id === playerMove)?.name : "Waiting..."}
            </p>
          </div>
        </Card>

        {/* VS */}
        <Card className="glassmorphism neon-border p-6">
          <div className="text-center space-y-4">
            <h3 className="text-2xl font-bold neon-text">VS</h3>
            <div className="text-6xl animate-pulse-glow">⚡</div>
            <p className="text-sm text-muted-foreground">Trinity Showdown</p>
          </div>
        </Card>

        {/* Opponent Side */}
        <Card className="glassmorphism neon-border p-6">
          <div className="text-center space-y-4">
            <h3 className="text-lg font-bold text-primary">OPPONENT</h3>
            <div className="w-24 h-24 mx-auto bg-primary/20 rounded-full flex items-center justify-center text-4xl">
              {opponentMove ? moves.find((m) => m.id === opponentMove)?.emoji : "❓"}
            </div>
            <p className="text-sm text-muted-foreground">
              {opponentMove ? moves.find((m) => m.id === opponentMove)?.name : "Waiting..."}
            </p>
          </div>
        </Card>
      </div>

      {/* Move Selection */}
      {gameState === "playing" && !playerMove && (
        <Card className="glassmorphism neon-border p-6">
          <h3 className="text-xl font-bold text-center mb-6">Choose Your Move</h3>
          <div className="grid grid-cols-3 gap-4">
            {moves.map((move) => (
              <Button
                key={move.id}
                onClick={() => makeMove(move.id as Move)}
                disabled={isLoading}
                className="h-24 text-4xl glassmorphism neon-border hover:animate-pulse-glow transition-all"
                variant="outline"
              >
                <div className="text-center">
                  <div className="text-4xl mb-2">{move.emoji}</div>
                  <div className="text-sm font-medium">{move.name}</div>
                </div>
              </Button>
            ))}
          </div>
          {isLoading && <p className="text-center text-muted-foreground mt-4">Processing transaction...</p>}
        </Card>
      )}

      {/* Play Again */}
      {gameState === "finished" && (
        <div className="text-center">
          <Button onClick={resetGame} disabled={isLoading} className="animate-pulse-glow" size="lg">
            <Trophy className="w-4 h-4 mr-2" />
            {isLoading ? "Resetting..." : "Play Again"}
          </Button>
        </div>
      )}
    </div>
  )
}
