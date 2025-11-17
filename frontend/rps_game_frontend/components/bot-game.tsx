"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { RotateCcw, Trophy, Zap, Target, Crown } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface BotGameProps {
  difficulty: "easy" | "medium" | "hard"
  onBack: () => void
}

export function BotGame({ difficulty, onBack }: BotGameProps) {
  const [playerMove, setPlayerMove] = useState<string | null>(null)
  const [opponentMove, setOpponentMove] = useState<string | null>(null)
  const [result, setResult] = useState<string | null>(null)
  const [score, setScore] = useState({ player: 0, opponent: 0 })
  const [isPlaying, setIsPlaying] = useState(false)
  const { toast } = useToast()

  const moves = [
    { name: "Rock", emoji: "🪨", value: "rock" },
    { name: "Paper", emoji: "📄", value: "paper" },
    { name: "Scissors", emoji: "✂️", value: "scissors" },
  ]

  const getOpponentMove = () => {
    const randomMoves = ["rock", "paper", "scissors"]

    if (difficulty === "easy") {
      return Math.random() < 0.4 ? getLosingMove() : randomMoves[Math.floor(Math.random() * 3)]
    } else if (difficulty === "medium") {
      return randomMoves[Math.floor(Math.random() * 3)]
    } else {
      return Math.random() < 0.6 ? getCounterMove() : randomMoves[Math.floor(Math.random() * 3)]
    }
  }

  const getLosingMove = () => {
    if (!playerMove) return "rock"
    const losing = { rock: "scissors", paper: "rock", scissors: "paper" }
    return losing[playerMove as keyof typeof losing]
  }

  const getCounterMove = () => {
    if (!playerMove) return "rock"
    const counter = { rock: "paper", paper: "scissors", scissors: "rock" }
    return counter[playerMove as keyof typeof counter]
  }

  const determineWinner = (player: string, opponent: string) => {
    if (player === opponent) return "tie"

    const winConditions = {
      rock: "scissors",
      paper: "rock",
      scissors: "paper",
    }

    return winConditions[player as keyof typeof winConditions] === opponent ? "player" : "opponent"
  }

  const makeMove = async (move: string) => {
    if (isPlaying) return

    setIsPlaying(true)
    setPlayerMove(move)
    setOpponentMove(null)
    setResult(null)

    await new Promise((resolve) => setTimeout(resolve, 1000))

    const opponentChoice = getOpponentMove()
    setOpponentMove(opponentChoice)

    await new Promise((resolve) => setTimeout(resolve, 500))

    const winner = determineWinner(move, opponentChoice)
    setResult(winner)

    if (winner === "player") {
      setScore((prev) => ({ ...prev, player: prev.player + 1 }))
      toast({
        title: "Victory! 🎉",
        description: `${move} beats ${opponentChoice}`,
      })
    } else if (winner === "opponent") {
      setScore((prev) => ({ ...prev, opponent: prev.opponent + 1 }))
      toast({
        title: "Defeated! ⚔️",
        description: `${opponentChoice} beats ${move}`,
        variant: "destructive",
      })
    } else {
      toast({
        title: "Draw! 🤝",
        description: `Both chose ${move}`,
      })
    }

    setIsPlaying(false)
  }

  const resetGame = () => {
    setPlayerMove(null)
    setOpponentMove(null)
    setResult(null)
    setScore({ player: 0, opponent: 0 })
  }

  const getDifficultyInfo = () => {
    switch (difficulty) {
      case "easy":
        return {
          color: "text-emerald-400",
          bg: "bg-emerald-500/20",
          icon: Target,
          label: "TRAINING",
        }
      case "medium":
        return {
          color: "text-amber-400",
          bg: "bg-amber-500/20",
          icon: Zap,
          label: "CHALLENGER",
        }
      case "hard":
        return {
          color: "text-red-400",
          bg: "bg-red-500/20",
          icon: Crown,
          label: "MASTER",
        }
      default:
        return {
          color: "text-primary",
          bg: "bg-primary/20",
          icon: Target,
          label: "UNKNOWN",
        }
    }
  }

  const difficultyInfo = getDifficultyInfo()
  const DifficultyIcon = difficultyInfo.icon

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Card className="glassmorphism neon-border p-6">
        <div className="text-center space-y-4">
          <div className="flex items-center justify-between">
            <Button variant="outline" onClick={onBack} className="glassmorphism bg-transparent">
              ← Back
            </Button>
            <Badge className={`glassmorphism ${difficultyInfo.color} ${difficultyInfo.bg} px-4 py-2 text-sm font-bold`}>
              <DifficultyIcon className="w-4 h-4 mr-2" />
              {difficultyInfo.label}
            </Badge>
            <Button variant="outline" onClick={resetGame} className="glassmorphism bg-transparent">
              <RotateCcw className="w-4 h-4" />
            </Button>
          </div>

          <h2 className="text-3xl font-bold neon-text">Combat Arena</h2>

          <div className="flex justify-center gap-8">
            <div className="text-center">
              <div className="text-2xl font-bold text-emerald-400">{score.player}</div>
              <div className="text-sm text-muted-foreground">You</div>
            </div>
            <div className="text-center">
              <Trophy className="w-8 h-8 mx-auto text-accent animate-pulse-glow" />
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-400">{score.opponent}</div>
              <div className="text-sm text-muted-foreground">Opponent</div>
            </div>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-2 gap-6">
        <Card className="glassmorphism neon-border p-6">
          <div className="text-center space-y-4">
            <h3 className="text-xl font-bold text-emerald-400">Your Move</h3>
            <div className="text-6xl">{playerMove ? moves.find((m) => m.value === playerMove)?.emoji : "❓"}</div>
            <div className="text-lg font-medium">
              {playerMove ? moves.find((m) => m.value === playerMove)?.name : "Choose your weapon"}
            </div>
          </div>
        </Card>

        <Card className="glassmorphism neon-border p-6">
          <div className="text-center space-y-4">
            <h3 className="text-xl font-bold text-red-400">Opponent Move</h3>
            <div className="text-6xl">
              {opponentMove ? moves.find((m) => m.value === opponentMove)?.emoji : isPlaying ? "🤔" : "❓"}
            </div>
            <div className="text-lg font-medium">
              {opponentMove
                ? moves.find((m) => m.value === opponentMove)?.name
                : isPlaying
                  ? "Calculating..."
                  : "Waiting"}
            </div>
          </div>
        </Card>
      </div>

      {result && (
        <Card className="glassmorphism neon-border p-6">
          <div className="text-center space-y-2">
            <div className="text-2xl font-bold">
              {result === "player" && <span className="text-emerald-400">🎉 Victory!</span>}
              {result === "opponent" && <span className="text-red-400">⚔️ Defeated!</span>}
              {result === "tie" && <span className="text-amber-400">🤝 Draw!</span>}
            </div>
          </div>
        </Card>
      )}

      <div className="grid grid-cols-3 gap-4">
        {moves.map((move) => (
          <Button
            key={move.value}
            onClick={() => makeMove(move.value)}
            disabled={isPlaying}
            className="glassmorphism neon-border h-20 text-lg hover:animate-pulse-glow transition-all hover:scale-105"
            variant="outline"
          >
            <div className="text-center">
              <div className="text-2xl mb-1">{move.emoji}</div>
              <div className="font-semibold">{move.name}</div>
            </div>
          </Button>
        ))}
      </div>
    </div>
  )
}
