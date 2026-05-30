/**
 * Multi-turn chat: an interactive REPL where each message runs one real
 * encrypted inference, history stays in the SDK, and the model sees prior
 * turns. Each turn is paid (one createSession + one submitJob).
 *
 * Run:
 *   npm install
 *   PRIVATE_KEY=0x... npm start
 *
 * Or in StackBlitz: paste a key into .env first, then npm start. The first
 * run prints address + faucet link if no key is set.
 */
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { createInterface } from "node:readline";
import { Conversation, type NetworkId, SDK_VERSION } from "lightnode-sdk";
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";

const NETWORK = (process.env.NETWORK ?? "testnet") as NetworkId;
const MODEL = process.env.MODEL ?? "llama3-8b";

// Load .env so PRIVATE_KEY is available in REPL-style runs.
if (existsSync(".env")) {
  for (const line of readFileSync(".env", "utf8").split("\n")) {
    const m = line.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*?)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
}

let PRIVATE_KEY = process.env.PRIVATE_KEY as `0x${string}` | undefined;
const looksValid = PRIVATE_KEY?.startsWith("0x") && PRIVATE_KEY.length === 66;
if (!looksValid) {
  const fresh = generatePrivateKey();
  const addr = privateKeyToAccount(fresh).address;
  writeFileSync(".env", `PRIVATE_KEY=${fresh}\n`);
  console.log(`\nNo PRIVATE_KEY was set. A fresh testnet key was generated:\n`);
  console.log(`  Address: ${addr}`);
  console.log(`  Faucet:  https://lightfaucet.ai\n`);
  console.log(`Fund the address, then run npm start again.\n`);
  process.exit(0);
}

console.log(`> lightnode-sdk v${SDK_VERSION} | multi-turn chat | network=${NETWORK} | model=${MODEL}`);
console.log(`> Type a prompt and hit enter. Type /reset to clear history. Ctrl+C to exit.\n`);

const chat = new Conversation({
  network: NETWORK,
  privateKey: PRIVATE_KEY as `0x${string}`,
  model: MODEL,
  // Optional system prompt: persona, response style, guardrails.
  system: "You are a concise assistant. Reply in one or two sentences.",
  // Cap the rolling window so very long sessions do not blow up the prompt size.
  maxHistoryTurns: 20,
});

const rl = createInterface({ input: process.stdin, output: process.stdout });
const prompt = () => rl.question("you> ", handler);

async function handler(line: string) {
  const text = line.trim();
  if (!text) return prompt();
  if (text === "/reset") {
    chat.reset();
    console.log("(history cleared)\n");
    return prompt();
  }
  if (text === "/history") {
    console.log(JSON.stringify(chat.messages(), null, 2));
    return prompt();
  }
  process.stdout.write("ai>  ");
  try {
    const result = await chat.send(text);
    // The reply is already returned; print a one-liner receipt afterwards.
    process.stdout.write(result.answer + "\n");
    process.stderr.write(
      `(jobId=${result.jobId} worker=${result.worker.slice(0, 8)}... attempts=${result.attempts})\n\n`,
    );
  } catch (e) {
    process.stderr.write(`\n[error] ${(e as Error).message}\n\n`);
  }
  prompt();
}

prompt();
