/**
 * End-to-end encrypted LightChain AI inference, in ~30 lines, using
 * `runInferenceWithKey()` - the SDK's key-in / answer-out shortcut.
 *
 * Three ways to run:
 *
 *   npm start                       # uses .env's PRIVATE_KEY (or auto-generates)
 *   npm start --key 0x...           # one-shot, no .env edit needed
 *   PRIVATE_KEY=0x... npm start     # also works (npm forwards env)
 *
 * Same proof chain (createSession, submitJob, jobCompleted) as the live
 * playground at https://lightnode.app/playground.
 */
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import WS from "ws";
import { createPublicClient, http, parseEther } from "viem";
import { privateKeyToAccount, generatePrivateKey } from "viem/accounts";
import { runInferenceWithKey, isStalledWorker, LightNode, SDK_VERSION, type NetworkId } from "lightnode-sdk";

const NETWORK = (process.env.NETWORK ?? "testnet") as NetworkId;
const MODEL = process.env.MODEL ?? "llama3-8b";

// `npm start --key 0x...` and `npm start "your prompt"` are both supported.
// The `--key` flag is consumed and removed; whatever is left becomes the prompt.
const rawArgs = process.argv.slice(2);
const argv: string[] = [];
let keyFromFlag: string | undefined;
for (let i = 0; i < rawArgs.length; i++) {
  if (rawArgs[i] === "--key" && rawArgs[i + 1]) {
    keyFromFlag = rawArgs[i + 1];
    i++;
  } else {
    argv.push(rawArgs[i]);
  }
}
const PROMPT = argv.join(" ").trim() || "Reply with a one-sentence fun fact about the ocean.";

// Auto-load .env (no dotenv dep). `npm start` in StackBlitz / Codespaces
// doesn't source .env via the shell, so without this PRIVATE_KEY would always
// read as undefined.
if (existsSync(".env")) {
  for (const line of readFileSync(".env", "utf8").split("\n")) {
    const m = line.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*?)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
}

// True when the runtime is StackBlitz / Bolt / a Node-in-browser shim. Used to
// tailor the banners: in WebContainer the workspace is ephemeral and the
// faucet is rate-limited per IP, so "auto-generate a fresh key every run"
// is a UX trap. Warn loudly and steer the operator toward paste-your-own-key.
const IN_WEBCONTAINER =
  !!(globalThis as { process?: { versions?: Record<string, string> } }).process?.versions?.webcontainer ||
  /StackBlitz|webcontainer/i.test(process.env.SHELL ?? "") ||
  /stackblitz/i.test(process.env.HOSTNAME ?? "");

// Priority order for the working private key: --key flag, env var, .env file.
let PRIVATE_KEY = (keyFromFlag ?? process.env.PRIVATE_KEY) as `0x${string}` | undefined;
const looksValid = PRIVATE_KEY?.startsWith("0x") && PRIVATE_KEY.length === 66 && !/^0x0+$/i.test(PRIVATE_KEY);

