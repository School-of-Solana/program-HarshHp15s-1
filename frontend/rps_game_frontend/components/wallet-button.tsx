"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useWallet } from "@solana/wallet-adapter-react"
import { WalletReadyState } from "@solana/wallet-adapter-base"
import { Copy, RefreshCw, LogOut, Wallet } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export function WalletButton() {
  const { wallet, publicKey, connected, connecting, disconnect, select, wallets } = useWallet()
  const [isOpen, setIsOpen] = useState(false)
  const { toast } = useToast()

  const copyAddress = async () => {
    if (publicKey) {
      await navigator.clipboard.writeText(publicKey.toString())
      toast({
        title: "Address Copied! 📋",
        description: "Wallet address copied to clipboard",
      })
    }
  }

  const changeWallet = () => {
    // Find available wallets
    const availableWallets = wallets.filter((w) => w.readyState === WalletReadyState.Installed)
    if (availableWallets.length > 1) {
      // Select the next available wallet
      const currentIndex = availableWallets.findIndex((w) => w.adapter.name === wallet?.adapter.name)
      const nextWallet = availableWallets[(currentIndex + 1) % availableWallets.length]
      select(nextWallet.adapter.name)
      toast({
        title: "Wallet Changed! 🔄",
        description: `Switched to ${nextWallet.adapter.name}`,
      })
    } else {
      toast({
        title: "No Other Wallets",
        description: "Please install another Solana wallet to switch",
        variant: "destructive",
      })
    }
  }

  const disconnectWallet = () => {
    disconnect()
    toast({
      title: "Wallet Disconnected! 👋",
      description: "Successfully disconnected from wallet",
    })
  }

  if (!connected) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button className="!bg-transparent glassmorphism neon-border !text-foreground hover:!bg-primary/10">
            <Wallet className="w-4 h-4 mr-2" />
            {connecting ? "Connecting..." : "Connect Wallet"}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="glassmorphism neon-border">
          {wallets
            .filter((w) => w.readyState === WalletReadyState.Installed)
            .map((wallet) => (
              <DropdownMenuItem
                key={wallet.adapter.name}
                onClick={() => select(wallet.adapter.name)}
                className="cursor-pointer"
              >
                <img
                  src={wallet.adapter.icon || "/placeholder.svg"}
                  alt={wallet.adapter.name}
                  className="w-4 h-4 mr-2"
                />
                {wallet.adapter.name}
              </DropdownMenuItem>
            ))}
        </DropdownMenuContent>
      </DropdownMenu>
    )
  }

  const truncatedAddress = publicKey ? `${publicKey.toString().slice(0, 4)}...${publicKey.toString().slice(-4)}` : ""

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button className="!bg-primary glassmorphism neon-border !text-primary-foreground hover:!bg-primary/90">
          <img src={wallet?.adapter.icon || "/placeholder.svg"} alt={wallet?.adapter.name} className="w-4 h-4 mr-2" />
          {truncatedAddress}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="glassmorphism neon-border" align="end">
        <DropdownMenuItem onClick={copyAddress} className="cursor-pointer">
          <Copy className="w-4 h-4 mr-2" />
          Copy address
        </DropdownMenuItem>
        <DropdownMenuItem onClick={changeWallet} className="cursor-pointer">
          <RefreshCw className="w-4 h-4 mr-2" />
          Change wallet
        </DropdownMenuItem>
        <DropdownMenuItem onClick={disconnectWallet} className="cursor-pointer">
          <LogOut className="w-4 h-4 mr-2" />
          Disconnect
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
