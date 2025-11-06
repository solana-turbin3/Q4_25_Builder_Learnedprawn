import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { BlockBuster } from "../target/types/block_buster";
import { PublicKey, SystemProgram } from "@solana/web3.js";
import { assert } from "chai";

describe("block-buster", () => {
  // Configure the client to use the local cluster.
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.blockBuster as Program<BlockBuster>;

  const feeBasisPoints = 0;

  const admin = provider.wallet;
  console.log("Admin: ", admin.publicKey.toString());

  let settingsPda: PublicKey;

  before(async () => {
    settingsPda = PublicKey.findProgramAddressSync(
      [Buffer.from("settings")],
      program.programId
    )[0];
    console.log("Settings PDA: ", settingsPda.toString());
  });

  it("Settings initialized", async () => {
    // Add your test here.
    const tx = await program.methods
      .initialize(feeBasisPoints)
      .accountsStrict({
        admin: admin.publicKey,
        settings: settingsPda,
        systemProgram: SystemProgram.programId,
      })
      .rpc();
    console.log("Settings transaction signature", tx);

    const settings = await program.account.settings.fetch(settingsPda);
    assert.equal(settings.feeBasisPoints, feeBasisPoints);
    assert.equal(settings.initialized, true);
    assert(settings.feeRecipient.equals(admin.publicKey));
  });
});