if (!looksValid) {
  // Auto-generate path. In StackBlitz this is a UX trap because the workspace
  // is ephemeral and lightfaucet.ai is 2 LCAI per IP per day, so a freshly
  // generated key may not be fundable. We still generate one (so the example
  // is runnable for someone who has spare faucet quota), but loudly point at
  // the better path.
  const fresh = generatePrivateKey();
  const addr = privateKeyToAccount(fresh).address;
  const lines = existsSync(".env") ? readFileSync(".env", "utf8").split("\n") : [];
  const filtered = lines.filter((l) => !/^\s*PRIVATE_KEY\s*=/.test(l));
  filtered.push(`PRIVATE_KEY=${fresh}`);
  writeFileSync(".env", filtered.join("\n").replace(/\n+$/, "") + "\n");
  console.log("");
  console.log("=".repeat(72));
  console.log("  No PRIVATE_KEY was set. A fresh testnet key was generated:");
  console.log("");
  console.log(`    Address:     ${addr}`);
  console.log(`    Private key: ${fresh}`);
  console.log("");
  if (IN_WEBCONTAINER) {
    console.log("  IMPORTANT - you are running in StackBlitz / a cloud IDE:");
    console.log("");
    console.log("  - The faucet at https://lightfaucet.ai is rate-limited to about");
    console.log("    2 LCAI per IP per day. If you have already requested today,");
    console.log("    funding this fresh address may fail.");
    console.log("  - This workspace is ephemeral. When you close this tab the");
    console.log("    private key above is GONE, and any LCAI you funded is");
    console.log("    stranded (no real loss on testnet, but the demo will keep");
    console.log("    asking you to re-fund).");
    console.log("");
    console.log("  Recommended: COPY the private key above, save it locally, and");
    console.log("  pass it on the next run instead of letting a new one generate:");
    console.log("");
    console.log("      npm start --key 0x...");
    console.log("");
    console.log("  Or paste it into the .env file on the left so this workspace");
    console.log("  reuses it across runs.");
  } else {
    console.log("  To fund and run:");
    console.log("    1. Open https://lightfaucet.ai");
    console.log("    2. Paste the address above and request free testnet LCAI");
    console.log("    3. Run `npm start` again");
    console.log("");
    console.log("  .env is gitignored. The key persists on this disk across runs.");
  }
  console.log("=".repeat(72));
  console.log("");
  process.exit(0);
}

// Quick balance check so the error is helpful instead of "createSession reverted".
const ln = new LightNode(NETWORK);
const account = privateKeyToAccount(PRIVATE_KEY as `0x${string}`);
const pub = createPublicClient({ transport: http(ln.network.rpc) });
const balance = await pub.getBalance({ address: account.address });
console.log(`> lightnode-sdk v${SDK_VERSION} network=${NETWORK} ${account.address} balance=${Number(balance) / 1e18} LCAI`);
if (balance < parseEther("0.05")) {
  console.error("");
  console.error(`  Wallet ${account.address} has too little LCAI to run one job (need ~0.05).`);
  if (NETWORK === "testnet") {
    console.error(`  Get free testnet LCAI: https://lightfaucet.ai`);
    if (IN_WEBCONTAINER) {
      console.error("");
      console.error("  Hit the faucet's daily cap? Run with a key you already funded:");
      console.error("    npm start --key 0x<your_funded_testnet_key>");
    }
  } else {
    console.error(`  Top up the address on mainnet (chain ${ln.network.chainId}).`);
  }
  console.error("");
  process.exit(1);
}

// ============================================================================
// THE ACTUAL CALL. This is everything; the rest of the file is just the
// "make StackBlitz / Codespaces / fresh-clone friendly" plumbing above.
// ============================================================================
try {
  process.stdout.write("\n");
  const { answer, txs, worker, sessionId, jobId, attempts, stalled } = await runInferenceWithKey({
    network: NETWORK,
    privateKey: PRIVATE_KEY as `0x${string}`,
    prompt: PROMPT,
    model: MODEL,
    WebSocket: WS, // omit this whole line in the browser
    onChunk: (chunk) => process.stdout.write(chunk),
  });
  process.stdout.write("\n\n");
  console.log(`answer:        ${answer.length} chars`);
  console.log(`createSession: ${txs.createSession}`);
  console.log(`submitJob:     ${txs.submitJob}`);
  console.log(`jobCompleted:  ${txs.jobCompleted ?? "(pending on-chain; answer above is session-key authentic)"}`);
  console.log(`sessionId=${sessionId} jobId=${jobId} worker=${worker} attempts=${attempts}`);
  if (stalled.length) console.log(`(${stalled.length} prior attempt(s) stalled; protocol refunds those fees automatically)`);
  process.exit(0);
} catch (e) {
  if (isStalledWorker(e)) console.error("3 workers in a row stalled; protocol refunds the fees, try again later");
  else console.error("inference failed:", (e as Error).message);
  process.exit(1);
}
