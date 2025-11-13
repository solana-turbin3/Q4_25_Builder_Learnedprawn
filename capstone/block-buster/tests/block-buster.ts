import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { BlockBuster } from "../target/types/block_buster";
import {
  Keypair,
  LAMPORTS_PER_SOL,
  PublicKey,
  SystemProgram,
} from "@solana/web3.js";
import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  getAssociatedTokenAddressSync,
  getMint,
  getAccount,
} from "@solana/spl-token";
import { assert, expect } from "chai";
import { TOKEN_PROGRAM_ID } from "@coral-xyz/anchor/dist/cjs/utils/token";
import { SYSTEM_PROGRAM_ID } from "@coral-xyz/anchor/dist/cjs/native/system";
import { BN } from "bn.js";

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
  const buyer = Keypair.generate();
  console.log("creator: ", creator.publicKey.toString());

  const name = "test";
  const symbol = "TEST";
  const uri = "uri";
  // const tokenData = {
  //   name,
  //   symbol,
  //   uri,
  // };

  let settingsPda: PublicKey;
  let movieMintPda: PublicKey;
  let bondingCurvePda: PublicKey;
  let vaultPda: PublicKey;
  let exitPoolPda: PublicKey;
  let bondingCurveAta: PublicKey;
  let buyerAta: PublicKey;

  before(async () => {
    settingsPda = PublicKey.findProgramAddressSync(
      [Buffer.from("settings")],
      program.programId
    )[0];
    console.log("Settings PDA: ", settingsPda.toString());

    movieMintPda = PublicKey.findProgramAddressSync(
      // seeds = [MINT.as_ref(), name.as_bytes().as_ref(), creator.key().as_ref() ],
      [Buffer.from("mint"), Buffer.from(name), creator.publicKey.toBuffer()],
      program.programId
    )[0];
    console.log("Movie Mint PDA: ", movieMintPda.toString());

    bondingCurvePda = PublicKey.findProgramAddressSync(
      // seeds = [CURVE.as_ref(), movie_mint.key().as_ref()],
      [Buffer.from("curve"), movieMintPda.toBuffer()],
      program.programId
    )[0];
    console.log("Bonding Curve PDA: ", bondingCurvePda.toString());

    vaultPda = PublicKey.findProgramAddressSync(
      // (seeds = [VAULT_CURVE.as_ref(), movie_mint.key().as_ref()]),
      [Buffer.from("curve_vault"), movieMintPda.toBuffer()],
      program.programId
    )[0];
    console.log("Vault PDA: ", vaultPda.toString());
    exitPoolPda = PublicKey.findProgramAddressSync(
      // (seeds = [VAULT_CURVE.as_ref(), movie_mint.key().as_ref()]),
      [Buffer.from("exit_pool"), movieMintPda.toBuffer()],
      program.programId
    )[0];
    console.log("exit pool PDA: ", exitPoolPda.toString());

    bondingCurveAta = getAssociatedTokenAddressSync(
      movieMintPda,
      bondingCurvePda,
      true
    );
    console.log("Bonding Curve ATA: ", bondingCurveAta.toString());
    buyerAta = getAssociatedTokenAddressSync(
      movieMintPda,
      buyer.publicKey,
      true
    );
    console.log("Buyer ATA: ", buyerAta.toString());

    await connection.requestAirdrop(newAdmin.publicKey, 5_000_000_000); // 5 SOL
    await connection.requestAirdrop(creator.publicKey, 5_000_000_000); // 5 SOL
    await connection.requestAirdrop(buyer.publicKey, 5_000_000_000); // 5 SOL
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
  // it("Create Token Mints and Revokes Authority", async () => {
  //   const tx = await program.methods
  //     .create("testtoken")
  //     .accountsStrict({
  //       creator: creator.publicKey,
  //       movieMint: movieMintPda,
  //       bondingCurve: bondingCurvePda,
  //       vault: vaultPda,
  //       bondingCurveAta: bondingCurveAta,
  //       settings: settingsPda,
  //       associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
  //       tokenProgram: TOKEN_PROGRAM_ID,
  //       systemProgram: SYSTEM_PROGRAM_ID,
  //     })
  //     .signers([creator])
  //     .rpc();
  //   console.log("Create transaction signature", tx);
  //
  //   const bondingCurveAtaBalance = (
  //     await provider.connection.getTokenAccountBalance(bondingCurveAta)
  //   ).value.uiAmount;
  //   const settings = await program.account.settings.fetch(settingsPda);
  //   assert.equal(
  //     (bondingCurveAtaBalance * 10 ** DECIMALS).toString(),
  //     settings.supply.toString()
  //   );
  //   const bondingCurve = await program.account.bondingCurve.fetch(
  //     bondingCurvePda
  //   );
  //   assert.equal(bondingCurve.complete, false);
  //   const movieMint = await getMint(provider.connection, movieMintPda);
  //   assert.equal(movieMint.mintAuthority, null);
  //   console.log("Mint authority:", movieMint.mintAuthority);
  //   console.log("Decimals:", movieMint.decimals);
  //   console.log("Supply:", Number(movieMint.supply));
  // });
  it("Create Token Mint and initialize bonding curve values", async () => {
    const tx = await program.methods
      .create(name, symbol, uri, new BN(10), new BN(1000))
      .accountsStrict({
        creator: creator.publicKey,
        movieMint: movieMintPda,
        bondingCurve: bondingCurvePda,
        vault: vaultPda,
        settings: settingsPda,
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: SYSTEM_PROGRAM_ID,
      })
      .signers([creator])
      .rpc();
    console.log("Create Token transaction: ", tx);

    // Movie mint exists
    const movieMintAccount = await getMint(provider.connection, movieMintPda);
    assert.ok(
      movieMintAccount.address.equals(movieMintPda),
      "Mint account mismatch"
    );
    const bondingCurve = await program.account.bondingCurve.fetch(
      bondingCurvePda
    );
    // Bonding curve exists
    assert.ok(
      bondingCurve.mint.equals(movieMintPda),
      "BondingCurve mint mismatch"
    );
    // Mint authority
    assert.ok(
      movieMintAccount.mintAuthority.equals(bondingCurvePda),
      "BondingCurve PDA must be mint authority"
    );
    assert.equal(
      Number(movieMintAccount.supply),
      0,
      "New mint should have 0 supply"
    );
    assert.equal(movieMintAccount.decimals, 6, "Mint should have 6 decimals");
    assert.equal(bondingCurve.complete, false);
    // State fields
    assert.ok(bondingCurve.name === name, "Incorrect name");
    assert.ok(bondingCurve.symbol === symbol, "Incorrect symbol");
    assert.ok(bondingCurve.uri === uri, "Incorrect URI");

    // Initial flags
    assert.equal(
      bondingCurve.complete,
      false,
      "Bonding curve should start incomplete"
    );

    // Reserves
    assert.equal(Number(bondingCurve.solReserve), 0, "SOL reserve should be 0");
    assert.equal(
      Number(bondingCurve.tokenReserve),
      0,
      "Token reserve should be 0"
    );

    // Fundraising goal
    assert.equal(
      Number(bondingCurve.completionLamports),
      1000,
      "Completion lamports mismatch"
    );

    // Total token supply set from settings
    // assert.equal(
    //   Number(bondingCurve.totalTokenSupply),
    //   Number(settingsAccount.supply),
    //   "Bonding curve total supply should match settings.supply"
    // );

    // Initializer + share
    assert.ok(
      bondingCurve.initializer.equals(creator.publicKey),
      "Initializer should be creator"
    );
    assert.equal(
      Number(bondingCurve.initializerShare),
      10,
      "Initializer share mismatch"
    );
    console.log(
      "Vault SOL Balance: ",
      await connection.getBalanceAndContext(vaultPda)
    );
  });
  it("Buyer buys token and transfers sol", async () => {
    // 1️⃣  PRE-STATE SNAPSHOT
    const buyerStartBalance = await connection.getBalance(buyer.publicKey);
    const vaultStartBalance = await connection.getBalance(vaultPda);

    let buyerTokensBefore = 0;
    try {
      buyerTokensBefore = (
        await provider.connection.getTokenAccountBalance(buyerAta)
      ).value.uiAmount;
      console.log("Initial Buyer Tokens:", buyerTokensBefore);
    } catch (e: any) {
      console.log("Account does not exist yet");
    }

    console.log("Initial Buyer SOL:", buyerStartBalance);
    console.log("Initial Vault SOL:", vaultStartBalance);

    const amountInSol = 1 * LAMPORTS_PER_SOL; // 1 SOL
    let tx = await program.methods
      .buy(new BN(amountInSol))
      .accountsStrict({
        buyer: buyer.publicKey,
        movieMint: movieMintPda,
        bondingCurve: bondingCurvePda,
        vault: vaultPda,
        buyerAta: buyerAta,
        settings: settingsPda,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: SYSTEM_PROGRAM_ID,
      })
      .signers([buyer])
      .rpc();
    console.log("Buy transaction ID: ", tx);
    // 3️⃣  POST-STATE SNAPSHOT
    const buyerEndBalance = await connection.getBalance(buyer.publicKey);
    const vaultEndBalance = await connection.getBalance(vaultPda);

    const buyerAtaInfoAfter = await getAccount(connection, buyerAta);
    const buyerTokensAfter = Number(buyerAtaInfoAfter.amount);

    console.log("Final Buyer SOL:", buyerEndBalance);
    console.log("Final Vault SOL:", vaultEndBalance);
    console.log("Final Buyer Tokens:", buyerTokensAfter);

    const solTransferred = vaultEndBalance - vaultStartBalance;
    const buyerSolSpent = buyerStartBalance - buyerEndBalance;

    // Note: buyerSolSpent will include transaction fee (~5000 lamports), so we use >=
    expect(solTransferred).to.equal(amountInSol);
    expect(buyerSolSpent).to.be.greaterThanOrEqual(amountInSol);

    // 🔸 (B) Buyer ATA received tokens
    expect(buyerTokensAfter).to.be.greaterThan(buyerTokensBefore);

    // 🔸 (C) Token mint total supply should match (optional but good)
    const mintInfo = await getMint(connection, movieMintPda);
    expect(Number(mintInfo.supply)).to.equal(buyerTokensAfter);

    console.log("✅ Assertions passed!");
  });
  it("Buyer sells token and receives sol", async () => {
    // 1️⃣  PRE-STATE SNAPSHOT
    const buyerStartBalance = await connection.getBalance(buyer.publicKey);
    const vaultStartBalance = await connection.getBalance(vaultPda);

    let buyerTokensBefore = 0;
    try {
      const buyerAtaInfoBefore = await getAccount(connection, buyerAta);
      buyerTokensBefore = Number(buyerAtaInfoBefore.amount);
      // buyerTokensBefore = (
      //   await provider.connection.getTokenAccountBalance(buyerAta)
      // ).value.uiAmount;
      console.log("Initial Buyer Tokens:", buyerTokensBefore);
    } catch (e: any) {
      console.log("Account does not exist yet");
    }

    console.log("Initial Buyer SOL:", buyerStartBalance);
    console.log("Initial Vault SOL:", vaultStartBalance);

    const amountInTokens = 1; // 1 token
    let tx = await program.methods
      .sell(new BN(amountInTokens))
      .accountsStrict({
        buyer: buyer.publicKey,
        movieMint: movieMintPda,
        bondingCurve: bondingCurvePda,
        vault: vaultPda,
        buyerAta: buyerAta,
        settings: settingsPda,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: SYSTEM_PROGRAM_ID,
      })
      .signers([buyer])
      .rpc();
    console.log("Buy transaction ID: ", tx);
    // 3️⃣  POST-STATE SNAPSHOT
    const buyerEndBalance = await connection.getBalance(buyer.publicKey);
    const vaultEndBalance = await connection.getBalance(vaultPda);

    const buyerAtaInfoAfter = await getAccount(connection, buyerAta);
    const buyerTokensAfter = Number(buyerAtaInfoAfter.amount);

    // const buyerTokensAfter =
    //   (await provider.connection.getTokenAccountBalance(buyerAta)).value
    //     .uiAmount;
    console.log("Final Buyer SOL:", buyerEndBalance);
    console.log("Final Vault SOL:", vaultEndBalance);
    console.log("Final Buyer Tokens:", buyerTokensAfter);

    const solTransferred = vaultStartBalance - vaultEndBalance;

    assert(
      buyerStartBalance + solTransferred == buyerEndBalance,
      "Buyer and vault balance mismatch"
    );

    // 🔸 (B) Buyer ATA received tokens
    assert(
      buyerTokensAfter < buyerTokensBefore,
      "Buyer tokens should decrease after sell"
    );
    assert(
      buyerStartBalance < buyerEndBalance,
      "Buyer SOL balance should increase after sell"
    );

    // 🔸 (C) Token mint total supply should match (optional but good)
    const mintInfo = await getMint(connection, movieMintPda);
    expect(Number(mintInfo.supply)).to.equal(buyerTokensAfter);

    console.log("✅ Assertions passed!");
  });
  it("Creator release movie and exit pool gets created", async () => {
    const tx = await program.methods
      .release(new BN(1))
      .accountsStrict({
        creator: creator.publicKey,
        movieMint: movieMintPda,
        bondingCurve: bondingCurvePda,
        exitPool: exitPoolPda,
        systemProgram: SYSTEM_PROGRAM_ID,
      })
      .signers([creator])
      .rpc();

    console.log("Transaction Signature: ", tx);

    const exitPoolBalance = await connection.getBalance(exitPoolPda);
    console.log("exitPoolBalance: ", exitPoolBalance);
    assert(exitPoolBalance > 0, "Balance should be greater than 0");
  });
  it("Viewer pays ticket price in SOL and receives NFT", async () => {
    //TODO: Mint NFT    const tx = await program.methods
    const tx = await program.methods
      .watch()
      .accountsStrict({
        view: creator.publicKey,
        movieMint: movieMintPda,
        bondingCurve: bondingCurvePda,
        exitPool: exitPoolPda,
        systemProgram: SYSTEM_PROGRAM_ID,
      })
      .signers([creator])
      .rpc();

    console.log("Transaction Signature: ", tx);

    const exitPoolBalance = await connection.getBalance(exitPoolPda);
    console.log("exitPoolBalance: ", exitPoolBalance);
    assert(exitPoolBalance > 0, "Balance should be greater than 0");
  });
});
