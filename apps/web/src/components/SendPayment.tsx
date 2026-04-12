'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useStellar } from '@/hooks/useStellar';
import { Card, Button, Input, Modal, Toast } from '@orbytech/ui';
import { Send, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import { validateStellarAddress, validateAmount, formatAddress } from '@/lib/utils';

const paymentSchema = z.object({
  to: z.string().min(1, 'Recipient address is required')
    .refine(validateStellarAddress, 'Invalid Stellar address'),
  amount: z.string().min(1, 'Amount is required')
    .refine(validateAmount, 'Invalid amount'),
  asset: z.string().default('XLM'),
  memo: z.string().max(28, 'Memo must be at most 28 characters').optional(),
});

type PaymentFormData = z.infer<typeof paymentSchema>;

interface SendPaymentProps {
  className?: string;
  onPaymentSent?: (hash: string) => void;
}

export function SendPayment({ className, onPaymentSent }: SendPaymentProps) {
  const { isConnected, account, isLoading, sendPayment } = useStellar();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<{
    show: boolean;
    success: boolean;
    hash?: string;
    error?: string;
  }>({ show: false, success: false });

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    reset,
    watch,
  } = useForm<PaymentFormData>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      asset: 'XLM',
    },
  });

  const watchedAmount = watch('amount');
  const watchedAsset = watch('asset');

  const onSubmit = async (data: PaymentFormData) => {
    if (!isConnected || !account) {
      setResult({
        show: true,
        success: false,
        error: 'Wallet not connected',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const hash = await sendPayment({
        from: account.publicKey,
        to: data.to,
        amount: data.amount,
        asset: data.asset || 'XLM',
        memo: data.memo,
      });

      setResult({
        show: true,
        success: true,
        hash,
      });

      reset();
      setIsModalOpen(false);
      onPaymentSent?.(hash);
    } catch (error) {
      setResult({
        show: true,
        success: false,
        error: error instanceof Error ? error.message : 'Payment failed',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenModal = () => {
    if (!isConnected) {
      setResult({
        show: true,
        success: false,
        error: 'Please connect your wallet first',
      });
      return;
    }

    setIsModalOpen(true);
    setResult({ show: false, success: false });
  };

  const handleCloseResult = () => {
    setResult({ show: false, success: false });
  };

  const getEstimatedFee = () => {
    // Rough estimation: 100 stroops for base fee + 100 stroops per operation
    return 200; // in stroops
  };

  const getTotalAmount = () => {
    const amount = parseFloat(watchedAmount || '0');
    const fee = getEstimatedFee() / 1000000; // Convert stroops to XLM
    return amount + fee;
  };

  return (
    <div className={className}>
      <Card>
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Send Payment</h2>
            <Button onClick={handleOpenModal} disabled={!isConnected}>
              <Send className="h-4 w-4 mr-2" />
              Send
            </Button>
          </div>

          {!isConnected && (
            <div className="text-center py-8">
              <Send className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">
                Connect your wallet to send payments
              </p>
            </div>
          )}

          {isConnected && account && (
            <div className="space-y-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Available Balance</span>
                  <span className="text-sm font-medium text-gray-900">
                    {account.balance ? `${parseFloat(account.balance).toFixed(4)} XLM` : '0 XLM'}
                  </span>
                </div>
              </div>

              <div className="text-center text-sm text-gray-500">
                Click "Send" to create a new payment
              </div>
            </div>
          )}
        </div>
      </Card>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
        <div className="p-6">
          <h2 className="text-xl font-semibold mb-6">Send Payment</h2>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Recipient Address
              </label>
              <Input
                {...register('to')}
                placeholder="G..."
                className="font-mono text-sm"
                error={errors.to?.message}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Amount
              </label>
              <div className="flex gap-2">
                <Input
                  {...register('amount')}
                  type="number"
                  step="0.0000001"
                  placeholder="0.0000000"
                  className="font-mono text-sm"
                  error={errors.amount?.message}
                />
                <select
                  {...register('asset')}
                  className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                >
                  <option value="XLM">XLM</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Memo (Optional)
              </label>
              <Input
                {...register('memo')}
                placeholder="Payment for services"
                maxLength={28}
                error={errors.memo?.message}
              />
              <p className="text-xs text-gray-500 mt-1">
                {28 - (watch('memo')?.length || 0)} characters remaining
              </p>
            </div>

            {watchedAmount && parseFloat(watchedAmount) > 0 && (
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Amount</span>
                    <span className="font-medium">
                      {parseFloat(watchedAmount).toFixed(7)} {watchedAsset}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Estimated Fee</span>
                    <span className="font-medium">
                      {(getEstimatedFee() / 1000000).toFixed(7)} XLM
                    </span>
                  </div>
                  <div className="flex justify-between text-sm font-medium pt-2 border-t">
                    <span>Total</span>
                    <span>{getTotalAmount().toFixed(7)} XLM</span>
                  </div>
                </div>
              </div>
            )}

            <div className="flex gap-2 pt-4">
              <Button
                type="submit"
                disabled={!isValid || isSubmitting}
                className="flex-1"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Send Payment
                  </>
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsModalOpen(false)}
                disabled={isSubmitting}
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </form>
        </div>
      </Modal>

      {result.show && (
        <Modal isOpen={result.show} onClose={handleCloseResult}>
          <div className="p-6 text-center">
            {result.success ? (
              <>
                <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">Payment Sent!</h3>
                <p className="text-gray-600 mb-4">
                  Your payment has been successfully submitted to the Stellar network.
                </p>
                {result.hash && (
                  <div className="bg-gray-50 rounded-lg p-3 mb-4">
                    <p className="text-sm text-gray-600 mb-1">Transaction Hash</p>
                    <p className="font-mono text-sm break-all">{result.hash}</p>
                  </div>
                )}
                <Button onClick={handleCloseResult} className="w-full">
                  Close
                </Button>
              </>
            ) : (
              <>
                <AlertCircle className="h-16 w-16 text-red-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">Payment Failed</h3>
                <p className="text-gray-600 mb-4">{result.error}</p>
                <div className="flex gap-2">
                  <Button onClick={handleCloseResult} variant="outline" className="flex-1">
                    Close
                  </Button>
                  <Button onClick={() => setIsModalOpen(true)} className="flex-1">
                    Try Again
                  </Button>
                </div>
              </>
            )}
          </div>
        </Modal>
      )}

      {result.show && !isModalOpen && (
        <Toast
          message={result.success ? 'Payment sent successfully!' : result.error || 'Payment failed'}
          type={result.success ? 'success' : 'error'}
          onClose={handleCloseResult}
        />
      )}
    </div>
  );
}
