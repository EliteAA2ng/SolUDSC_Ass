import { Connection, PublicKey, ParsedTransactionWithMeta, TokenBalance } from '@solana/web3.js';
import { USDC_MINT, USDC_DECIMALS, DEFAULT_CONFIG } from '../config';
import { UsdcTransfer, TokenAccount } from '../types';

export class SolanaService {
  private connection: Connection;

  constructor(rpcUrl: string) {
    this.connection = new Connection(rpcUrl, {
      commitment: 'confirmed',
      confirmTransactionInitialTimeout: DEFAULT_CONFIG.rpcTimeout,
    });
  }

  async getUsdcTokenAccounts(walletAddress: string): Promise<TokenAccount[]> {
    try {
      const walletPubkey = new PublicKey(walletAddress);
      const response = await this.connection.getParsedTokenAccountsByOwner(walletPubkey, {
        mint: new PublicKey(USDC_MINT),
      });

      return response.value.map(account => ({
        address: account.pubkey.toString(),
        balance: account.account.data.parsed.info.tokenAmount.uiAmount || 0,
      }));
    } catch (error) {
      console.error('Error fetching token accounts:', error);
      throw new Error(`Failed to fetch USDC token accounts: ${error}`);
    }
  }

  async getUsdcTransfers(walletAddress: string, lookbackHours: number = 24): Promise<UsdcTransfer[]> {
    try {
      console.log(`Fetching USDC transfers for wallet: ${walletAddress}`);
      console.log(`Lookback window: ${lookbackHours} hours`);

      const transfers: UsdcTransfer[] = [];
      
      // Get signed transactions (outgoing)
      const outgoingTransfers = await this.getSignedTransactions(walletAddress, lookbackHours);
      transfers.push(...outgoingTransfers);

      // Get token account transactions (incoming)
      const tokenAccounts = await this.getUsdcTokenAccounts(walletAddress);
      for (const tokenAccount of tokenAccounts) {
        const incomingTransfers = await this.getTokenAccountTransactions(
          tokenAccount.address, 
          walletAddress, 
          lookbackHours
        );
        transfers.push(...incomingTransfers);
      }

      // Remove duplicates and sort by timestamp
      const uniqueTransfers = this.deduplicateTransfers(transfers);
      return uniqueTransfers.sort((a, b) => b.timestamp - a.timestamp);
    } catch (error) {
      console.error('Error fetching USDC transfers:', error);
      throw new Error(`Failed to fetch USDC transfers: ${error}`);
    }
  }

  private async getSignedTransactions(walletAddress: string, lookbackHours: number): Promise<UsdcTransfer[]> {
    const walletPubkey = new PublicKey(walletAddress);
    const signatures = await this.connection.getSignaturesForAddress(walletPubkey, {
      limit: 200,
    });

    const cutoffTime = Date.now() - (lookbackHours * 60 * 60 * 1000);
    const recentSignatures = signatures.filter(sig => 
      sig.blockTime && (sig.blockTime * 1000) > cutoffTime
    );

    const transfers: UsdcTransfer[] = [];
    
    for (const sig of recentSignatures.slice(0, 50)) {
      try {
        await this.delay(DEFAULT_CONFIG.delayMsBetweenRequests);
        const transaction = await this.connection.getParsedTransaction(sig.signature, {
          maxSupportedTransactionVersion: 0,
        });

        if (transaction) {
          const transfer = this.parseTransactionForUsdcTransfer(transaction, walletAddress);
          if (transfer) {
            transfers.push(transfer);
          }
        }
      } catch (error) {
        console.warn(`Failed to fetch transaction ${sig.signature}:`, error);
      }
    }

    return transfers;
  }

