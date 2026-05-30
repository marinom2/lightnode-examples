# Bridge LCAI: Ethereum mainnet <-> LightChain mainnet

A small Node script that wraps `lightnode-sdk`'s `Bridge` class to move LCAI
across the Hyperlane Warp Route between Ethereum (chain 1) and LightChain
mainnet (chain 9200).

## Install

```bash
npm install
export PRIVATE_KEY=0x...   # same key signs on both chains
```

## Quote fees in both directions

```bash
npm run quote
```

Prints the Hyperlane gas-payment quotes (in source-chain gas tokens) for each
direction. Eth->LC costs ETH; LC->Eth costs LCAI.

## Ethereum to LightChain (deposit)

One-time ERC-20 approval (MaxUint256 by default so you only need it once):

```bash
npm run approve
```

Bridge an amount of LCAI:

```bash
npm run deposit 100               # 100 LCAI to your own address on LightChain
npm run deposit 100 -- --to 0x... # 100 LCAI to a different recipient
```

## LightChain to Ethereum (withdraw)

No approval needed (LCAI is native on LightChain; the script attaches it as
value):

```bash
npm run withdraw 100              # 100 LCAI back to your Ethereum address
npm run withdraw 100 -- --to 0x... # to a different recipient
```

## What the script does

1. Reads `BRIDGE_ROUTE` from the SDK to get the router + mailbox addresses
   on both chains (`HypERC20Collateral` on Eth, `HypNative` on LightChain).
2. Builds viem `PublicClient` + `WalletClient` for each side.
3. Calls `bridge.quoteFee(from, to)` for the Hyperlane gas payment.
4. For Ethereum->LightChain: `approve(router, MaxUint256)` once, then
   `transferRemote(9200, recipient, amount)` with `value=fee`.
5. For LightChain->Ethereum: `transferRemote(1, recipient, amount)` with
   `value=amount+fee` (HypNative takes native LCAI as the bridged amount).

The recipient is padded to bytes32 internally via the SDK's
`addressToBytes32` helper.

## Confirmed addresses (from `lightnode-sdk` 0.5.x)

| Side | Role | Address |
|------|------|---------|
| Ethereum (1) | HypERC20Collateral | `0x01f80bb8e78e79881E8Ec7832fB6C2c59f64e353` |
| Ethereum (1) | LCAI ERC-20 | `0x9cA8530CA349c966Fe9ef903Df17a75B8A778927` |
| LightChain (9200) | HypNative | `0xEc7096A3116EE769457C939617375Ec1785AA6f1` |

These live in `BRIDGE_ROUTE` exported from the SDK so you never hardcode them.
