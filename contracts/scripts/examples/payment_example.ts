/**
 * Example usage of the Payment Contract
 * This demonstrates how to interact with the deployed payment contract
 */

import { 
  Address, 
  Contract, 
  SorobanRpc, 
  xdr, 
  TransactionBuilder,
  Networks,
  BASE_FEE,
  nativeToScVal,
  scValToNative
} from 'soroban-client';

// Configuration
const RPC_URL = 'https://soroban-testnet.stellar.org';
const CONTRACT_ID = 'YOUR_PAYMENT_CONTRACT_ID_HERE';
const SECRET_KEY = 'YOUR_SECRET_KEY_HERE';

// Initialize RPC client
const rpc = new SorobanRpc(RPC_URL);
const contract = new Contract(CONTRACT_ID);

// Get account from secret key
const keypair = StellarSdk.Keypair.fromSecret(SECRET_KEY);
const account = await rpc.getAccount(keypair.publicKey());

// Example 1: Initialize the contract
async function initializeContract() {
  console.log('Initializing payment contract...');
  
  const adminAddress = new Address(keypair.publicKey());
  const feeRecipient = new Address(keypair.publicKey()); // Same as admin for this example
  const feeRate = 100; // 1% (100 basis points)
  const minimumDeposit = BigInt(1000000); // 0.1 XLM (7 decimals)

  const tx = new TransactionBuilder(account, {
    fee: BASE_FEE,
    networkPassphrase: Networks.TESTNET,
  })
    .addOperation(
      contract.call(
        'initialize',
        ...[
          adminAddress.toScVal(),
          feeRecipient.toScVal(),
          nativeToScVal(feeRate),
          nativeToScVal(minimumDeposit),
        ]
      )
    )
    .setTimeout(30)
    .build();

  tx.sign(keypair);
  
  const result = await rpc.sendTransaction(tx);
  console.log('Initialization transaction hash:', result.hash);
  
  // Wait for transaction confirmation
  const txResult = await rpc.getTransaction(result.hash);
  console.log('Contract initialized successfully!');
}

// Example 2: Deposit tokens
async function depositTokens(amount: string, tokenAddress: string) {
  console.log(`Depositing ${amount} tokens...`);
  
  const fromAddress = new Address(keypair.publicKey());
  const tokenAddr = new Address(tokenAddress);
  const depositAmount = BigInt(amount);

  const account = await rpc.getAccount(keypair.publicKey());

  const tx = new TransactionBuilder(account, {
    fee: BASE_FEE,
    networkPassphrase: Networks.TESTNET,
  })
    .addOperation(
      contract.call(
        'deposit',
        ...[
          fromAddress.toScVal(),
          tokenAddr.toScVal(),
          nativeToScVal(depositAmount),
        ]
      )
    )
    .setTimeout(30)
    .build();

  tx.sign(keypair);
  
  const result = await rpc.sendTransaction(tx);
  console.log('Deposit transaction hash:', result.hash);
  
  const txResult = await rpc.getTransaction(result.hash);
  const paymentId = scValToNative(txResult.returnValue);
  console.log(`Deposit completed! Payment ID: ${paymentId}`);
}

// Example 3: Transfer tokens
async function transferTokens(
  toAddress: string, 
  amount: string, 
  tokenAddress: string,
  memo?: string
) {
  console.log(`Transferring ${amount} tokens to ${toAddress}...`);
  
  const fromAddress = new Address(keypair.publicKey());
  const toAddr = new Address(toAddress);
  const tokenAddr = new Address(tokenAddress);
  const transferAmount = BigInt(amount);

  const account = await rpc.getAccount(keypair.publicKey());

  const params = [
    fromAddress.toScVal(),
    toAddr.toScVal(),
    tokenAddr.toScVal(),
    nativeToScVal(transferAmount),
  ];

  if (memo) {
    params.push(nativeToScVal(memo));
  } else {
    params.push(xdr.ScVal.scvVoid());
  }

  const tx = new TransactionBuilder(account, {
    fee: BASE_FEE,
    networkPassphrase: Networks.TESTNET,
  })
    .addOperation(
      contract.call('transfer', ...params)
    )
    .setTimeout(30)
    .build();

  tx.sign(keypair);
  
  const result = await rpc.sendTransaction(tx);
  console.log('Transfer transaction hash:', result.hash);
  
  const txResult = await rpc.getTransaction(result.hash);
  const paymentId = scValToNative(txResult.returnValue);
  console.log(`Transfer completed! Payment ID: ${paymentId}`);
}

