#!/bin/bash

# Build script for OrbyTech smart contracts

set -e

echo "Building OrbyTech smart contracts..."

# Check if Rust and Soroban CLI are installed
if ! command -v cargo &> /dev/null; then
    echo "Error: Rust/Cargo is not installed"
    echo "Install Rust from https://rustup.rs/"
    exit 1
fi

if ! command -v soroban &> /dev/null; then
    echo "Error: Soroban CLI is not installed"
    echo "Install Soroban CLI with: cargo install soroban-cli"
    exit 1
fi

# Check if wasm32-unknown-unknown target is installed
if ! rustup target list --installed | grep -q wasm32-unknown-unknown; then
    echo "Installing wasm32-unknown-unknown target..."
    rustup target add wasm32-unknown-unknown
fi

# Change to contracts directory
cd contracts

echo "Building contracts in release mode..."

# Build all contracts
cargo build --target wasm32-unknown-unknown --release

# Check if build was successful
if [ $? -eq 0 ]; then
    echo "Build completed successfully!"
    
    # List built contracts
    echo "Built contracts:"
    ls -la target/wasm32-unknown-unknown/release/*.wasm
    
    # Get file sizes
    echo "Contract sizes:"
    for wasm in target/wasm32-unknown-unknown/release/*.wasm; do
        size=$(stat -f%z "$wasm" 2>/dev/null || stat -c%s "$wasm" 2>/dev/null)
        echo "$(basename "$wasm"): $size bytes"
    done
    
    # Check if contracts are within size limits (Soroban limit is ~5MB)
    MAX_SIZE=$((5 * 1024 * 1024))  # 5MB in bytes
    
    for wasm in target/wasm32-unknown-unknown/release/*.wasm; do
        size=$(stat -f%z "$wasm" 2>/dev/null || stat -c%s "$wasm" 2>/dev/null)
        if [ $size -gt $MAX_SIZE ]; then
            echo "Warning: $(basename "$wasm") exceeds size limit ($size bytes > $MAX_SIZE bytes)"
        fi
    done
    
else
    echo "Build failed!"
    exit 1
fi

echo "Build script completed!"
