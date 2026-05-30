# Worker preflight + watch

Two operational utilities for the LightChain AI network:

- **Preflight** submits ONE real encrypted inference against the live network
  and reports a verdict (`ok` / `over-deadline` / `stalled` / `failed`).
  Useful as a CI gate ("did the wallet survive a real call this deploy?") or
  as a pre-join health check.
- **Watch** polls one worker's on-chain + indexer status on a fixed interval
  and emits an event each time the status meaningfully changes.

Both use `lightnode-sdk` so they run from any machine, no SSH, no Docker.

## Preflight

```bash
export PRIVATE_KEY=0x...   # needs ~0.05 LCAI on the network
NETWORK=testnet npm run preflight
```

Output (success):

```json
{
  "verdict": "ok",
  "elapsedSec": 9.4,
  "worker": "0xabc...",
  "summary": "OK in 9.4s. Worker 0xabc... replied with 14 chars.",
  "txs": {
    "createSession": "0x...",
    "submitJob":     "0x...",
    "jobCompleted":  "0x..."
  }
}
```

Exits non-zero on `stalled` or `failed` so CI catches it.

## Watch

No key required. Watches a specific worker address:

```bash
NETWORK=mainnet npm run watch 0xWorker...                       # 30s interval, 90s stale window
NETWORK=mainnet npm run watch 0xWorker... -- --interval 60      # poll every 60s
NETWORK=mainnet npm run watch 0xWorker... -- --stale 120        # mark stale after 120s
```

Each line of stdout is one event JSON:

```json
{"kind":"snapshot","at":1730000000000,"worker":"0x...","network":"mainnet","state":{"registered":true,"lastSeenSecsAgo":12,"jobsCompleted":4321,"earningsLcai":201.4,"activeJobs":2,"isStale":false}}
{"kind":"jobs-completed","at":1730000030000,"worker":"0x...","network":"mainnet","state":{...}}
{"kind":"went-stale","at":1730000300000,"worker":"0x...","network":"mainnet","state":{...}}
```

Event kinds: `snapshot` (first poll), `registered`, `deregistered`,
`went-stale`, `back-online`, `jobs-completed`, `earnings-up`.

## Pipe to a webhook or alerting

```bash
NETWORK=mainnet npm run watch 0xWorker... | while read line; do
  case "$line" in
    *went-stale*)
      curl -X POST -H 'content-type: application/json' \
        -d "{\"text\":\"worker stale: $line\"}" "$DISCORD_WEBHOOK"
      ;;
  esac
done
```
