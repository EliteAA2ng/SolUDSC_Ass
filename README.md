# Solana USDC Tracker

A modern React web application that tracks USDC transfers for any Solana wallet. Built with TypeScript, React, and Solana Web3.js.

## Features

- 🔍 **Comprehensive Transfer Detection**: Finds both outgoing (signed) and incoming (received) USDC transfers
- 💰 **Real-time Analysis**: Shows transfer direction, amounts, counterparties, and timestamps
- 🎨 **Professional UI**: Clean, responsive design with dark mode support
- ⚡ **Helius Integration**: Optimized for Helius RPC for faster, more reliable data
- 🔗 **Explorer Links**: Direct links to transactions on Solscan
- 📊 **Summary Statistics**: Total transfers, received, and sent amounts

## Quick Start

### Prerequisites

- Node.js 18+ 
- A Helius API key (recommended) - get one at [helius.xyz](https://helius.xyz)

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd solana-usdc-tracker

# Install dependencies
npm install

# Start development server
npm run dev
```

The app will be available at `http://localhost:5173`

### Usage

1. **Enter Wallet Address**: Paste any Solana wallet address (base58 format)
2. **Add Helius API Key**: Your key for faster, more reliable RPC access
3. **Select Timeframe**: Choose lookback window (1 hour to 7 days)
4. **Analyze**: Click "Analyze Transfers" to fetch and display results

## Configuration

### Helius API Key

For best performance, get a free Helius API key:

1. Visit [helius.xyz](https://helius.xyz)
2. Sign up and create an API key
3. Enter it in the app or set as environment variable:

```bash
# Optional: Set as environment variable
echo "VITE_HELIUS_API_KEY=your-key-here" > .env.local
```

### Environment Variables

- `VITE_HELIUS_API_KEY` - Your Helius API key (optional)

## How It Works

The app uses the same detection logic as the original Rust CLI:

1. **Token Account Discovery**: Finds all USDC token accounts owned by the wallet
2. **Transaction Analysis**: Fetches recent transactions for both the wallet and its token accounts
3. **Balance Delta Calculation**: Compares pre/post token balances to determine transfer amounts
4. **Counterparty Resolution**: Identifies the other party in each transfer
5. **Deduplication & Sorting**: Removes duplicates and sorts by timestamp

This approach captures transfers that standard wallet-centric queries miss, especially incoming transfers initiated by other parties.

## Tech Stack

- **Frontend**: React 18 + TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **Solana**: @solana/web3.js + @solana/spl-token
- **Data Fetching**: TanStack Query (React Query)
- **Icons**: Lucide React

## Scripts

```bash
npm run dev       # Start development server
npm run build     # Build for production
npm run preview   # Preview production build
npm run lint      # Run ESLint
```

## Deployment

### Netlify/Vercel

1. Build the project: `npm run build`
2. Deploy the `dist` folder
3. Set environment variables in your deployment platform

### Environment Variables for Production

- `VITE_HELIUS_API_KEY` - Your Helius API key

## API Rate Limits

- **Public RPC**: May throttle requests; use Helius for better reliability
- **Helius Free Tier**: 100,000 requests/month
- **Built-in Delays**: Automatic pacing between requests to avoid rate limits

## Troubleshooting

### No Results Found
- Verify the wallet address is correct
- Increase the lookback window
- Ensure the wallet has recent USDC activity
- Check if using Helius improves results

### Rate Limiting
- The app includes automatic delays between requests
- Helius accounts have higher rate limits than public RPC
- Wait a few minutes if you hit limits

### Invalid Address Error
- Ensure the address is a valid Solana public key (base58, 32-44 characters)
# SolUSDC_Ass
A zero-config command-line utility that lists recent USDC transfers for a Solana wallet. Built for reliability on public RPC and optimized for Helius when available.
---
## What it does
- Scans all USDC token accounts owned by a wallet
- Pulls recent transactions that touched those accounts
- Computes token balance deltas to determine:
  - time (UTC and relative)
  - direction (sent/received)
  - amount (USDC)
  - counterparty (wallet when resolvable; falls back to token account)
- Prints in multiple human/dev friendly formats
Why it finds incoming transfers: `getSignaturesForAddress` only shows transactions the wallet signed. We analyze token accounts directly to capture transfers initiated by other parties.
---
## Quick install
```bash
cargo build
```
---
## Run (fast start)
Use a Helius key if you have one; the tool will auto-detect it.
PowerShell
```powershell
$env:HELIUS_API_KEY="32b3331b-4199-4640-b6b3-2902f294075d"
cargo run -- --format explorer --hours 24 7cMEhpt9y3inBNVv8fNnuaEbx7hKHZnLvR1KWKKxuDDU
```
Command Prompt (cmd)
```cmd
set HELIUS_API_KEY=32b3331b-4199-4640-b6b3-2902f294075d && cargo run -- --format explorer --hours 24 7cMEhpt9y3inBNVv8fNnuaEbx7hKHZnLvR1KWKKxuDDU
```
Without Helius
```bash
cargo run -- --rpc-url https://api.mainnet-beta.solana.com --hours 24 7cMEhpt9y3inBNVv8fNnuaEbx7hKHZnLvR1KWKKxuDDU
```
---
## CLI reference
- positional
  - `wallet_address` — base58 public key
- flags
  - `--rpc-url <URL>` — override endpoint (if not set and `HELIUS_APIThe team prefer to use web3 module with frontend like the candidate we chose
_KEY` exists, Helius is used)
  - `--hours <N>` — lookback window, default 24
  - `--format <mode>` — `table | compact | json | csv | timeline | explorer` (default `table`)
---
## Persisting your Helius key
Command Prompt (cmd)
```cmd
setx HELIUS_API_KEY "YOUR_HELIUS_KEY"
```
PowerShell
```powershell
setx HELIUS_API_KEY "YOUR_HELIUS_KEY"
```
Open a new terminal window after running `setx`.
Verify
```cmd
echo %HELIUS_API_KEY%
```
---
## How detection works (short version)
1) `getTokenAccountsByOwner` to enumerate wallet’s USDC token accounts
2) For each token account, fetch recent signatures and then transactions (`getTransaction`, maxSupportedTransactionVersion=0)
3) Compare pre/post token balances for the USDC mint
4) Select the wallet’s strongest delta → direction and amount
5) Choose the counterparty from the opposite-signed delta; prefer the owner wallet (resolved via `getAccountInfo`) and fall back to the token account pubkey
6) Merge, sort, de‑dup, print
---
## Configuration knobs
Defined in `core/config.rs` (sane defaults):
- lookback: `lookback_hours`
- pacing: `delay_ms_between_wallet_tx`, `delay_ms_between_atas`, `delay_ms_between_ata_tx`
- scan limits: `outgoing_scan_limit`, `token_account_scan_limit`
Environment
- `HELIUS_API_KEY` — when present and `--rpc-url` is not provided, the client targets `https://mainnet.helius-rpc.com/?api-key=...`
---
## Output modes
- `table` — readable summary with totals
- `compact` — one-liners for scripting
- `json` — machine‑readable
- `csv` — spreadsheet friendly
- `timeline` — grouped by day
- `explorer` — explorer‑like rows
---
## RPC & performance
- Retries with exponential backoff on 429
- Public RPC works but may throttle; Helius key recommended
---
## Troubleshooting
- No results: increase `--hours`, verify activity exists, prefer a keyed RPC
- Rate limits (429): wait/retry; consider increasing delays in `AppConfig`
- `cargo` not found on Windows: ensure `%USERPROFILE%\.cargo\bin` (cmd) or `$env:USERPROFILE\.cargo\bin` (PowerShell) is on PATH, then open a new shell
---
## Project layout (high level)
- `app/main.rs` — entrypoint, arguments, app boot
- `core/config.rs` — configuration
- `core/domain/` — types and errors
- `core/infrastructure/rpc_client.rs` — JSON‑RPC adapter with retries
- `core/application/indexer.rs` — detection logic + printers
- `core/presentation/cli.rs` — CLI schema
---
## Notes
- Mint: `EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v` (USDC)
- This tool only reads public data; do not provide private keys
- License: MIT
