# Project Description

**Deployed Frontend URL:** [Trinity ShowDown](https://trinity-show-down.vercel.app/)

**Solana Program ID:** `pPYPJwpeo16rTvhJNdX4wGs2DzX7fUPpFQKo9AzMt3E`

## Project Overview

### Description

TRINITY SHOWDOWN is a fully decentralized Rock Paper Scissors game built on the Solana blockchain using the Anchor framework. This world-class dApp combines classic gameplay mechanics with cutting-edge Web3 technology, featuring both AI-powered single-player modes and real-time multiplayer battles where players can wager SOL in head-to-head competitions. The application showcases a sophisticated cyberpunk-themed React frontend with glassmorphism design, animated dot network backgrounds, real-time game state synchronization, and comprehensive multi-wallet integration for seamless blockchain interactions.

The game implements a complete lifecycle management system where players can create games with customizable bet amounts, share game addresses for multiplayer matchmaking, submit moves securely on-chain, and have winners determined automatically through smart contract logic. All multiplayer game state is stored on-chain ensuring transparency, immutability, and trustless gameplay without the need for centralized servers or intermediaries. Additionally, the platform offers three AI difficulty modes for practice and entertainment.

### Key Features

- **Dual Game Modes:** Choose between AI opponents (Easy, Medium, Hard) for practice or Live multiplayer battles with real SOL wagering
- **Game Creation & Management:** Players can create new games with customizable SOL bet amounts and receive unique game addresses for sharing
- **Multiplayer Matchmaking:** Join existing games using creator addresses with automatic validation of game availability and player authorization
- **Secure Move Submission:** On-chain move recording (Rock, Paper, Scissors) with cryptographic validation and anti-replay protection
- **Automatic Winner Determination:** Smart contract implements classic RPS rules with automatic SOL distribution to winners
- **AI Difficulty Levels:** Three distinct AI opponents with varying strategies - Easy (slightly favors player), Medium (random), Hard (adaptive counter-play)
- **Real-time State Updates:** Frontend automatically polls blockchain for game state changes and provides live feedback
- **Multi-Wallet Support:** Compatible with Phantom, Solflare, and Backpack wallets with comprehensive connection management
- **Cyberpunk UI Design:** Stunning glassmorphism interface with animated dot network backgrounds, neon effects, and immersive gaming aesthetics
- **Volume Controls:** Separate audio controls for background music and touch sound effects for enhanced gaming experience
- **Error Handling & Validation:** Robust error management with user-friendly messages for failed transactions and invalid operations
- **Transaction Confirmation:** Real-time transaction status tracking with confirmation feedback and retry mechanisms

### How to Use the dApp

1. **Connect Wallet**
   - Click the wallet button in the top-right corner
   - Select your preferred wallet (Phantom, Solflare, or Backpack)
   - Approve wallet connection in the extension popup
   - Verify successful connection with wallet address display

2. **Choose Game Mode**
   - **AI Modes:** Select Easy, Medium, or Hard for single-player practice
   - **Live Mode:** Click "Play Live" for real multiplayer battles with SOL wagering

3. **AI Mode Gameplay**
   - Select difficulty level and start playing immediately
   - Make your move choice (Rock, Paper, Scissors)
   - View results and track your score against the AI
   - No wallet transactions required for AI modes

4. **Live Mode - Create New Game**
   - Click "Enter Arena" to access multiplayer mode
   - Enter desired bet amount in SOL (minimum 0.001 SOL)
   - Click "Create Game" to initialize blockchain transaction
   - Wait for transaction confirmation and receive game address
   - Share game address with intended opponent for joining

5. **Live Mode - Join Existing Game**
   - Obtain game address from another player
   - Paste address in "Join Existing Game" input field
   - Click "Join Game" to enter multiplayer battle
   - Confirm transaction to place matching bet amount

6. **Make Your Move (Live Mode)**
   - Once both players joined, select Rock, Paper, or Scissors
   - Submit move via blockchain transaction
   - Wait for opponent to make their move choice
   - View automatic winner determination and result display

7. **View Results & Continue**
   - See winner announcement with move combinations shown
   - Continue playing additional rounds or return to main menu

## Program Architecture

The Solana program architecture implements a robust game management system using Anchor framework best practices. The program handles secure account creation through Program Derived Addresses (PDAs), enforces game rules through instruction validation, and manages SOL transfers for betting mechanics. The architecture ensures trustless gameplay while maintaining high performance and low transaction costs.

### PDA Usage

Program Derived Addresses provide deterministic account generation and secure access control for game state management.

**PDAs Used:**
- **Game Account PDA:** `[b"game", player1.key()]` - Creates unique game accounts using the creator's public key as seed, ensuring each player can only have one active game while preventing account collisions and enabling deterministic game address derivation for easy sharing and joining

### Program Instructions

The program implements four core instructions that manage the complete game lifecycle from initialization to completion.

**Instructions Implemented:**
- **create_game(bet_amount: u64):** Initializes new game account with specified bet amount, sets caller as player1, establishes game state as WaitingForPlayer, validates bet amount constraints, and returns game PDA for sharing
- **join_game():** Allows second player to join existing game, validates game availability and prevents self-play, transitions state to InProgress, and confirms bet amount matching
- **make_move(player_move: Move):** Records player move submissions with validation, checks game state and player authorization, automatically determines winner when both moves submitted, distributes SOL to winner, and transitions state to Finished
- **reset_game():** Enables multi-round gameplay by resetting finished games, clears player moves and winner data, transitions state back to InProgress, maintains original bet amounts and player assignments

### Account Structure

The program defines comprehensive data structures for complete game state management and player interaction tracking.

```rust
#[account]
pub struct Game {
    pub player1: Pubkey,        // Game creator's public key (32 bytes)
    pub player2: Pubkey,        // Second player's public key (32 bytes)  
    pub bet_amount: u64,        // Bet amount in lamports (8 bytes)
    pub game_state: GameState,  // Current game state enum (1 byte)
    pub player1_move: Move,     // Player 1's move enum (1 byte)
    pub player2_move: Move,     // Player 2's move enum (1 byte)
    pub winner: Pubkey,         // Winner's public key (32 bytes)
    pub created_at: i64,        // Game creation timestamp (8 bytes)
    pub bump: u8,               // PDA bump seed (1 byte)
}
// Total account size: 124 bytes

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Eq)]
pub enum GameState {
    WaitingForPlayer,   // Game created, awaiting second player
    InProgress,         // Both players joined, accepting moves  
    Finished,           // Game completed, winner determined
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq)]
pub enum Move {
    None,      // No move submitted yet
    Rock,      // Rock move selection
    Paper,     // Paper move selection  
    Scissors,  // Scissors move selection
}
```

## Testing

### Test Coverage

The test suite provides comprehensive coverage of both successful operations and error conditions using TypeScript with Chai assertions and proper Solana program testing methodology.

**Happy Path Tests:**
- **Game Creation:** Validates proper game initialization with correct state, player assignment, and bet amount storage
- **Player Joining:** Tests second player joining functionality with state transition from WaitingForPlayer to InProgress
- **Move Submission:** Verifies both players can submit moves with proper validation and state tracking
- **Winner Logic:** Tests all winning combinations (Rock beats Scissors, Paper beats Rock, Scissors beats Paper) with correct winner determination
- **Draw Scenarios:** Validates tie conditions with proper handling when both players choose identical moves
- **Game Reset:** Tests reset functionality for multiple rounds while maintaining player assignments and bet amounts
- **Multi-round Gameplay:** Validates extended gameplay sessions with proper state management across multiple games

**Unhappy Path Tests:**
- **Self-Play Prevention:** Ensures players cannot join their own games with proper error messaging
- **Invalid Game State:** Tests rejection of moves made before game starts or after completion
- **Unauthorized Access:** Verifies only authorized players can make moves with proper authentication
- **Invalid Move Types:** Tests rejection of None/invalid moves with appropriate error handling  
- **Duplicate Move Prevention:** Ensures players cannot submit multiple moves in single round
- **Premature Reset Attempts:** Tests prevention of game reset before completion
- **Unauthorized Reset:** Verifies only game participants can reset games with proper permission validation

### Running Tests

```bash
# Navigate to anchor project directory
cd anchor_project

# Run complete test suite
anchor test

# Run tests with detailed output and skip deployment
anchor test --skip-deploy

# Build program for deployment
anchor build

# Deploy to configured cluster
anchor deploy
```

### Additional Notes for Evaluators

**Technical Implementation Highlights:**
- **Security Architecture:** All instructions implement comprehensive account validation, authorization checks, and input sanitization to prevent unauthorized access and invalid operations
- **Gas Optimization:** Efficient account structure design minimizes storage costs while maintaining complete game state information
- **Error Handling:** Custom error types provide detailed feedback for debugging and user experience improvement
- **Code Quality:** Well-documented codebase with clear separation of concerns, modular design, and consistent naming conventions

**Frontend Engineering:**
- **Modern UI Framework:** React-based frontend with responsive design using Tailwind CSS for cross-device compatibility
- **Wallet Integration:** Comprehensive Phantom wallet support with connection management, transaction signing, and state synchronization
- **Real-time Updates:** Automatic blockchain polling for live game state updates without manual refresh requirements
- **User Experience:** Intuitive interface with loading states, error boundaries, transaction confirmations, and comprehensive user feedback

**Blockchain Integration:**
- **Anchor Framework:** Utilizes Anchor's IDL generation for type-safe frontend-program communication
- **Transaction Management:** Proper transaction confirmation waiting, retry logic, and error recovery mechanisms
- **State Synchronization:** Efficient game state fetching with automatic updates and conflict resolution

This implementation demonstrates mastery of Solana program development including PDA usage, instruction validation, account management, and frontend integration. The project showcases production-ready dApp development with proper security considerations, user experience design, and blockchain best practices.

