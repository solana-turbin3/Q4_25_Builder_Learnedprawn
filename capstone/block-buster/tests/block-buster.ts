import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { BlockBuster } from "../target/types/block_buster";
import { Keypair, PublicKey, SystemProgram } from "@solana/web3.js";
import { assert } from "chai";

describe("block-buster", () => {
  // Configure the client to use the local cluster.
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.blockBuster as Program<BlockBuster>;
  const connection = provider.connection;

  const feeBasisPoints = 0;

  const admin = provider.wallet;
  console.log("Admin: ", admin.publicKey.toString());

  let settingsPda: PublicKey;
  const newAdmin = Keypair.generate();

  before(async () => {
    settingsPda = PublicKey.findProgramAddressSync(
      [Buffer.from("settings")],
      program.programId
    )[0];
    console.log("Settings PDA: ", settingsPda.toString());

    await connection.requestAirdrop(newAdmin.publicKey, 5_000_000_000); // 5 SOL
    await new Promise((resolve) => setTimeout(resolve, 1000));
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
  it("Settings changed", async () => {
    // Add your test here.
    const paused = false;
    const newFeeBasisPoints = 1;
    const tx = await program.methods
      .setSettings(paused, newFeeBasisPoints)
      .accountsStrict({
        admin: newAdmin.publicKey,
        settings: settingsPda,
        systemProgram: SystemProgram.programId,
      })
      .signers([newAdmin])
      .rpc();
    console.log("Settings transaction signature", tx);

    const settings = await program.account.settings.fetch(settingsPda);
    assert.equal(settings.feeBasisPoints, newFeeBasisPoints);
    assert.equal(settings.initialized, true);
    assert(settings.feeRecipient.equals(newAdmin.publicKey));
  });
});
