'use client';

import { useState, useEffect } from 'react';
import { useStellar } from '@/hooks/useStellar';
import { Card, Button, Toast } from '@orbytech/ui';
import { 
  ArrowUpRight, 
  ArrowDownLeft, 
  Clock, 
  ExternalLink, 
  RefreshCw,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import { Transaction, PaymentOperation } from '@/services/stellar.service';
import { formatDate, formatAddress, formatTransactionHash } from '@/lib/utils';

interface TransactionHistoryProps {
  className?: string;
}

interface TransactionItem {
  hash: string;
  createdAt: string;
  type: 'sent' | 'received';
  amount: string;
  asset: string;
  counterparty: string;
  memo?: string;
  status: 'success' | 'failed' | 'pending';
}

export function TransactionHistory({ className }: TransactionHistoryProps) {
  const { isConnected, account, isLoading, getTransactionHistory } = useStellar();
  const [transactions, setTransactions] = useState<TransactionItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{
    show: boolean;
    message: string;
    type: 'success' | 'error' | 'info';
  }>({ show: false, message: '', type: 'info' });

  const loadTransactions = async () => {
    if (!isConnected || !account) return;

    setLoading(true);
    setError(null);

    try {
      const history = await getTransactionHistory();
      
      const processedTransactions: TransactionItem[] = history
        .map((tx): TransactionItem | null => {
          // Find payment operations
          const paymentOps = tx.operations.filter((op): op is PaymentOperation => 
            op.type === 'payment'
          );

          if (paymentOps.length === 0) return null;

          // For simplicity, we'll process the first payment operation
          // In a real app, you might want to show all operations
          const payment = paymentOps[0];
          const isSent = tx.source_account === account.publicKey;

          return {
            hash: tx.hash,
            createdAt: tx.created_at,
            type: isSent ? 'sent' : 'received',
            amount: payment.amount,
            asset: payment.asset_code,
            counterparty: isSent ? payment.destination : tx.source_account,
            memo: undefined, // Memo would need to be fetched from transaction details
            status: 'success', // Simplified - in real app, check actual status
          };
        })
        .filter((tx): tx is TransactionItem => tx !== null)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      setTransactions(processedTransactions);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load transactions';
      setError(message);
      showToast('Failed to load transaction history', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTransactions();
  }, [isConnected, account]);

  const handleRefresh = () => {
    loadTransactions();
  };

  const handleViewOnExplorer = (hash: string) => {
    const network = stellarService.getNetworkInfo().network;
    const baseUrl = network === 'testnet' 
      ? 'https://stellar.expert/explorer/testnet'
      : 'https://stellar.expert/explorer';
    window.open(`${baseUrl}/tx/${hash}`, '_blank');
  };

  const showToast = (message: string, type: 'success' | 'error' | 'info') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ ...toast, show: false }), 3000);
  };

  const getTransactionIcon = (type: 'sent' | 'received') => {
    return type === 'sent' ? (
      <ArrowUpRight className="h-4 w-4 text-red-600" />
    ) : (
      <ArrowDownLeft className="h-4 w-4 text-green-600" />
    );
  };

  const getTransactionColor = (type: 'sent' | 'received') => {
    return type === 'sent' ? 'text-red-600' : 'text-green-600';
  };

  if (!isConnected || !account) {
    return (
      <Card className={className}>
        <div className="p-6 text-center">
          <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No Transaction History
          </h3>
          <p className="text-gray-500">
            Connect your wallet to view transaction history.
          </p>
        </div>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Transaction History</h2>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <p className="text-sm text-red-800">{error}</p>
            </div>
          </div>
        )}

        {transactions.length === 0 && !loading && !error && (
          <div className="text-center py-8">
            <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No Transactions Yet
            </h3>
            <p className="text-gray-500">
              Your transaction history will appear here once you start sending or receiving payments.
            </p>
          </div>
        )}

        {loading && (
          <div className="text-center py-8">
            <RefreshCw className="h-8 w-8 text-gray-400 mx-auto mb-4 animate-spin" />
            <p className="text-gray-500">Loading transactions...</p>
          </div>
        )}

        {transactions.length > 0 && (
          <div className="space-y-3">
            {transactions.map((tx) => (
              <div
                key={tx.hash}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white rounded-full">
                    {getTransactionIcon(tx.type)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className={`font-medium ${getTransactionColor(tx.type)}`}>
                        {tx.type === 'sent' ? 'Sent' : 'Received'}
                      </span>
                      <span className="text-sm text-gray-500">
                        {parseFloat(tx.amount).toLocaleString(undefined, {
                          maximumFractionDigits: 7,
                        })} {tx.asset}
                      </span>
                    </div>
                    <div className="text-sm text-gray-500">
                      {tx.type === 'sent' ? 'To: ' : 'From: '}
                      {formatAddress(tx.counterparty)}
                    </div>
                    {tx.memo && (
                      <div className="text-xs text-gray-400 mt-1">
                        Memo: {tx.memo}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <div className="text-xs text-gray-500">
                      {formatDate(tx.createdAt)}
                    </div>
                    <div className="flex items-center gap-1 mt-1">
                      {tx.status === 'success' && (
                        <CheckCircle className="h-3 w-3 text-green-600" />
                      )}
                      <span className="text-xs text-gray-400 capitalize">
                        {tx.status}
                      </span>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleViewOnExplorer(tx.hash)}
                  >
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {transactions.length > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="text-center">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => window.open(`https://stellar.expert/explorer/account/${account.publicKey}`, '_blank')}
              >
                View All Transactions on Explorer
              </Button>
            </div>
          </div>
        )}
      </div>

      {toast.show && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast({ ...toast, show: false })}
        />
      )}
    </Card>
  );
}
