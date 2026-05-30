# DAO: read + vote on LCAI Governor proposals

A small Node script that wraps `lightnode-sdk`'s `DAO` class to read proposals
and cast votes on the LCAIGovernor (OpenZeppelin Governor v5 on Ethereum
mainnet).

## Install

```bash
npm install
```

Reading is free. Voting needs a key with delegated LCAI voting power.

## Read voting config

```bash
npm run config
```

Prints addresses + the live voting delay (~1 day), voting period (~14 days),
and proposal threshold (~140k LCAI).

## Read a proposal

```bash
npm run proposal -- 12345
```

Prints state + for/against/abstain tallies + proposer + key blocks. State
labels: `pending`, `active`, `canceled`, `defeated`, `succeeded`, `queued`,
`expired`, `executed`.

## Cast a vote

First-time only: delegate your LCAI voting power to yourself on Etherscan
by calling `LCAIBallots.delegate(self)` at the address printed by
`npm run config` (the `ballots` field). Without delegation your weight is
zero.

```bash
export PRIVATE_KEY=0x...
npm run vote -- 12345 for "I support this proposal because..."
npm run vote -- 12345 against
npm run vote -- 12345 abstain
```

Returns a transaction hash on Etherscan.

## Other ops the SDK supports

| Op | SDK call |
|----|----------|
| `dao.propose({ targets, values, calldatas, description })` | Requires >= 140k LCAI delegated. |
| `dao.queue({ targets, values, calldatas, descriptionHash })` | Move a Succeeded proposal into the timelock. |
| `dao.execute({ targets, values, calldatas, descriptionHash })` | After the timelock delay (24h typical), execute. Pass `value = sum(values)`. |
| `dao.hasVoted(id, addr)` | Check whether a wallet already voted. |
| `dao.getVotes(addr, snapshotBlock)` | Read a wallet's voting weight at the proposal's snapshot. |
| `dao.quorum(timepoint)` | Read the quorum (3% of supply by default). |

See the `lightnode-sdk` README's DAO section for the propose/queue/execute
shape.
