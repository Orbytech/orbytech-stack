'use client';

import { WalletConnect } from '@/components/WalletConnect';
import { WalletBalance } from '@/components/WalletBalance';
import { SendPayment } from '@/components/SendPayment';
import { TransactionHistory } from '@/components/TransactionHistory';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Rocket, Zap, Shield, Globe } from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center h-12 w-12 rounded-2xl bg-blue-600 overflow-hidden">
                <img src="/logo.svg" alt="OrbyTech logo" className="h-full w-full object-cover" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">OrbyTech Stack</h1>
                <p className="text-xs text-gray-500">Stellar payment tools, dashboard, and wallet utilities</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Shield className="h-4 w-4" />
                <span>Testnet</span>
              </div>
              <ThemeToggle />
              <WalletConnect />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero Section */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-8 mb-8 text-white">
          <div className="max-w-3xl">
            <h2 className="text-3xl font-bold mb-4">
              Stellar Payment Dashboard
            </h2>
            <p className="text-blue-100 mb-6">
              Connect your wallet, check your balance, send payments, and track your transaction history - all in one place.
            </p>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                <span className="font-medium">Fast & Secure</span>
              </div>
              <div className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                <span className="font-medium">Stellar Network</span>
              </div>
            </div>
          </div>
        </div>

        {/* Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Wallet Balance */}
          <div className="lg:col-span-1">
            <WalletBalance />
          </div>

          {/* Middle Column - Send Payment */}
          <div className="lg:col-span-1">
            <SendPayment />
          </div>

          {/* Right Column - Transaction History */}
          <div className="lg:col-span-1">
            <TransactionHistory />
          </div>
        </div>

        {/* Features Section */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-lg border">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Shield className="h-5 w-5 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Secure</h3>
            </div>
            <p className="text-gray-600">
              Your private keys are stored locally and never shared with our servers.
            </p>
          </div>

          <div className="bg-white p-6 rounded-lg border">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-green-100 rounded-lg">
                <Zap className="h-5 w-5 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Fast</h3>
            </div>
            <p className="text-gray-600">
              Transactions are confirmed in seconds on the Stellar network.
            </p>
          </div>

          <div className="bg-white p-6 rounded-lg border">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Globe className="h-5 w-5 text-purple-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Global</h3>
            </div>
            <p className="text-gray-600">
              Send payments anywhere in the world with minimal fees.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center text-gray-500">
            <p className="mb-2">
              Built with Next.js, TypeScript, and Stellar SDK
            </p>
            <div className="flex items-center justify-center gap-4 text-sm">
              <a
                href="https://stellar.org"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-gray-700"
              >
                Stellar.org
              </a>
              <span>·</span>
              <a
                href="https://github.com/orbytech/orbytech-stack"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-gray-700"
              >
                GitHub
              </a>
              <span>·</span>
              <a
                href="https://laboratory.stellar.org"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-gray-700"
              >
                Stellar Lab
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
