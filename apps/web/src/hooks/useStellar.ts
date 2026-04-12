'use client';

import { useState, useCallback, useEffect } from 'react';
import { stellarService, StellarAccount, PaymentRequest, Transaction } from '../services/stellar.service';

interface UseStellarReturn {
  account: StellarAccount | null;
  isConnected: boolean;
  isLoading: boolean;
  error: string | null;
  connect: (secretKey?: string) => Promise<void>;
  disconnect: () => void;
  createAccount: () => Promise<StellarAccount>;
  fundAccount: () => Promise<boolean>;
  refreshAccount: () => Promise<void>;
  sendPayment: (payment: PaymentRequest) => Promise<string>;
  getTransactionHistory: () => Promise<Transaction[]>;
}

export function useStellar(): UseStellarReturn {
  const [account, setAccount] = useState<StellarAccount | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isConnected = !!account;

  // Load account from localStorage on mount
  useEffect(() => {
    const savedPublicKey = localStorage.getItem('stellar_public_key');
    if (savedPublicKey) {
      loadAccount(savedPublicKey);
    }
  }, []);

  const loadAccount = useCallback(async (publicKey: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const accountInfo = await stellarService.getAccountInfo(publicKey);
      setAccount(accountInfo);
      localStorage.setItem('stellar_public_key', publicKey);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load account';
      setError(message);
      setAccount(null);
      localStorage.removeItem('stellar_public_key');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const connect = useCallback(async (secretKey?: string) => {
    setIsLoading(true);
    setError(null);

    try {
      let publicKey: string;

      if (secretKey) {
        // Connect with secret key
        const keypair = stellarService.validateAddress(secretKey) 
          ? { publicKey: secretKey } 
          : stellarService.createAccount();
        
        publicKey = keypair.publicKey;
        
        // Save secret key to localStorage (only in development)
        if (process.env.NODE_ENV === 'development') {
          localStorage.setItem('stellar_secret_key', secretKey);
        }
      } else {
        throw new Error('Secret key is required');
      }

      await loadAccount(publicKey);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to connect wallet';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [loadAccount]);

  const disconnect = useCallback(() => {
    setAccount(null);
    setError(null);
    localStorage.removeItem('stellar_public_key');
    localStorage.removeItem('stellar_secret_key');
  }, []);

  const createAccount = useCallback(async (): Promise<StellarAccount> => {
    setIsLoading(true);
    setError(null);

    try {
      const newAccount = stellarService.createAccount();
      return newAccount;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create account';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fundAccount = useCallback(async (): Promise<boolean> => {
    if (!account) {
      setError('No account connected');
      return false;
    }

    setIsLoading(true);
    setError(null);

    try {
      const funded = await stellarService.fundTestnetAccount(account.publicKey);
      if (funded) {
        await refreshAccount();
      }
      return funded;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fund account';
      setError(message);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [account]);

  const refreshAccount = useCallback(async () => {
    if (!account) return;
    
    await loadAccount(account.publicKey);
  }, [account, loadAccount]);

  const sendPayment = useCallback(async (payment: PaymentRequest): Promise<string> => {
    if (!account) {
      setError('No account connected');
      throw new Error('No account connected');
    }

    setIsLoading(true);
    setError(null);

    try {
      // Get secret key from localStorage (development only)
      let secretKey = localStorage.getItem('stellar_secret_key');
      
      if (!secretKey) {
        throw new Error('Secret key not found. Please reconnect your wallet.');
      }

      // Create payment transaction
      const paymentResult = await stellarService.createPaymentTransaction(payment);
      
      if (!paymentResult.success || !paymentResult.transactionXDR) {
        throw new Error(paymentResult.error || 'Failed to create payment');
      }

      // Sign transaction
      const signedXDR = stellarService.signTransaction(paymentResult.transactionXDR, secretKey);

      // Submit transaction
      const submitResult = await stellarService.submitTransaction(signedXDR);
      
      if (!submitResult.success) {
        throw new Error(submitResult.error || 'Transaction failed');
      }

      // Refresh account after successful payment
      await refreshAccount();

      return submitResult.hash || '';
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Payment failed';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [account, refreshAccount]);

  const getTransactionHistory = useCallback(async (): Promise<Transaction[]> => {
    if (!account) {
      setError('No account connected');
      return [];
    }

    setIsLoading(true);
    setError(null);

    try {
      const history = await stellarService.getTransactionHistory(account.publicKey);
      return history;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to get transaction history';
      setError(message);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [account]);

  return {
    account,
    isConnected,
    isLoading,
    error,
    connect,
    disconnect,
    createAccount,
    fundAccount,
    refreshAccount,
    sendPayment,
    getTransactionHistory,
  };
}
