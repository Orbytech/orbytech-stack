#!/bin/bash

# Test script for OrbyTech smart contracts

set -e

echo "Testing OrbyTech smart contracts..."

# Check if Rust is installed
if ! command -v cargo &> /dev/null; then
    echo "Error: Rust/Cargo is not installed"
    echo "Install Rust from https://rustup.rs/"
    exit 1
fi

# Change to contracts directory
cd contracts

echo "Running unit tests..."

# Run tests with output
cargo test -- --nocapture

echo "Running contract tests with Soroban testutils..."

# Run contract-specific tests
cargo test --features testutils -- --nocapture

echo "Checking contract code quality..."

# Run clippy for code quality
if command -v cargo-clippy &> /dev/null; then
    echo "Running clippy..."
    cargo clippy -- -D warnings
else
    echo "Clippy not installed, skipping code quality check"
fi

echo "Running format check..."

# Check if code is properly formatted
cargo fmt -- --check

echo "Test script completed!"