  private async getTokenAccountTransactions(
    tokenAccountAddress: string, 
    walletAddress: string, 
    lookbackHours: number
  ): Promise<UsdcTransfer[]> {
    const tokenAccountPubkey = new PublicKey(tokenAccountAddress);
    const signatures = await this.connection.getSignaturesForAddress(tokenAccountPubkey, {
      limit: 200,
    });

    const cutoffTime = Date.now() - (lookbackHours * 60 * 60 * 1000);
    const recentSignatures = signatures.filter(sig => 
      sig.blockTime && (sig.blockTime * 1000) > cutoffTime
    );

    const transfers: UsdcTransfer[] = [];
    
    for (const sig of recentSignatures.slice(0, 100)) {
      try {
        await this.delay(DEFAULT_CONFIG.delayMsBetweenRequests);
        const transaction = await this.connection.getParsedTransaction(sig.signature, {
          maxSupportedTransactionVersion: 0,
        });

        if (transaction) {
          const transfer = this.parseTransactionForUsdcTransfer(transaction, walletAddress);
          if (transfer) {
            transfers.push(transfer);
          }
        }
      } catch (error) {
        console.warn(`Failed to fetch transaction ${sig.signature}:`, error);
      }
    }

    return transfers;
  }

  private parseTransactionForUsdcTransfer(
    transaction: ParsedTransactionWithMeta, 
    walletAddress: string
  ): UsdcTransfer | null {
    if (!transaction.meta || !transaction.blockTime) return null;

    const preBalances = transaction.meta.preTokenBalances || [];
    const postBalances = transaction.meta.postTokenBalances || [];
    
    // Find USDC balance changes
    const usdcBalanceChanges = this.calculateUsdcBalanceChanges(preBalances, postBalances);
    
    // Find the wallet's balance change
    const walletBalanceChange = usdcBalanceChanges.find(change => 
      change.owner === walletAddress
    );

    if (!walletBalanceChange || walletBalanceChange.change === 0) return null;

    // Determine counterparty
    const counterparty = this.findCounterparty(usdcBalanceChanges, walletAddress);

    return {
      signature: transaction.transaction.signatures[0],
      timestamp: transaction.blockTime * 1000,
      direction: walletBalanceChange.change > 0 ? 'received' : 'sent',
      amount: Math.abs(walletBalanceChange.change) / Math.pow(10, USDC_DECIMALS),
      counterparty: counterparty || 'Unknown',
      slot: transaction.slot,
    };
  }

  private calculateUsdcBalanceChanges(preBalances: TokenBalance[], postBalances: TokenBalance[]) {
    const changes: Array<{ owner: string; change: number; account: string }> = [];
    
    // Create a map of account to pre-balance
    const preBalanceMap = new Map<string, { amount: string; owner?: string }>();
    preBalances.forEach(balance => {
      if (balance.mint === USDC_MINT) {
        preBalanceMap.set(balance.accountIndex.toString(), {
          amount: balance.uiTokenAmount.amount,
          owner: balance.owner,
        });
      }
    });

    // Calculate changes
    postBalances.forEach(postBalance => {
      if (postBalance.mint === USDC_MINT) {
        const preBalance = preBalanceMap.get(postBalance.accountIndex.toString());
        const preAmount = preBalance ? parseInt(preBalance.amount) : 0;
        const postAmount = parseInt(postBalance.uiTokenAmount.amount);
        const change = postAmount - preAmount;
        
        if (change !== 0 && postBalance.owner) {
          changes.push({
            owner: postBalance.owner,
            change,
            account: postBalance.accountIndex.toString(),
          });
        }
      }
    });

    return changes;
  }

  private findCounterparty(
    balanceChanges: Array<{ owner: string; change: number; account: string }>, 
    walletAddress: string
  ): string {
    // Find the opposite balance change
    const walletChange = balanceChanges.find(change => change.owner === walletAddress);
    if (!walletChange) return 'Unknown';

    const oppositeChange = balanceChanges.find(change => 
      change.owner !== walletAddress && 
      Math.sign(change.change) !== Math.sign(walletChange.change)
    );

    return oppositeChange?.owner || 'Unknown';
  }

  private deduplicateTransfers(transfers: UsdcTransfer[]): UsdcTransfer[] {
    const seen = new Set<string>();
    return transfers.filter(transfer => {
      if (seen.has(transfer.signature)) {
        return false;
      }
      seen.add(transfer.signature);
      return true;
    });
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async validateAddress(address: string): Promise<boolean> {
    try {
      new PublicKey(address);
      return true;
    } catch {
      return false;
    }
  }
} 