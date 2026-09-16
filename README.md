# GridSwap — Peer-to-Peer Energy Trading Platform

GridSwap is a blockchain-based marketplace where households with surplus solar
energy can sell it directly to nearby consumers. Offers, purchases, and
payment settlement are recorded and enforced by a Solidity smart contract on
a local Ethereum-compatible network. Built as a university PBL project.

## Project Overview

A producer with surplus rooftop solar generation lists it for sale at a price
per kWh. A consumer browses the marketplace, buys some or all of that energy,
and the smart contract records the trade and transfers payment automatically.

**Important:** GridSwap does not physically move electricity through the
blockchain. Physical power still flows through the existing electrical grid.
The blockchain here is used purely for trade recording, transparent
transaction history, and automated payment settlement — see
[Limitations](#limitations) below.

## Features

- Wallet-based registration as a **Producer** or **Consumer**
- Producers can list, view, and cancel energy offers
- Consumers can browse the marketplace, filter/sort offers, and buy energy
- Automated cheapest-first offer matching for a requested energy amount
- Full on-chain trade history, per-user and platform-wide
- Dashboard with live stats, activity charts, and recent transactions
- Admin/grid-operator view with platform-wide analytics
- Analytics page: average price, supply vs. demand, producer activity
- Toast-based transaction feedback (pending / confirmed / failed)
- Realistic empty, loading, and error states throughout

## Architecture

```
MetaMask (signer) ──ethers.js──> React frontend ──JSON-RPC──> Hardhat local chain
                                                                 └── EnergyTrading.sol
```

There is no traditional backend. The frontend reads and writes directly
against the smart contract; a local JSON-RPC connection is used for
read-only marketplace data even before a wallet is connected.

## Technology Stack

**Frontend:** React, Vite, Tailwind CSS, React Router, ethers.js v6, Lucide
icons, Recharts

**Blockchain:** Solidity 0.8.24, Hardhat, OpenZeppelin (ReentrancyGuard),
local Hardhat network, MetaMask

## Folder Structure

```
gridswap/
├── contracts/
│   └── EnergyTrading.sol
├── scripts/
│   ├── compile-local.js   # solc-based compiler (see note below)
│   └── deploy.js
├── test/
│   └── EnergyTrading.test.js
├── frontend/
│   └── src/
│       ├── components/
│       ├── pages/
│       ├── hooks/
│       ├── context/
│       ├── utils/
│       └── contracts/     # ABI + address, written by deploy.js
├── hardhat.config.js
├── package.json
└── README.md
```

## Smart Contract

`EnergyTrading.sol` implements:

- **User registration** — `registerUser(role)`, one-time, Producer or Consumer
- **Energy offers** — `createEnergyOffer`, `cancelOffer`, `getOffer`,
  `getAllOffers`, `getUserOffers`
- **Purchasing** — `buyEnergy(offerId, amount)`, validates registration,
  role, offer state, and remaining energy, then settles payment and records
  a trade
- **Trade records** — `getTrade`, `getAllTrades`, `getUserTrades`
- **Events** — `UserRegistered`, `EnergyOfferCreated`, `EnergyPurchased`,
  `OfferCancelled`
- **Security** — `ReentrancyGuard` on `buyEnergy`, checks-effects-interactions
  ordering, and input validation throughout

Energy is stored on-chain in **Wh** (1 kWh = 1000 Wh) and price in **wei per
kWh**, so the frontend can freely convert to kWh / INR for display.

### A note on the compiler

This sandboxed dev environment blocks the network calls Hardhat's compiler
downloader normally makes to `binaries.soliditylang.org`. `npm run compile`
therefore uses `scripts/compile-local.js`, which compiles with the
locally-installed `solc` npm package (a self-contained WASM build) and writes
artifacts in Hardhat's exact format. Everything downstream — `hardhat test`,
`hardhat run`, `hardhat node` — works exactly as normal; only the compile
step is swapped out. **On a normal machine with unrestricted internet
access, you can use plain `npx hardhat compile` instead if you prefer** —
both produce equivalent artifacts.

## Local Blockchain Setup

You'll run three things in three separate terminals.

**Terminal 1 — start the local chain:**
```bash
npm install
npx hardhat node
```
This starts a local Ethereum node at `http://127.0.0.1:8545` (chain ID
`31337`) with 20 pre-funded test accounts.

**Terminal 2 — deploy the contract:**
```bash
npm run deploy:localhost
```
This compiles the contract, deploys `EnergyTrading` to your running node,
writes the ABI and deployed address into `frontend/src/contracts/`, and
seeds two demo offers from local test accounts so the marketplace isn't
empty on first load.

**Terminal 3 — run the frontend:**
```bash
cd frontend
npm install
npm run dev
```
Open the printed local URL (typically `http://localhost:5173`).

## MetaMask Setup

1. Install the [MetaMask](https://metamask.io) browser extension.
2. Add a network: **Network Name** `Hardhat Local`, **RPC URL**
   `http://127.0.0.1:8545`, **Chain ID** `31337`, **Currency Symbol** `ETH`.
3. Import a couple of the test accounts printed by `npx hardhat node` using
   their private keys, so you have separate accounts to test as a producer
   and a consumer.
4. Switch MetaMask to the Hardhat Local network before connecting.

## Installation

```bash
git clone <this repo>
cd gridswap
npm install
cd frontend && npm install
```

## Running the Project

See [Local Blockchain Setup](#local-blockchain-setup) above — three
terminals: node, deploy, frontend dev server.

## Deploying the Contract

```bash
npm run deploy:localhost
```
Re-run this any time you restart `npx hardhat node` (a fresh node has no
deployed contracts, and old ones won't exist at the same address if the
node's state was wiped).

## Running Tests

```bash
npm test
```
Runs the full Hardhat/Chai test suite (17 tests) covering registration,
offer creation, purchasing, cancellation, and access control.

## How Energy Trading Works

1. A producer registers, then lists surplus energy (e.g. 5 kWh at
   ₹6.20/kWh) as an offer.
2. A consumer registers, browses the marketplace, and either buys directly
   or uses **Find the cheapest way to buy energy** to get a cheapest-first
   recommendation across multiple offers for a target amount.
3. On purchase, the contract checks the offer is active and has enough
   remaining energy, calculates the total price, transfers payment to the
   seller, reduces the offer's remaining energy, and records a trade.
4. Both the buyer's and seller's dashboards, and the platform-wide admin and
   analytics views, update from the same on-chain data.

## Limitations

This project simulates energy trading and blockchain-based settlement. It
does **not** physically control or transfer electricity through the
blockchain — power still flows through the ordinary electrical grid, and
GridSwap has no connection to any real grid infrastructure. INR values shown
in the UI are a fixed demo conversion from the local chain's native currency
and do not reflect a real exchange rate or payment gateway.

A real deployment would additionally require:
- Integration with smart meters to verify actual generation/consumption
- Coordination with utilities and grid operators for physical settlement
- A regulatory framework for peer-to-peer energy trading
- A production blockchain deployment with real payment rails
- Identity verification tied to actual utility accounts
