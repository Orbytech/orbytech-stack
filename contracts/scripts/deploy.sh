#!/bin/bash

# Deployment script for OrbyTech smart contracts
# Usage: ./scripts/deploy.sh [testnet|mainnet|futurenet|standalone]

set -e

# Default network
NETWORK=${1:-testnet}

# Validate network
case $NETWORK in
    testnet|mainnet|futurenet|standalone)
        ;;
    *)
        echo "Error: Invalid network. Use testnet, mainnet, futurenet, or standalone"
        exit 1
        ;;
esac

echo "Deploying to $NETWORK..."

# Set network-specific configurations
case $NETWORK in
    testnet)
        SOROBAN_RPC_URL="https://soroban-testnet.stellar.org"
        STELLAR_NETWORK_PASSPHRASE="Test SDF Network ; September 2015"
        ;;
    mainnet)
        SOROBAN_RPC_URL="https://soroban.stellar.org"
        STELLAR_NETWORK_PASSPHRASE="Public Global Stellar Network ; September 2015"
        ;;
    futurenet)
        SOROBAN_RPC_URL="https://soroban-futurenet.stellar.org"
        STELLAR_NETWORK_PASSPHRASE="Test SDF Future Network ; October 2022"
        ;;
    standalone)
        SOROBAN_RPC_URL="http://localhost:8000/soroban/rpc"
        STELLAR_NETWORK_PASSPHRASE="Standalone Network ; February 2017"
        ;;
esac

# Check if secret key is provided
if [ -z "$SECRET_KEY" ]; then
    echo "Error: SECRET_KEY environment variable is required"
    echo "Set it with: export SECRET_KEY=your_secret_key"
    exit 1
fi

# Build contracts
echo "Building contracts..."
cd contracts
cargo build --target wasm32-unknown-unknown --release

# Deploy payment contract
echo "Deploying payment contract..."
PAYMENT_CONTRACT_ID=$(soroban contract deploy \
    --wasm target/wasm32-unknown-unknown/release/orbytech_payments.wasm \
    --source $SECRET_KEY \
    --network $NETWORK \
    --rpc-url $SOROBAN_RPC_URL)

echo "Payment contract deployed: $PAYMENT_CONTRACT_ID"

# Initialize payment contract
echo "Initializing payment contract..."
ADMIN_ADDRESS=$(soroban keys address $SECRET_KEY)
FEE_RECIPIENT=$ADMIN_ADDRESS
FEE_RATE=100  # 1%
MINIMUM_DEPOSIT=1000000  # 0.1 XLM

soroban contract invoke \
    --id $PAYMENT_CONTRACT_ID \
    --source $SECRET_KEY \
    --network $NETWORK \
    --rpc-url $SOROBAN_RPC_URL \
    initialize \
    --admin $ADMIN_ADDRESS \
    --fee-recipient $FEE_RECIPIENT \
    --fee-rate $FEE_RATE \
    --minimum-deposit $MINIMUM_DEPOSIT

# Deploy streaming contract
echo "Deploying streaming contract..."
STREAMING_CONTRACT_ID=$(soroban contract deploy \
    --wasm target/wasm32-unknown-unknown/release/orbytech_streaming.wasm \
    --source $SECRET_KEY \
    --network $NETWORK \
    --rpc-url $SOROBAN_RPC_URL)

echo "Streaming contract deployed: $STREAMING_CONTRACT_ID"

# Save contract addresses to environment file
echo "Saving contract addresses..."
cat > .env.contracts << EOF
# Contract addresses for $NETWORK
PAYMENT_CONTRACT_ID=$PAYMENT_CONTRACT_ID
STREAMING_CONTRACT_ID=$STREAMING_CONTRACT_ID
NETWORK=$NETWORK
SOROBAN_RPC_URL=$SOROBAN_RPC_URL
STELLAR_NETWORK_PASSPHRASE="$STELLAR_NETWORK_PASSPHRASE"
EOF

echo "Deployment completed!"
echo "Payment contract: $PAYMENT_CONTRACT_ID"
echo "Streaming contract: $STREAMING_CONTRACT_ID"
echo "Contract addresses saved to .env.contracts"

# Verify deployment
echo "Verifying deployment..."
soroban contract read \
    --id $PAYMENT_CONTRACT_ID \
    --network $NETWORK \
    --rpc-url $SOROBAN_RPC_URL \
    get_config

echo "Deployment verification completed!"
