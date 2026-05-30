/**
 * Bridge LCAI between Ethereum mainnet and LightChain mainnet using
 * lightnode-sdk's Bridge class (Hyperlane Warp Route).
 *
 *   tsx index.ts quote                # quote fee both directions
 *   tsx index.ts approve              # one-time ERC-20 approval on Ethereum
 *   tsx index.ts deposit <amount>     # Ethereum -> LightChain
 *   tsx index.ts withdraw <amount>    # LightChain -> Ethereum
 *
 * Amount is in whole LCAI (the script multiplies by 1e18). Recipient
 * defaults to the signer's address; pass --to 0x... to send elsewhere.
 *
 * Requires PRIVATE_KEY in env. The same key signs on both chains.
 */
import { Bridge, BRIDGE_ROUTE } from "lightnode-sdk";
import { createPublicClient, createWalletClient, http, parseEther } from "viem";
import { privateKeyToAccount } from "viem/accounts";

const PRIVATE_KEY = process.env.PRIVATE_KEY as `0x${string}` | undefined;
if (!PRIVATE_KEY?.startsWith("0x") || PRIVATE_KEY.length !== 66) {
  console.error("set PRIVATE_KEY=0x... in env (the same key signs on both chains)");
  process.exit(1);
}

const cmd = process.argv[2];
const arg = process.argv[3];
const recipientArg = process.argv.includes("--to")
  ? (process.argv[process.argv.indexOf("--to") + 1] as `0x${string}`)
  : undefined;

const account = privateKeyToAccount(PRIVATE_KEY);
const eth = BRIDGE_ROUTE.ethereum;
const lc = BRIDGE_ROUTE["lightchain-mainnet"];

const ethPub = createPublicClient({ transport: http(eth.rpc) });
const ethWal = createWalletClient({ account, transport: http(eth.rpc) });
const lcPub = createPublicClient({ transport: http(lc.rpc) });
const lcWal = createWalletClient({ account, transport: http(lc.rpc) });

async function quote(): Promise<void> {
  // Each direction is its own Bridge wired to the SOURCE chain's clients,
  // since transferRemote + quoteGasPayment are called on the source router.
  const ethBridge = new Bridge(ethPub as unknown as ConstructorParameters<typeof Bridge>[0]);
  const lcBridge = new Bridge(lcPub as unknown as ConstructorParameters<typeof Bridge>[0]);
  const ethToLc = await ethBridge.quoteFee("ethereum", "lightchain-mainnet");
  const lcToEth = await lcBridge.quoteFee("lightchain-mainnet", "ethereum");
  console.log(JSON.stringify(
    {
      ethereumToLightChain: { feeWei: ethToLc.toString(), feeEth: Number(ethToLc) / 1e18 },
      lightChainToEthereum: { feeWei: lcToEth.toString(), feeLcai: Number(lcToEth) / 1e18 },
    },
    null,
    2,
  ));
}

async function approve(): Promise<void> {
  const bridge = new Bridge(
    ethPub as unknown as ConstructorParameters<typeof Bridge>[0],
    ethWal as unknown as ConstructorParameters<typeof Bridge>[1],
  );
  const tx = await bridge.approve(); // MaxUint256 by default
  console.log(JSON.stringify({ approveTx: `${eth.explorer}/tx/${tx}` }, null, 2));
}

async function deposit(): Promise<void> {
  if (!arg) {
    console.error("usage: tsx index.ts deposit <amountLcai> [--to 0x...]");
    process.exit(1);
  }
  const amount = parseEther(arg);
  const recipient = recipientArg ?? account.address;
  const bridge = new Bridge(
    ethPub as unknown as ConstructorParameters<typeof Bridge>[0],
    ethWal as unknown as ConstructorParameters<typeof Bridge>[1],
  );
  const fee = await bridge.quoteFee("ethereum", "lightchain-mainnet");
  console.log(`fee=${Number(fee) / 1e18} ETH, amount=${arg} LCAI, recipient=${recipient}`);
  const tx = await bridge.transfer({
    from: "ethereum",
    to: "lightchain-mainnet",
    amount,
    recipient,
    fee,
  });
  console.log(JSON.stringify({ depositTx: `${eth.explorer}/tx/${tx}` }, null, 2));
}

async function withdraw(): Promise<void> {
  if (!arg) {
    console.error("usage: tsx index.ts withdraw <amountLcai> [--to 0x...]");
    process.exit(1);
  }
  const amount = parseEther(arg);
  const recipient = recipientArg ?? account.address;
  const bridge = new Bridge(
    lcPub as unknown as ConstructorParameters<typeof Bridge>[0],
    lcWal as unknown as ConstructorParameters<typeof Bridge>[1],
  );
  const fee = await bridge.quoteFee("lightchain-mainnet", "ethereum");
  console.log(`fee=${Number(fee) / 1e18} LCAI, amount=${arg} LCAI, recipient=${recipient}`);
  const tx = await bridge.transfer({
    from: "lightchain-mainnet",
    to: "ethereum",
    amount,
    recipient,
    fee,
  });
  console.log(JSON.stringify({ withdrawTx: `${lc.explorer}/tx/${tx}` }, null, 2));
}

const main =
  cmd === "quote" ? quote :
  cmd === "approve" ? approve :
  cmd === "deposit" ? deposit :
  cmd === "withdraw" ? withdraw :
  () => {
    console.log("usage: tsx index.ts <quote|approve|deposit|withdraw> [...]");
    process.exit(1);
  };

main().catch((e) => {
  console.error("bridge failed:", (e as Error).message);
  process.exit(1);
});
