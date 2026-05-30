# lightnode-examples

Runnable, copy-pasteable LightChain AI inference examples built on the
[`lightnode-sdk`](https://www.npmjs.com/package/lightnode-sdk).

This repo is **deliberately tiny** so cloud IDEs (StackBlitz, Codespaces) can
clone it in seconds. The SDK itself lives in
[marinom2/lightnode](https://github.com/marinom2/lightnode) along with the
worker app + the live network playground.

## Examples

| Folder | What it is | Runnable as-is? |
|---|---|---|
| [`quickstart-inference/`](./quickstart-inference) | One-shot encrypted prompt → answer. ~30 lines using `runInferenceWithKey`. Auto-bootstraps a testnet key on first run. | **Yes.** `npm install && npm start`. Also: [Open in StackBlitz](https://stackblitz.com/github/marinom2/lightnode-examples/tree/main/quickstart-inference). |
| [`nextjs-api-route/`](./nextjs-api-route) | Next.js App Router API route. Drop `route.ts` into `app/api/inference/route.ts` of your own Next.js app. | Snippet (copy into your existing app). |
| [`hono-server/`](./hono-server) | Hono server. Drop `server.ts` into a Cloudflare Worker / Bun / Node project. | Snippet (copy into your existing app). |

## Quickstart

```bash
git clone https://github.com/marinom2/lightnode-examples
cd lightnode-examples/quickstart-inference
npm install
npm start
```

On the first run, `quickstart-inference` generates a fresh testnet key and
writes it to `.env`, then prints the funded-address-+-faucet URL. Send the
address some free testnet LCAI at <https://lightfaucet.ai>, then `npm start`
again to fire one real encrypted inference.

## Get LCAI

- **Testnet** (free): <https://lightfaucet.ai>
- **Mainnet** (real LCAI): bridge from Ethereum at <https://bridge.lightchain.ai>

## Docs

- Full SDK + API surface: <https://github.com/marinom2/lightnode/tree/main/sdk>
- Live in-browser playground: <https://lightnode.app/playground>
- Builder hub: <https://lightnode.app/build>

## License

MIT.
