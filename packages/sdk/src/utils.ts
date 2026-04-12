import { PaymentContract, StreamingContract } from './types';

export function validatePaymentContract(contract: PaymentContract): boolean {
  return !!(
    contract.contractId &&
    contract.recipient &&
    contract.amount &&
    contract.token
  );
}

export function validateStreamingContract(contract: StreamingContract): boolean {
  return !!(
    contract.contractId &&
    contract.sender &&
    contract.recipient &&
    contract.totalAmount &&
    contract.token &&
    contract.startTime &&
    contract.endTime &&
    contract.interval > 0
  );
}

export function formatAmount(amount: string, decimals: number = 7): string {
  const num = parseFloat(amount);
  return num.toFixed(decimals);
}

export function parseAmount(amount: string): number {
  return parseFloat(amount);
}

export function isValidStellarAddress(address: string): boolean {
  // Basic validation for Stellar public key
  return /^[G][A-Z0-9]{55}$/.test(address);
}

export function isValidContractId(contractId: string): boolean {
  // Basic validation for Soroban contract ID
  return /^[a-f0-9]{64}$/.test(contractId);
}
