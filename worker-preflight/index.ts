/**
 * Worker preflight + watch.
 *
 *   tsx index.ts preflight                       # run one real test inference
 *   tsx index.ts watch 0xWorkerAddr...           # stream status events
 *
 * Preflight needs PRIVATE_KEY with at least ~0.05 LCAI on the target
 * network. Watch is read-only (no key required).
 */
import { LightNode, workerPreflight, workerWatch, type NetworkId } from "lightnode-sdk";

const NETWORK = (process.env.NETWORK ?? "testnet") as NetworkId;
const cmd = process.argv[2];

async function preflight(): Promise<void> {
  const PRIVATE_KEY = process.env.PRIVATE_KEY as `0x${string}` | undefined;
  if (!PRIVATE_KEY?.startsWith("0x") || PRIVATE_KEY.length !== 66) {
    console.error("preflight: set PRIVATE_KEY=0x... in env");
    process.exit(1);
  }
  console.error(`> preflight against ${NETWORK} (model llama3-8b, deadline 60s)...`);
  const r = await workerPreflight({
    network: NETWORK,
    privateKey: PRIVATE_KEY,
    model: "llama3-8b",
    deadlineMs: 60_000,
  });
  console.log(JSON.stringify(
    {
      verdict: r.verdict,
      elapsedSec: Math.round(r.elapsedMs / 100) / 10,
      worker: r.worker,
      summary: r.summary,
      txs: r.txs,
    },
    null,
    2,
  ));
  if (r.verdict === "failed" || r.verdict === "stalled") process.exit(1);
}

async function watch(): Promise<void> {
  const addr = process.argv[3];
  if (!addr || !addr.startsWith("0x")) {
    console.error("usage: tsx index.ts watch 0xWorkerAddress... [--interval 30] [--stale 90]");
    process.exit(1);
  }
  const intervalArg = process.argv.includes("--interval")
    ? Number(process.argv[process.argv.indexOf("--interval") + 1])
    : 30;
  const staleArg = process.argv.includes("--stale")
    ? Number(process.argv[process.argv.indexOf("--stale") + 1])
    : 90;
  const ln = new LightNode(NETWORK);
  const handle = workerWatch(ln, addr, { intervalMs: intervalArg * 1000, staleSecs: staleArg });
  process.on("SIGINT", () => { handle.stop(); process.exit(0); });
  console.error(`> watching ${addr} on ${NETWORK} (every ${intervalArg}s, stale at ${staleArg}s). Ctrl+C to stop.`);
  for await (const event of handle.events) {
    console.log(JSON.stringify(event));
  }
}

const main =
  cmd === "preflight" ? preflight :
  cmd === "watch" ? watch :
  () => { console.log("usage: tsx index.ts <preflight|watch> [...]"); process.exit(1); };

main().catch((e) => {
  console.error("worker:", (e as Error).message);
  process.exit(1);
});
