import { useState } from 'react';
import { Search, AlertTriangle, Info } from 'lucide-react';

interface WalletInputProps {
  onSubmit: (address: string, heliusKey: string, hours: number) => void;
  loading: boolean;
}

export default function WalletInput({ onSubmit, loading }: WalletInputProps) {
  const [address, setAddress] = useState('');
  const [heliusKey, setHeliusKey] = useState('32b3331b-4199-4640-b6b3-2902f294075d');
  const [hours, setHours] = useState(24);
  const [error, setError] = useState('');

  const validateAddress = (addr: string): boolean => {
    if (!addr.trim()) return false;
    if (addr.length < 32 || addr.length > 44) return false;
    
    const base58Regex = /^[1-9A-HJ-NP-Za-km-z]+$/;
    return base58Regex.test(addr);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!validateAddress(address)) {
      setError('Invalid wallet address format. Expected 32-44 character base58 string.');
      return;
    }

    if (!heliusKey.trim()) {
      setError('Helius API key is required for optimal performance.');
      return;
    }

    if (hours < 1 || hours > 168) {
      setError('Lookback period must be between 1 and 168 hours.');
      return;
    }

    onSubmit(address.trim(), heliusKey.trim(), hours);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-slate-900 rounded-2xl mb-4">
            <div className="w-8 h-8 bg-gradient-to-br from-violet-400 to-purple-500 rounded-lg flex items-center justify-center">
              <Search className="w-4 h-4 text-white" />
            </div>
          </div>
          <h1 className="text-2xl font-semibold text-slate-900 mb-2">
            USDC Transfer Analytics
          </h1>
          <p className="text-slate-600 text-sm leading-relaxed">
            Comprehensive on-chain analysis for Solana wallet USDC activity
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Wallet Address */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700 block">
              Wallet Address
            </label>
            <div className="relative">
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="11111111111111111111111111111111"
                className="w-full h-12 px-4 pr-10 text-sm border border-slate-200 rounded-xl focus:border-violet-500 focus:ring-4 focus:ring-violet-50 outline-none transition-all placeholder:text-slate-400 font-mono"
                disabled={loading}
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                <div className="w-2 h-2 bg-slate-300 rounded-full"></div>
              </div>
            </div>
          </div>

          {/* Configuration Row */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700 block">
                Lookback Period
              </label>
              <select
                value={hours}
                onChange={(e) => setHours(Number(e.target.value))}
                className="w-full h-12 px-3 text-sm border border-slate-200 rounded-xl focus:border-violet-500 focus:ring-4 focus:ring-violet-50 outline-none transition-all bg-white"
                disabled={loading}
              >
                <option value={1}>1 hour</option>
                <option value={6}>6 hours</option>
                <option value={24}>24 hours</option>
                <option value={72}>3 days</option>
                <option value={168}>7 days</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700 block">
                RPC Provider
              </label>
              <div className="relative">
                <input
                  type="text"
                  value="Helius"
                  disabled
                  className="w-full h-12 px-3 text-sm border border-slate-200 rounded-xl bg-slate-50 text-slate-500"
                />
                <Info className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              </div>
            </div>
          </div>

          {/* API Key */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700 block">
              Helius API Key
            </label>
            <input
              type="password"
              value={heliusKey}
              onChange={(e) => setHeliusKey(e.target.value)}
              className="w-full h-12 px-4 text-sm border border-slate-200 rounded-xl focus:border-violet-500 focus:ring-4 focus:ring-violet-50 outline-none transition-all font-mono"
              disabled={loading}
            />
          </div>

          {/* Error Display */}
          {error && (
            <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-100 rounded-xl">
              <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-red-900 mb-1">Validation Error</p>
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading || !address.trim() || !heliusKey.trim()}
            className="w-full h-12 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-medium rounded-xl transition-all duration-200 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Analyzing...</span>
              </>
            ) : (
              <>
                <Search className="w-4 h-4" />
                <span>Analyze Transfers</span>
              </>
            )}
          </button>
        </form>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-xs text-slate-500">
            Powered by Solana Web3.js • Helius RPC
          </p>
        </div>
      </div>
    </div>
  );
} 