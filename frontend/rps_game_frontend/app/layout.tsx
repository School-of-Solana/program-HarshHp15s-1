import type React from "react"
import type { Metadata } from "next"
import { GeistSans } from "geist/font/sans"
import { GeistMono } from "geist/font/mono"
import { WalletProvider } from "../components/wallet-provider"
import "./globals.css"

export const metadata: Metadata = {
  title: "TRINITY SHOWDOWN - Solana Rock Paper Scissors",
  description: "The ultimate cyberpunk Rock-Paper-Scissors DApp on Solana blockchain",
  generator: "v0.app",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`font-sans ${GeistSans.variable} ${GeistMono.variable} antialiased`}>
        <WalletProvider>{children}</WalletProvider>
      </body>
    </html>
  )
}
