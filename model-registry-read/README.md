# On-chain Model Registry reader

Reads the AIVMModelRegistry + BenchmarkRegistry contracts through
`lightnode-sdk`'s `OnchainModelRegistry` class. Pure read-only, no key
required.

## Important: bring your own address

As of SDK 0.5.x, LightChain has not published a public deployment address
for these contracts. You must supply the deployed address via env:

```bash
export REGISTRY=0xAIVMModelRegistry...
export BENCHMARKS=0xBenchmarkRegistry...   # optional, only for benchmark methods
export RPC=https://rpc.mainnet.lightchain.ai
```

Once an official deployment exists, the SDK will gain a `network: "mainnet"`
default and these env vars become optional.

## Commands

```bash
npm install

# Every base model id + every variant id on the registry
npm start -- list

# Full base-model record + every variant whose parentModelId matches
npm start -- base <baseModelId>

# One variant's record + access policy (free / paywalled / ticket-gated)
npm start -- variant <variantId>

# Benchmark ids (requires BENCHMARKS env)
npm start -- benchmarks
```

## What this exposes

The SDK wraps the OZ-style structs and surfaces a `tier` heuristic on
`AccessPolicyConfig`:

```ts
{
  requireTicket: false,
  minStakeRequiredWei: 0n,
  ticketManager: "0x0...",
  ticketTtlSecs: 0n,
  tier: "free"        // "free" | "paywalled" | "ticket-gated"
}
```

For `ModelVariant.status`, the SDK exposes `MODEL_STATUS_LABEL` so you can
render `"finalized"` instead of `4`.
