use anchor_lang::prelude::*;
use anchor_lang::system_program;

declare_id!("pPYPJwpeo16rTvhJNdX4wGs2DzX7fUPpFQKo9AzMt3E");

#[program]
pub mod rps_game {
    use super::*;

    pub fn create_game(ctx: Context<CreateGame>, bet_amount: u64) -> Result<()> {
        let game = &mut ctx.accounts.game;
        let player = &ctx.accounts.player;
        let clock = Clock::get()?;

        game.player1 = player.key();
        game.player2 = Pubkey::default(); // Will be set when player 2 joins
        game.bet_amount = bet_amount;
        game.game_state = GameState::WaitingForPlayer;
        game.player1_move = Move::None;
        game.player2_move = Move::None;
        game.winner = Pubkey::default();
        game.created_at = clock.unix_timestamp;
        game.bump = ctx.bumps.game;

        msg!("Game created by {:?} with bet amount: {}", player.key(), bet_amount);
        Ok(())
    }

    pub fn join_game(ctx: Context<JoinGame>) -> Result<()> {
        let game = &mut ctx.accounts.game;
        let player = &ctx.accounts.player;

        require!(game.game_state == GameState::WaitingForPlayer, GameError::InvalidGameState);
        require!(game.player1 != player.key(), GameError::CannotPlayAgainstSelf);

        game.player2 = player.key();
        game.game_state = GameState::InProgress;

        msg!("Player {:?} joined the game", player.key());
        Ok(())
    }

    pub fn make_move(ctx: Context<MakeMove>, player_move: Move) -> Result<()> {
        let game = &mut ctx.accounts.game;
        let player = &ctx.accounts.player;

        require!(game.game_state == GameState::InProgress, GameError::InvalidGameState);
        require!(player_move != Move::None, GameError::InvalidMove);

        if game.player1 == player.key() {
            require!(game.player1_move == Move::None, GameError::MoveAlreadyMade);
            game.player1_move = player_move;
            msg!("Player 1 made their move");
        } else if game.player2 == player.key() {
            require!(game.player2_move == Move::None, GameError::MoveAlreadyMade);
            game.player2_move = player_move;
            msg!("Player 2 made their move");
        } else {
            return Err(GameError::UnauthorizedPlayer.into());
        }

        // Check if both players have made their moves
        if game.player1_move != Move::None && game.player2_move != Move::None {
            resolve_game_logic(game)?;
        }

        Ok(())
    }

    pub fn reset_game(ctx: Context<ResetGame>) -> Result<()> {
        let game = &mut ctx.accounts.game;
        let player = &ctx.accounts.player;

        require!(
            game.player1 == player.key() || game.player2 == player.key(),
            GameError::UnauthorizedPlayer
        );
        require!(
            game.game_state == GameState::Finished,
            GameError::InvalidGameState
        );

        game.player1_move = Move::None;
        game.player2_move = Move::None;
        game.winner = Pubkey::default();
        game.game_state = GameState::InProgress;

        msg!("Game reset for another round");
        Ok(())
    }
}

// Helper function to resolve game logic
fn resolve_game_logic(game: &mut Account<Game>) -> Result<()> {
    let winner = determine_winner(game.player1_move, game.player2_move);
    
    match winner {
        GameResult::Player1Wins => {
            game.winner = game.player1;
            msg!("Player 1 wins! {} beats {}", 
                move_to_string(game.player1_move), 
                move_to_string(game.player2_move));
        },
        GameResult::Player2Wins => {
            game.winner = game.player2;
            msg!("Player 2 wins! {} beats {}", 
                move_to_string(game.player2_move), 
                move_to_string(game.player1_move));
        },
        GameResult::Draw => {
            game.winner = Pubkey::default();
            msg!("It's a draw! Both players chose {}", move_to_string(game.player1_move));
        }
    }
    
    game.game_state = GameState::Finished;
    Ok(())
}

fn determine_winner(move1: Move, move2: Move) -> GameResult {
    match (move1, move2) {
        (Move::Rock, Move::Scissors) | (Move::Paper, Move::Rock) | (Move::Scissors, Move::Paper) => GameResult::Player1Wins,
        (Move::Scissors, Move::Rock) | (Move::Rock, Move::Paper) | (Move::Paper, Move::Scissors) => GameResult::Player2Wins,
        _ => GameResult::Draw,
    }
}

fn move_to_string(player_move: Move) -> &'static str {
    match player_move {
        Move::Rock => "Rock",
        Move::Paper => "Paper", 
        Move::Scissors => "Scissors",
        Move::None => "None",
    }
}

// Account Structures
#[account]
pub struct Game {
    pub player1: Pubkey,        // 32 bytes
    pub player2: Pubkey,        // 32 bytes
    pub bet_amount: u64,        // 8 bytes
    pub game_state: GameState,  // 1 byte
    pub player1_move: Move,     // 1 byte
    pub player2_move: Move,     // 1 byte
    pub winner: Pubkey,         // 32 bytes
    pub created_at: i64,        // 8 bytes
    pub bump: u8,               // 1 byte
}

impl Game {
    pub const SIZE: usize = 8 + 32 + 32 + 8 + 1 + 1 + 1 + 32 + 8 + 1; // 124 bytes total
}

// Context Structs
#[derive(Accounts)]
#[instruction(bet_amount: u64)]
pub struct CreateGame<'info> {
    #[account(
        init,
        payer = player,
        space = Game::SIZE,
        seeds = [b"game", player.key().as_ref()],
        bump
    )]
    pub game: Account<'info, Game>,
    
    #[account(mut)]
    pub player: Signer<'info>,
    
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct JoinGame<'info> {
    #[account(
        mut,
        seeds = [b"game", game.player1.as_ref()],
        bump = game.bump
    )]
    pub game: Account<'info, Game>,
    
    pub player: Signer<'info>,
}

#[derive(Accounts)]
pub struct MakeMove<'info> {
    #[account(
        mut,
        seeds = [b"game", game.player1.as_ref()],
        bump = game.bump
    )]
    pub game: Account<'info, Game>,
    
    pub player: Signer<'info>,
}

#[derive(Accounts)]
pub struct ResetGame<'info> {
    #[account(
        mut,
        seeds = [b"game", game.player1.as_ref()],
        bump = game.bump
    )]
    pub game: Account<'info, Game>,
    
    pub player: Signer<'info>,
}

// Enums
#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Eq)]
pub enum GameState {
    WaitingForPlayer,
    InProgress,
    Finished,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq)]
pub enum Move {
    None,
    Rock,
    Paper,
    Scissors,
}

enum GameResult {
    Player1Wins,
    Player2Wins,
    Draw,
}

// Custom Errors
#[error_code]
pub enum GameError {
    #[msg("Invalid game state for this operation")]
    InvalidGameState,
    
    #[msg("Cannot play against yourself")]
    CannotPlayAgainstSelf,
    
    #[msg("Invalid move")]
    InvalidMove,
    
    #[msg("Move already made by this player")]
    MoveAlreadyMade,
    
    #[msg("Unauthorized player")]
    UnauthorizedPlayer,
}
