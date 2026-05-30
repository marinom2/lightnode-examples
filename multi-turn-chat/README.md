# Multi-turn chat

An interactive REPL where each message runs one real encrypted LightChain AI
inference, but the model sees the full conversation history. Built on
`lightnode-sdk`'s `Conversation` class.

```bash
npm install
PRIVATE_KEY=0x... npm start
```

Or in a cloud IDE: `npm start` once to auto-generate a testnet key and print
the funding instructions, fund it, then `npm start` again.

```
> lightnode-sdk v0.5.1 | multi-turn chat | network=testnet | model=llama3-8b
you> Who wrote The Great Gatsby?
ai>  F. Scott Fitzgerald.
you> In what year?
ai>  1925.
you> Why is the green light significant?
ai>  It represents Gatsby's hopes and the American Dream's elusive nature.
```

Commands:
- `/reset` clear history (next turn starts fresh)
- `/history` dump the current transcript as JSON
- `Ctrl+C` exit

## How it works

The protocol's session model is single-turn (one `createSession` plus one
`submitJob` per inference), so each `chat.send(message)` runs the full flow
under the hood. The SDK keeps history client-side and serializes it as the
prompt, prefixing your `system` message if you set one.

Each turn:
1. Costs about 0.022 LCAI on mainnet (free on testnet).
2. Returns a fresh `jobId`, `worker`, and on-chain receipts.
3. Updates `chat.messages()` so a UI can render the transcript.

## Customize

In `index.ts`:

```ts
const chat = new Conversation({
  network: NETWORK,
  privateKey: PRIVATE_KEY,
  model: MODEL,
  system: "You are a concise assistant. Reply in one or two sentences.",
  maxHistoryTurns: 20, // rolling window so prompt size stays sane
});
```
