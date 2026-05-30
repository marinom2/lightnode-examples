/**
 * Read AIVMModelRegistry + BenchmarkRegistry through `lightnode-sdk`'s
 * `OnchainModelRegistry` class. As of SDK 0.5.x, LightChain has not
 * published a public deployment address; pass yours via env or flags.
 *
 *   REGISTRY=0x... BENCHMARKS=0x... RPC=https://... tsx index.ts list
 *   REGISTRY=0x... RPC=https://... tsx index.ts variant <variantId>
 *
 * Read-only, no key required.
 */
import { OnchainModelRegistry, MODEL_STATUS_LABEL } from "lightnode-sdk";
import { createPublicClient, http } from "viem";

const REGISTRY = process.env.REGISTRY as `0x${string}` | undefined;
const BENCHMARKS = process.env.BENCHMARKS as `0x${string}` | undefined;
const RPC = process.env.RPC ?? "https://rpc.mainnet.lightchain.ai";

if (!REGISTRY?.startsWith("0x") || REGISTRY.length !== 42) {
  console.error("set REGISTRY=0x... (AIVMModelRegistry contract address)");
  process.exit(1);
}

const pub = createPublicClient({ transport: http(RPC) });
const reader = new OnchainModelRegistry({
  publicClient: pub as unknown as ConstructorParameters<typeof OnchainModelRegistry>[0]["publicClient"],
  registry: REGISTRY,
  benchmarks: BENCHMARKS,
});

const cmd = process.argv[2];

async function listAll(): Promise<void> {
  const [baseIds, allVariants] = await Promise.all([reader.getBaseModelIds(), reader.getAllVariants()]);
  console.log(JSON.stringify({ baseModels: baseIds, variants: allVariants }, null, 2));
}

async function getVariant(): Promise<void> {
  const id = process.argv[3];
  if (!id) { console.error("usage: tsx index.ts variant <variantId>"); process.exit(1); }
  const [v, policy, available] = await Promise.all([
    reader.getVariant(id),
    reader.getAccessPolicy(id),
    reader.isVariantAvailable(id),
  ]);
  console.log(JSON.stringify(
    {
      variant: { ...v, status: MODEL_STATUS_LABEL[v.status], trainerStake: v.trainerStake.toString(), avgScore: v.avgScore.toString(), submittedAt: v.submittedAt.toString(), validatedAt: v.validatedAt.toString(), finalizedAt: v.finalizedAt.toString(), validatorCount: v.validatorCount.toString(), challengeDeadline: v.challengeDeadline.toString() },
      accessPolicy: { ...policy, minStakeRequiredWei: policy.minStakeRequiredWei.toString(), ticketTtlSecs: policy.ticketTtlSecs.toString() },
      available,
    },
    null,
    2,
  ));
}

async function getBase(): Promise<void> {
  const id = process.argv[3];
  if (!id) { console.error("usage: tsx index.ts base <baseModelId>"); process.exit(1); }
  const [m, variants] = await Promise.all([reader.getBaseModel(id), reader.getVariantsForBaseModel(id)]);
  console.log(JSON.stringify(
    {
      baseModel: { ...m, createdAt: m.createdAt.toString() },
      variantCount: variants.length,
      variants: variants.map((v) => ({ variantId: v.variantId, status: MODEL_STATUS_LABEL[v.status], trainer: v.trainer })),
    },
    null,
    2,
  ));
}

async function benchmarks(): Promise<void> {
  if (!BENCHMARKS) { console.error("set BENCHMARKS=0x... to list benchmarks"); process.exit(1); }
  const ids = await reader.listBenchmarks();
  console.log(JSON.stringify(ids, null, 2));
}

const main =
  cmd === "list" ? listAll :
  cmd === "variant" ? getVariant :
  cmd === "base" ? getBase :
  cmd === "benchmarks" ? benchmarks :
  () => { console.log("usage: tsx index.ts <list|variant <id>|base <id>|benchmarks>"); process.exit(1); };

main().catch((e) => {
  console.error("registry:", (e as Error).message.split("\n")[0]);
  process.exit(1);
});
