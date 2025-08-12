export const USDC_MINT = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v';
export const USDC_DECIMALS = 6;

export const DEFAULT_CONFIG = {
  lookbackHours: 24,
  delayMsBetweenRequests: 300,
  maxRetries: 3,
  rpcTimeout: 30000,
};

export const getHeliusRpcUrl = (apiKey: string): string => {
  return `https://mainnet.helius-rpc.com/?api-key=${apiKey}`;
};

export const PUBLIC_RPC_URL = 'https://api.mainnet-beta.solana.com'; 