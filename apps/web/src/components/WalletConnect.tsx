'use client';

import { useState } from 'react';
import { useStellar } from '@/hooks/useStellar';
import { stellarService } from '@/services/stellar.service';
import { Button, Input, Modal, Toast } from '@orbytech/ui';
import { Copy, Wallet, AlertCircle, CheckCircle, ExternalLink } from 'lucide-react';
import { formatAddress, copyToClipboard, validateStellarAddress, validateStellarSecretKey } from '@/lib/utils';

interface WalletConnectProps {
  className?: string;
}

export function WalletConnect({ className }: WalletConnectProps) {
  const { 
    isConnected, 
    account, 
    isLoading, 
    error, 
    connect, 
    disconnect, 
    createAccount, 
    fundAccount 
  } = useStellar();
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [secretKey, setSecretKey] = useState('');
  const [newAccount, setNewAccount] = useState<any>(null);
  const [showNewAccount, setShowNewAccount] = useState(false);
  const [toast, setToast] = useState<{
    show: boolean;
    message: string;
    type: 'success' | 'error' | 'info';
  }>({ show: false, message: '', type: 'info' });

  const handleConnect = async () => {
    if (!secretKey.trim()) {
      showToast('Please enter a secret key', 'error');
      return;
    }

    if (!validateStellarSecretKey(secretKey.trim())) {
      showToast('Invalid secret key format', 'error');
      return;
    }

    try {
      await connect(secretKey.trim());
      setIsModalOpen(false);
      setSecretKey('');
      showToast('Wallet connected successfully', 'success');
    } catch (err) {
      showToast('Failed to connect wallet', 'error');
    }
  };

  const handleCreateAccount = async () => {
    try {
      const account = await createAccount();
      setNewAccount(account);
      setShowNewAccount(true);
      setIsModalOpen(false);
      showToast('Account created successfully', 'success');
    } catch (err) {
      showToast('Failed to create account', 'error');
    }
  };

  const handleFundAccount = async () => {
    try {
      const funded = await fundAccount();
      if (funded) {
        showToast('Account funded successfully', 'success');
      } else {
        showToast('Failed to fund account', 'error');
      }
    } catch (err) {
      showToast('Failed to fund account', 'error');
    }
  };

  const handleDisconnect = () => {
    disconnect();
    showToast('Wallet disconnected', 'info');
  };

  const handleCopyAddress = async () => {
    if (!account?.publicKey) return;
    
    try {
      await copyToClipboard(account.publicKey);
      showToast('Address copied to clipboard', 'success');
    } catch (err) {
      showToast('Failed to copy address', 'error');
    }
  };

  const handleCopySecretKey = async (secret: string) => {
    try {
      await copyToClipboard(secret);
      showToast('Secret key copied to clipboard', 'success');
    } catch (err) {
      showToast('Failed to copy secret key', 'error');
    }
  };

  const showToast = (message: string, type: 'success' | 'error' | 'info') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ ...toast, show: false }), 3000);
  };

  if (isConnected && account) {
    return (
      <div className={className}>
        <div className="flex items-center gap-4 p-4 bg-white rounded-lg border shadow-sm">
          <div className="flex items-center gap-2">
            <Wallet className="h-5 w-5 text-blue-600" />
            <div>
              <p className="text-sm font-medium text-gray-900">
                {formatAddress(account.publicKey)}
              </p>
              <p className="text-xs text-gray-500">
                {account.balance ? `${parseFloat(account.balance).toFixed(4)} XLM` : '0 XLM'}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2 ml-auto">
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopyAddress}
            >
              <Copy className="h-4 w-4" />
            </Button>
            
            {stellarService.getNetworkInfo().network === 'testnet' && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleFundAccount}
                disabled={isLoading}
              >
                Fund
              </Button>
            )}
            
            <Button
              variant="outline"
              size="sm"
              onClick={handleDisconnect}
            >
              Disconnect
            </Button>
          </div>
        </div>

        {toast.show && (
          <Toast
            message={toast.message}
            type={toast.type}
            onClose={() => setToast({ ...toast, show: false })}
          />
        )}
      </div>
    );
  }

  return (
    <div className={className}>
      <Button onClick={() => setIsModalOpen(true)} disabled={isLoading}>
        <Wallet className="h-4 w-4 mr-2" />
        Connect Wallet
      </Button>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
        <div className="p-6">
          <h2 className="text-xl font-semibold mb-4">Connect Stellar Wallet</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Secret Key
              </label>
              <Input
                type="password"
                placeholder="Enter your Stellar secret key (S...)"
                value={secretKey}
                onChange={(e) => setSecretKey(e.target.value)}
                className="font-mono text-sm"
              />
              <p className="text-xs text-gray-500 mt-1">
                Your secret key will be stored locally and used to sign transactions.
              </p>
            </div>

            <div className="flex gap-2">
              <Button onClick={handleConnect} disabled={isLoading} className="flex-1">
                {isLoading ? 'Connecting...' : 'Connect'}
              </Button>
              <Button
                variant="outline"
                onClick={handleCreateAccount}
                disabled={isLoading}
                className="flex-1"
              >
                Create New
              </Button>
            </div>

            <div className="text-center">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => window.open('https://laboratory.stellar.org/', '_blank')}
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Create Account in Stellar Lab
              </Button>
            </div>
          </div>
        </div>
      </Modal>

      {showNewAccount && newAccount && (
        <Modal isOpen={showNewAccount} onClose={() => setShowNewAccount(false)}>
          <div className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <CheckCircle className="h-6 w-6 text-green-600" />
              <h2 className="text-xl font-semibold">Account Created!</h2>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Public Key
                </label>
                <div className="flex gap-2">
                  <Input
                    value={newAccount.publicKey}
                    readOnly
                    className="font-mono text-xs"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleCopySecretKey(newAccount.publicKey)}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Secret Key (Save this securely!)
                </label>
                <div className="flex gap-2">
                  <Input
                    type="password"
                    value={newAccount.secretKey}
                    readOnly
                    className="font-mono text-xs"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleCopySecretKey(newAccount.secretKey!)}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-xs text-red-600 mt-1">
                  Save your secret key securely. Losing it means losing access to your funds.
                </p>
              </div>

              <div className="flex gap-2">
                <Button onClick={() => handleConnect(newAccount.secretKey)} className="flex-1">
                  Connect Now
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowNewAccount(false)}
                  className="flex-1"
                >
                  Close
                </Button>
              </div>
            </div>
          </div>
        </Modal>
      )}

      {toast.show && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast({ ...toast, show: false })}
        />
      )}

      {error && (
        <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-md">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <p className="text-sm text-red-800">{error}</p>
          </div>
        </div>
      )}
    </div>
  );
}
