'use client';

import { useStellar } from '@/hooks/useStellar';
import { stellarService } from '@/services/stellar.service';
import { Card } from '@orbytech/ui';
import { RefreshCw, TrendingUp, Wallet, DollarSign } from 'lucide-react';
import { formatStellarBalance, formatAddress } from '@/lib/utils';

interface WalletBalanceProps {
  className?: string;
}

export function WalletBalance({ className }: WalletBalanceProps) {
  const { account, isConnected, isLoading, refreshAccount } = useStellar();

  if (!isConnected || !account) {
    return (
      <Card className={className}>
        <div className="p-6 text-center">
          <Wallet className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Connect Your Wallet
          </h3>
          <p className="text-gray-500">
            Connect your Stellar wallet to view your balance and transaction history.
          </p>
        </div>
      </Card>
    );
  }

  const xlmBalance = account.balances?.find(b => b.asset_code === 'XLM');
  const otherBalances = account.balances?.filter(b => b.asset_code !== 'XLM') || [];
  const totalBalance = parseFloat(xlmBalance?.balance || '0');

  return (
    <Card className={className}>
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Wallet Balance</h2>
            <p className="text-sm text-gray-500">
              {formatAddress(account.publicKey)}
            </p>
          </div>
          <button
            onClick={refreshAccount}
            disabled={isLoading}
            className="p-2 text-gray-500 hover:text-gray-700 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* XLM Balance */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 mb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-600 rounded-lg">
                <DollarSign className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Stellar Lumens</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatStellarBalance(xlmBalance?.balance || '0')}
                </p>
              </div>
            </div>
            {totalBalance > 0 && (
              <div className="flex items-center gap-1 text-green-600">
                <TrendingUp className="h-4 w-4" />
                <span className="text-sm font-medium">Active</span>
              </div>
            )}
          </div>
        </div>

        {/* Other Balances */}
        {otherBalances.length > 0 && (
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-3">Other Assets</h3>
            <div className="space-y-2">
              {otherBalances.map((balance, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-gray-600 rounded-lg">
                      <Wallet className="h-4 w-4 text-white" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {balance.asset_code}
                      </p>
                      {balance.asset_issuer && (
                        <p className="text-xs text-gray-500">
                          {formatAddress(balance.asset_issuer)}
                        </p>
                      )}
                    </div>
                  </div>
                  <p className="text-sm font-medium text-gray-900">
                    {parseFloat(balance.balance).toLocaleString(undefined, {
                      maximumFractionDigits: 7,
                    })}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Network Info */}
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500">Network</span>
            <span className="font-medium text-gray-900">
              {stellarService.getNetworkInfo().network === 'testnet' ? 'Testnet' : 'Mainnet'}
            </span>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => window.open(`https://stellar.expert/explorer/${account.publicKey}`, '_blank')}
              className="p-2 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            >
              View on Explorer
            </button>
            <button
              onClick={() => window.open(`https://laboratory.stellar.org/#account?publicKey=${account.publicKey}`, '_blank')}
              className="p-2 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            >
              Stellar Lab
            </button>
          </div>
        </div>
      </div>
    </Card>
  );
}