// Example 4: Withdraw tokens
async function withdrawTokens(amount: string, tokenAddress: string) {
  console.log(`Withdrawing ${amount} tokens...`);
  
  const toAddress = new Address(keypair.publicKey());
  const tokenAddr = new Address(tokenAddress);
  const withdrawAmount = BigInt(amount);

  const account = await rpc.getAccount(keypair.publicKey());

  const tx = new TransactionBuilder(account, {
    fee: BASE_FEE,
    networkPassphrase: Networks.TESTNET,
  })
    .addOperation(
      contract.call(
        'withdraw',
        ...[
          toAddress.toScVal(),
          tokenAddr.toScVal(),
          nativeToScVal(withdrawAmount),
        ]
      )
    )
    .setTimeout(30)
    .build();

  tx.sign(keypair);
  
  const result = await rpc.sendTransaction(tx);
  console.log('Withdrawal transaction hash:', result.hash);
  
  const txResult = await rpc.getTransaction(result.hash);
  const paymentId = scValToNative(txResult.returnValue);
  console.log(`Withdrawal completed! Payment ID: ${paymentId}`);
}

// Example 5: Check balance
async function checkBalance(tokenAddress: string) {
  console.log('Checking balance...');
  
  const address = new Address(keypair.publicKey());
  const tokenAddr = new Address(tokenAddress);

  const result = await rpc.simulateTransaction(
    new TransactionBuilder(account, {
      fee: BASE_FEE,
      networkPassphrase: Networks.TESTNET,
    })
      .addOperation(
        contract.call(
          'get_balance',
          address.toScVal(),
          tokenAddr.toScVal()
        )
      )
      .build()
  );

  const balance = scValToNative(result.result);
  console.log(`Current balance: ${balance} tokens`);
}

// Example 6: Get payment details
async function getPaymentDetails(paymentId: number) {
  console.log(`Getting payment details for ID: ${paymentId}...`);
  
  const result = await rpc.simulateTransaction(
    new TransactionBuilder(account, {
      fee: BASE_FEE,
      networkPassphrase: Networks.TESTNET,
    })
      .addOperation(
        contract.call(
          'get_payment',
          nativeToScVal(paymentId)
        )
      )
      .build()
  );

  const payment = scValToNative(result.result);
  console.log('Payment details:', payment);
}

// Example 7: Get contract configuration
async function getContractConfig() {
  console.log('Getting contract configuration...');
  
  const result = await rpc.simulateTransaction(
    new TransactionBuilder(account, {
      fee: BASE_FEE,
      networkPassphrase: Networks.TESTNET,
    })
      .addOperation(contract.call('get_config'))
      .build()
  );

  const config = scValToNative(result.result);
  console.log('Contract configuration:', config);
}

// Example usage
async function main() {
  try {
    // Initialize the contract (only needs to be done once)
    await initializeContract();
    
    // Get contract configuration
    await getContractConfig();
    
    // Deposit tokens (example with XLM)
    await depositTokens('10000000', 'CDLJVC3RCJAUUHSDY76ZLJ43OZ4O6D5437BKZD7YMDJZ6Q5E7R4WC6T');
    
    // Check balance
    await checkBalance('CDLJVC3RCJAUUHSDY76ZLJ43OZ4O6D5437BKZD7YMDJZ6Q5E7R4WC6T');
    
    // Transfer tokens
    await transferTokens(
      'GD5DJQDKEKGHA2PJH7XZPDRXBT4N2RJDYEG4C4JHHCLMCE2GMZ6TJYWG',
      '5000000',
      'CDLJVC3RCJAUUHSDY76ZLJ43OZ4O6D5437BKZD7YMDJZ6Q5E7R4WC6T',
      'Test transfer'
    );
    
    // Withdraw tokens
    await withdrawTokens('2000000', 'CDLJVC3RCJAUUHSDY76ZLJ43OZ4O6D5437BKZD7YMDJZ6Q5E7R4WC6T');
    
    // Get payment details
    await getPaymentDetails(1);
    
  } catch (error) {
    console.error('Error:', error);
  }
}

// Export functions for use in other modules
export {
  initializeContract,
  depositTokens,
  transferTokens,
  withdrawTokens,
  checkBalance,
  getPaymentDetails,
  getContractConfig,
};

// Run the example if this file is executed directly
if (require.main === module) {
  main();
}
