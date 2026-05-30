/**
 * Read + vote on LCAI Governor proposals (Ethereum mainnet).
 *
 *   tsx index.ts config                            # voting delay/period/threshold (live)
 *   tsx index.ts proposal <proposalId>             # state + votes + key blocks
 *   tsx index.ts vote <proposalId> <for|against|abstain> ["reason"]
 *
 * Reading is free (no key). Voting needs PRIVATE_KEY with LCAI voting power
 * delegated to your own address (call LCAIBallots.delegate(self) at least
 * once on Etherscan before voting).
 */
import { DAO, VoteSupport, PROPOSAL_STATE_LABEL } from "lightnode-sdk";
import { createPublicClient, createWalletClient, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";

const ETH_RPC = process.env.ETH_RPC ?? "https://ethereum-rpc.publicnode.com";
const PRIVATE_KEY = process.env.PRIVATE_KEY as `0x${string}` | undefined;
const cmd = process.argv[2];

const pub = createPublicClient({ transport: http(ETH_RPC) });

function getDao(forWrites: boolean): DAO {
  if (forWrites) {
    if (!PRIVATE_KEY?.startsWith("0x") || PRIVATE_KEY.length !== 66) {
      console.error("set PRIVATE_KEY=0x... in env to cast votes / propose");
      process.exit(1);
    }
    const account = privateKeyToAccount(PRIVATE_KEY);
    const wal = createWalletClient({ account, transport: http(ETH_RPC) });
    return new DAO(
      pub as unknown as ConstructorParameters<typeof DAO>[0],
      "ethereum",
      wal as unknown as ConstructorParameters<typeof DAO>[2],
    );
  }
  return new DAO(pub as unknown as ConstructorParameters<typeof DAO>[0], "ethereum");
}

async function config(): Promise<void> {
  const dao = getDao(false);
  const cfg = await dao.config();
  console.log(JSON.stringify(
    {
      addresses: dao.addresses,
      votingDelayBlocks: cfg.votingDelayBlocks.toString(),
      votingPeriodBlocks: cfg.votingPeriodBlocks.toString(),
      votingPeriodSecs: cfg.votingPeriodSecs,
      proposalThresholdLcai: Number(cfg.proposalThresholdWei) / 1e18,
    },
    null,
    2,
  ));
}

async function proposal(): Promise<void> {
  const id = process.argv[3];
  if (!id) { console.error("usage: tsx index.ts proposal <proposalId>"); process.exit(1); }
  const dao = getDao(false);
  const p = await dao.proposal(BigInt(id));
  console.log(JSON.stringify(
    {
      id: p.id.toString(),
      state: p.stateLabel,
      proposer: p.proposer,
      snapshot: p.snapshot.toString(),
      deadline: p.deadline.toString(),
      eta: p.eta.toString(),
      votes: {
        forLcai: Number(p.votes.forWei) / 1e18,
        againstLcai: Number(p.votes.againstWei) / 1e18,
        abstainLcai: Number(p.votes.abstainWei) / 1e18,
      },
      stateLabels: PROPOSAL_STATE_LABEL,
    },
    null,
    2,
  ));
}

async function vote(): Promise<void> {
  const id = process.argv[3];
  const dir = (process.argv[4] ?? "").toLowerCase();
  const reason = process.argv[5];
  if (!id || !["for", "against", "abstain"].includes(dir)) {
    console.error('usage: tsx index.ts vote <proposalId> <for|against|abstain> ["reason"]');
    process.exit(1);
  }
  const support = dir === "for" ? VoteSupport.For : dir === "against" ? VoteSupport.Against : VoteSupport.Abstain;
  const dao = getDao(true);
  const tx = await dao.castVote(BigInt(id), support, reason);
  console.log(JSON.stringify({ tx: `https://etherscan.io/tx/${tx}`, proposalId: id, direction: dir }, null, 2));
}

const main =
  cmd === "config" ? config :
  cmd === "proposal" ? proposal :
  cmd === "vote" ? vote :
  () => { console.log("usage: tsx index.ts <config|proposal|vote> [...]"); process.exit(1); };

main().catch((e) => {
  console.error("dao failed:", (e as Error).message.split("\n")[0]);
  process.exit(1);
});
