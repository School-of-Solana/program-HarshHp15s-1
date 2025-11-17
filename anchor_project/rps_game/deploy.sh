#!/bin/bash

echo "🚀 Building and deploying Rock Paper Scissors game to Solana Devnet..."

# Build the program
echo "Building the program..."
anchor build

# Get the program ID
PROGRAM_ID=$(solana address -k ./target/deploy/rps_game-keypair.json)
echo "Program ID: $PROGRAM_ID"

# Update the program ID in lib.rs and Anchor.toml
echo "Updating program ID in code..."
sed -i "s/Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS/$PROGRAM_ID/g" programs/rps_game/src/lib.rs
sed -i "s/Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS/$PROGRAM_ID/g" Anchor.toml

# Rebuild with new program ID
echo "Rebuilding with new program ID..."
anchor build

# Deploy to devnet
echo "Deploying to devnet..."
anchor deploy --provider.cluster devnet

echo "✅ Deployment complete!"
echo "Program ID: $PROGRAM_ID"
echo "Network: Devnet"
echo ""
echo "You can now use this program ID in your frontend!"

# Run tests
echo "Running tests..."
anchor test --provider.cluster devnet

echo "🎉 All done! Your Rock Paper Scissors game is deployed and tested!"