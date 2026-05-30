# lightnode-examples

Runnable, copy-pasteable LightChain AI examples built on
[`lightnode-sdk`](https://www.npmjs.com/package/lightnode-sdk).

This repo is **deliberately tiny** so cloud IDEs (StackBlitz, Codespaces) can
clone it in seconds. The SDK source and the rest of the project live in
[marinom2/lightnode](https://github.com/marinom2/lightnode).

## Pick by what you want to build

### Inference (paid encrypted AI calls)

| Folder | What | Open it |
|---|---|---|
| [`quickstart-inference/`](./quickstart-inference) | 30-line Node script. Auto-generates a testnet key on first run; supports `--key 0x...` to reuse one. | [StackBlitz](https://stackblitz.com/github/marinom2/lightnode-examples/tree/main/quickstart-inference) |
| [`multi-turn-chat/`](./multi-turn-chat) | Interactive terminal chat. Uses the SDK's `Conversation` class so the model sees prior turns. | [StackBlitz](https://stackblitz.com/github/marinom2/lightnode-examples/tree/main/multi-turn-chat) |
| [`nextjs-api-route/`](./nextjs-api-route) | Drop `route.ts` into `app/api/inference/route.ts`. POST a prompt, get JSON back. Wallet stays on the server. | snippet |
| [`hono-server/`](./hono-server) | Hono `/inference` endpoint. Same shape as Next.js, runs on Bun / Cloudflare Workers / Node. | snippet |

### Operator / network ops

| Folder | What | Needs |
|---|---|---|
| [`worker-preflight/`](./worker-preflight) | `preflight` runs one real test inference and reports verdict. `watch <addr>` streams worker status events. | PRIVATE_KEY for preflight; none for watch |

### Ecosystem (bridge, governance, model registry)

| Folder | What | Needs |
|---|---|---|
| [`bridge-transfer/`](./bridge-transfer) | Bridge LCAI between Ethereum mainnet and LightChain mainnet (Hyperlane Warp Route). Quote, approve, deposit, withdraw. | PRIVATE_KEY |
| [`dao-vote/`](./dao-vote) | Read LCAI Governor proposals and cast votes (For / Against / Abstain). | PRIVATE_KEY for votes; none for reads |
| [`model-registry-read/`](./model-registry-read) | Read AIVMModelRegistry + BenchmarkRegistry. List models, variants, access policies. | Registry contract address (BYO) |

## Quickstart

```bash
git clone https://github.com/marinom2/lightnode-examples
cd lightnode-examples/quickstart-inference
npm install
npm start
```

The first `npm start` generates a fresh testnet key, writes it to `.env`, and
tells you where to fund it. Send the address some free testnet LCAI at
<https://lightfaucet.ai>, then `npm start` again to fire one real encrypted
inference.

## Common env

| Var | Default | Used by |
|---|---|---|
| `PRIVATE_KEY` | none | Inference, bridge, dao-vote, preflight |
| `NETWORK` | `testnet` | Inference, chat, preflight |
| `MODEL` | `llama3-8b` | Inference, chat |
| `ETH_RPC` | `https://ethereum-rpc.publicnode.com` | dao-vote |
| `REGISTRY` / `BENCHMARKS` / `RPC` | none / none / mainnet | model-registry-read |

## Get LCAI

- Testnet (free): <https://lightfaucet.ai>
- Mainnet: bridge from Ethereum at <https://bridge.lightchain.ai>, or use the `bridge-transfer/` example here.

## Docs

- SDK source: <https://github.com/marinom2/lightnode/tree/main/sdk>
- Live in-browser playground: <https://lightnode.app/playground>
- Builder hub: <https://lightnode.app/build>

## License

MIT.
