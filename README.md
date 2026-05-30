# lightnode-examples

Runnable, copy-pasteable LightChain AI inference examples built on the
[`lightnode-sdk`](https://www.npmjs.com/package/lightnode-sdk).

This repo is **deliberately tiny** so cloud IDEs (StackBlitz, Codespaces) can
clone it in seconds. The SDK source and the rest of the project live in
[marinom2/lightnode](https://github.com/marinom2/lightnode).

## Pick the example that matches your project

| If you have... | Open this | What you get |
| --- | --- | --- |
| A blank terminal and you just want to feel the SDK work | [`quickstart-inference/`](./quickstart-inference) | A 30-line Node script. Auto-generates a testnet key on first run and tells you where to fund it. |
| A Next.js app (App Router) and want a server-side AI endpoint | [`nextjs-api-route/`](./nextjs-api-route) | Drop `route.ts` into `app/api/inference/route.ts`, POST a prompt, get a JSON answer back. Wallet stays on the server. |
| Any other Node project (Cloudflare Workers, Bun, a CLI, a Discord bot, an AWS Lambda) | [`hono-server/`](./hono-server) | A Hono server with the same JSON contract as the Next.js route. Deploys anywhere Hono runs. |

If your project is none of those, the quickstart is the cleanest reference. The
main flow is one call (`runInferenceWithKey`), the rest of the file is just
boilerplate around it.

## Quickstart

```bash
git clone https://github.com/marinom2/lightnode-examples
cd lightnode-examples/quickstart-inference
npm install
npm start
```

The first `npm start` generates a fresh testnet key, writes it to `.env`,
prints the funded-address-plus-faucet flow, and exits. Send the address some
free testnet LCAI at <https://lightfaucet.ai>, then `npm start` again to run
one real encrypted inference.

## Get LCAI

- Testnet (free): <https://lightfaucet.ai>
- Mainnet (real LCAI): bridge from Ethereum at <https://bridge.lightchain.ai>

## Docs

- Full SDK and API surface: <https://github.com/marinom2/lightnode/tree/main/sdk>
- Live in-browser playground: <https://lightnode.app/playground>
- Builder hub: <https://lightnode.app/build>

## License

MIT.
