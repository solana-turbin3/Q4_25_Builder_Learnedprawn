import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { BlockBuster } from "../target/types/block_buster";
import { Keypair, PublicKey, SystemProgram } from "@solana/web3.js";
import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  getAssociatedTokenAddressSync,
} from "@solana/spl-token";
import { assert } from "chai";
import { TOKEN_PROGRAM_ID } from "@coral-xyz/anchor/dist/cjs/utils/token";
import { SYSTEM_PROGRAM_ID } from "@coral-xyz/anchor/dist/cjs/native/system";

describe("block-buster", () => {
  // Configure the client to use the local cluster.
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.blockBuster as Program<BlockBuster>;
  const connection = provider.connection;

  const feeBasisPoints = 0;
  const DECIMALS = 6;

  const admin = provider.wallet;
  console.log("Admin: ", admin.publicKey.toString());

  const newAdmin = Keypair.generate();
  const creator = Keypair.generate();
  console.log("creator: ", creator.publicKey.toString());

  const tokenData = {
    name: "testtoken",
    symbol: "TES",
    uri: "",
  };

  let settingsPda: PublicKey;
  let movieMintPda: PublicKey;
  let bondingCurvePda: PublicKey;
  let vaultPda: PublicKey;
  let bondingCurveAta: PublicKey;

  before(async () => {
    settingsPda = PublicKey.findProgramAddressSync(
      [Buffer.from("settings")],
      program.programId
    )[0];
    console.log("Settings PDA: ", settingsPda.toString());

    movieMintPda = PublicKey.findProgramAddressSync(
      // seeds = [MINT.as_ref(), name.as_bytes().as_ref(), creator.key().as_ref() ],
      [
        Buffer.from("mint"),
        Buffer.from(tokenData.name),
        creator.publicKey.toBuffer(),
      ],
      program.programId
    )[0];
    console.log("Movie Mint PDA: ", movieMintPda.toString());

    bondingCurvePda = PublicKey.findProgramAddressSync(
      // seeds = [CURVE.as_ref(), movie_mint.key().as_ref()],
      [Buffer.from("curve"), movieMintPda.toBuffer()],
      program.programId
    )[0];
    console.log("Bonding Curve PDA: ", movieMintPda.toString());

    vaultPda = PublicKey.findProgramAddressSync(
      // (seeds = [VAULT_CURVE.as_ref(), movie_mint.key().as_ref()]),
      [Buffer.from("curve_vault"), movieMintPda.toBuffer()],
      program.programId
    )[0];
    console.log("Vault PDA: ", movieMintPda.toString());

    bondingCurveAta = getAssociatedTokenAddressSync(
      movieMintPda,
      bondingCurvePda,
      true
    );
    console.log("Bonding Curve ATA: ", bondingCurveAta.toString());

    await connection.requestAirdrop(newAdmin.publicKey, 5_000_000_000); // 5 SOL
    await connection.requestAirdrop(creator.publicKey, 5_000_000_000); // 5 SOL
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
      .setSettings(paused, newAdmin.publicKey, newFeeBasisPoints)
      .accountsStrict({
        admin: admin.publicKey,
        settings: settingsPda,
        systemProgram: SystemProgram.programId,
      })
      .rpc();
    console.log("Settings transaction signature", tx);

    const settings = await program.account.settings.fetch(settingsPda);
    assert.equal(settings.feeBasisPoints, newFeeBasisPoints);
    assert.equal(settings.initialized, true);
    assert(settings.feeRecipient.equals(newAdmin.publicKey));
    // negative path
    try {
      await program.methods
        .setSettings(paused, newAdmin.publicKey, newFeeBasisPoints)
        .accountsStrict({
          admin: admin.publicKey,
          settings: settingsPda,
          systemProgram: SystemProgram.programId,
        })
        .rpc();
      assert.fail("New admin can only set settings");
    } catch (error: any) {
      console.error(`Oops, something went wrong: ${error}`);
    }
  });
  it("Create Token Mints and Revokes Authority", async () => {
    const tx = await program.methods
      .create("testtoken")
      .accountsStrict({
        creator: creator.publicKey,
        movieMint: movieMintPda,
        bondingCurve: bondingCurvePda,
        vault: vaultPda,
        bondingCurveAta: bondingCurveAta,
        settings: settingsPda,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: SYSTEM_PROGRAM_ID,
      })
      .signers([creator])
      .rpc();
    console.log("Create transaction signature", tx);

    const bondingCurveAtaBalance = (
      await provider.connection.getTokenAccountBalance(bondingCurveAta)
    ).value.uiAmount;
    const settings = await program.account.settings.fetch(settingsPda);
    assert.equal(
      (bondingCurveAtaBalance * 10 ** DECIMALS).toString(),
      settings.supply.toString()
    );
  });
});
