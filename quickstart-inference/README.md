# lightchain-quickstart-inference

A tiny starter for **end-to-end encrypted inference** on LightChain AI using
[`lightnode-sdk`](https://www.npmjs.com/package/lightnode-sdk). Non-custodial:
your wallet signs the on-chain calls, the SDK does the rest. Same code path the
[live playground](https://lightnode.app/playground) drives.

## Run it (under a minute)

```bash
npm install
npm start
```

The first run prints something like this and exits:

```
  No PRIVATE_KEY was set. A fresh testnet key was generated:
    Address:     0x1234abcd...
    Private key: 0x...

  To fund and run:
    1. Open https://lightfaucet.ai
    2. Paste the address above and request free testnet LCAI
    3. Run `npm start` again
```

Open <https://lightfaucet.ai>, paste the address, request free testnet LCAI,
then run `npm start` again. This time it fires one real encrypted inference and
prints the decrypted answer plus three transaction hashes.

### Already have a funded testnet key?

If you already funded a key on a previous run (or in a previous cloud-IDE
workspace), pass it directly so the example does not generate a new one:

```bash
npm start --key 0x<your_funded_testnet_key>
```

This is the recommended path in cloud IDEs like StackBlitz where the workspace
is ephemeral. The faucet at <https://lightfaucet.ai> is rate-limited (about
2 LCAI per IP per day), so generating a fresh key in every workspace will
eventually hit the cap.

For a custom prompt:

```bash
npm start "What is the colour of the sky?"
```

For mainnet (real LCAI):

```bash
NETWORK=mainnet npm start "your prompt"
```

Cost on mainnet: about 0.022 LCAI per call (0.02 worker fee plus a tiny bit
of gas). Free on testnet.

## What the example does

Under the hood, `runInferenceWithKey` from the SDK runs nine steps:

| Step | What |
| --- | --- |
| 1 | SIWE handshake against the consumer gateway (sign challenge, get JWT). |
| 2 | ECDH-P256 handshake with the gateway, derive a session key. |
| 3 | AES-GCM encrypt your prompt. Workers never see plaintext. |
| 4 | `prepareSession`: pick a worker, wrap the session key, get dispatcher signature. |
| 5 | `createSession` on chain (signed by your wallet, no LCAI value). |
| 6 | Open the relay WebSocket. |
| 7 | `submitJob` on chain, paying the per-call fee in LCAI. |
| 8 | Decrypt each relay frame as it streams in. |
| 9 | Wait for the on-chain `JobCompleted` commit (the third proof). |

Before `lightnode-sdk@0.4.3` you wrote all of that yourself, around 100 lines
of viem + crypto + WebSocket glue. Now: 5 lines.

## Files

| File | What |
| --- | --- |
| `index.ts` | The full flow. Read top to bottom. |
| `package.json` | Three runtime deps: `lightnode-sdk`, `viem`, `ws`. |
| `tsconfig.json` | Node ESM with `tsx`. |
| `.env.example` | A funded `PRIVATE_KEY`. Auto-generated on first run if missing. |

## Where this fits

- npm package: <https://www.npmjs.com/package/lightnode-sdk>
- SDK source: <https://github.com/marinom2/lightnode/tree/main/sdk>
- Live playground (browser, wallet-connect): <https://lightnode.app/playground>
- Builder hub: <https://lightnode.app/build>

## Stalled-worker handling

A small percentage of workers acknowledge a job and never produce a result.
`runInferenceWithKey` retries automatically (up to 2 retries by default, so 3
paid attempts total), each on a different worker. The protocol times out
stalled workers after the dispute window and refunds the fee to your wallet.

## License

MIT.
