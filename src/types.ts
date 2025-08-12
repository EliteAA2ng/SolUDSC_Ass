export interface UsdcTransfer {
  signature: string;
  timestamp: number;
  direction: 'sent' | 'received';
  amount: number;
  counterparty: string;
  slot: number;
}

export interface TokenAccount {
  address: string;
  balance: number;
}

export interface WalletData {
  address: string;
  tokenAccounts: TokenAccount[];
  transfers: UsdcTransfer[];
}

export interface AppConfig {
  heliusApiKey: string;
  lookbackHours: number;
} 