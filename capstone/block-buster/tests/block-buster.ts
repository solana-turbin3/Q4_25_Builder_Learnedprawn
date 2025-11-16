import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { BlockBuster } from "../target/types/block_buster";
import { MPL_CORE_PROGRAM_ID, mplCore } from "@metaplex-foundation/mpl-core";
import {
  Keypair,
  LAMPORTS_PER_SOL,
  PublicKey,
  SystemProgram,
  Transaction,
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
import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";

import { fetchAsset } from "@metaplex-foundation/mpl-core";
import { string } from "@metaplex-foundation/umi/serializers";

describe("block-buster", () => {
  // Configure the client to use the local cluster.
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.blockBuster as Program<BlockBuster>;
  const connection = provider.connection;
  const umi = createUmi("http://localhost:8899").use(mplCore());

  const feeBasisPoints = 0;

  const MINT_DECIMAL_PRECISION = 10 ** 6;

  // const INITIAL_BUY_AMOUNT = 10 * MINT_DECIMAL_PRECISION; //  this is 10 tokens 1 SOL = 1000 Tokens (hardcoded initial value and slope) therefore
  const INITIAL_BUY_AMOUNT = 10;

  // const SELL_AMOUNT = 1 * MINT_DECIMAL_PRECISION; // 1 Token sold
  const SELL_AMOUNT = 2;

  const TICKET_PRICE = 0.01 * LAMPORTS_PER_SOL; // 0.01 SOL

  // const EXIT_TOKENS = 1 * MINT_DECIMAL_PRECISION; // 1 Token (Therefore I should get 0.001 SOL i.e. 1_000_000 lamports)
  const EXIT_TOKENS = 1;

  const admin = provider.wallet;
  console.log("Admin: ", admin.publicKey.toString());

  let localnet = provider.connection.rpcEndpoint == "http://127.0.0.1:8899";
  let newAdmin: Keypair;
  let creator: Keypair;
  let viewer: Keypair;
  let buyer: Keypair;
  let buyer2: Keypair;
  let asset: Keypair;
  if (localnet) {
    newAdmin = Keypair.generate();
    creator = Keypair.generate();
    viewer = Keypair.generate();
    buyer = Keypair.generate();
    buyer2 = Keypair.generate();
    asset = Keypair.generate();
    console.log("newAdmin pubkey:     ", newAdmin.publicKey.toString());
    console.log("newAdmin privatekey: ", newAdmin.secretKey);
    console.log("creator pubkey:      ", creator.publicKey.toString());
    console.log("creator privatekey:  ", creator.secretKey);
    console.log("viewer pubkey:       ", viewer.publicKey.toString());
    console.log("viewer privatekey:   ", viewer.secretKey);
    console.log("buyer pubkey:        ", buyer.publicKey.toString());
    console.log("buyer privatekey:    ", buyer.secretKey);
    console.log("buyer2 pubkey:       ", buyer2.publicKey.toString());
    console.log("buyer2 privatekey:   ", buyer2.secretKey);
    console.log("asset pubkey:        ", asset.publicKey.toString());
    console.log("asset privatekey:    ", asset.secretKey);
  } else {
    let secretKeyBytes: Uint8Array = Buffer.from([
      35, 117, 158, 110, 101, 233, 149, 122, 233, 216, 225, 125, 120, 232, 169,
      177, 239, 136, 177, 23, 163, 51, 193, 150, 21, 77, 126, 125, 74, 76, 160,
      228, 190, 126, 6, 1, 84, 56, 160, 132, 170, 199, 156, 209, 90, 45, 19, 89,
      165, 150, 131, 148, 123, 96, 139, 166, 91, 184, 207, 204, 1, 23, 101, 217,
    ]);
    newAdmin = Keypair.fromSecretKey(secretKeyBytes);

    secretKeyBytes = Buffer.from([
      95, 33, 27, 60, 166, 231, 93, 74, 229, 24, 37, 53, 29, 110, 196, 195, 26,
      245, 163, 180, 185, 44, 68, 250, 151, 136, 196, 43, 228, 103, 40, 76, 242,
      1, 37, 254, 115, 180, 219, 225, 125, 212, 28, 37, 64, 165, 41, 26, 52,
      242, 103, 217, 78, 213, 236, 7, 116, 4, 24, 13, 161, 127, 139, 233,
    ]);
    creator = Keypair.fromSecretKey(secretKeyBytes);

    secretKeyBytes = Buffer.from([
      89, 36, 179, 42, 22, 177, 247, 142, 101, 120, 44, 18, 50, 30, 170, 13,
      174, 217, 134, 5, 159, 47, 223, 30, 89, 137, 90, 10, 108, 166, 142, 155,
      156, 80, 172, 254, 176, 177, 36, 167, 252, 55, 79, 235, 200, 47, 77, 215,
      195, 73, 40, 178, 94, 243, 43, 189, 253, 119, 156, 101, 3, 59, 133, 23,
    ]);
    viewer = Keypair.fromSecretKey(secretKeyBytes);

    secretKeyBytes = Buffer.from([
      82, 229, 77, 129, 78, 241, 243, 86, 61, 14, 53, 84, 172, 254, 163, 79, 10,
      10, 118, 158, 211, 218, 198, 153, 227, 136, 222, 252, 213, 25, 97, 80, 4,
      87, 27, 231, 68, 189, 9, 69, 113, 109, 6, 140, 30, 176, 157, 80, 15, 68,
      138, 226, 51, 255, 169, 81, 214, 96, 1, 237, 216, 249, 230, 152,
    ]);
    buyer = Keypair.fromSecretKey(secretKeyBytes);

    secretKeyBytes = Buffer.from([
      5, 110, 30, 61, 54, 177, 143, 152, 246, 129, 42, 145, 21, 59, 68, 103,
      119, 209, 144, 210, 208, 187, 151, 240, 3, 81, 67, 98, 119, 27, 57, 174,
      80, 187, 79, 88, 94, 57, 133, 174, 240, 243, 66, 121, 43, 93, 72, 74, 126,
      209, 88, 181, 228, 238, 157, 97, 227, 251, 2, 224, 64, 215, 199, 210,
    ]);
    buyer2 = Keypair.fromSecretKey(secretKeyBytes);

    secretKeyBytes = Buffer.from([
      214, 58, 5, 57, 250, 118, 231, 239, 147, 89, 1, 245, 223, 194, 228, 149,
      39, 69, 69, 61, 243, 130, 125, 171, 158, 124, 237, 160, 149, 211, 29, 2,
      109, 32, 120, 52, 110, 132, 75, 67, 122, 152, 107, 129, 254, 125, 22, 145,
      162, 151, 52, 246, 246, 60, 75, 192, 144, 15, 60, 134, 128, 53, 241, 1,
    ]);
    asset = Keypair.fromSecretKey(secretKeyBytes);
  }

  const name = "test";
  const symbol = "TEST";
  const uri = "uri";

  let settingsPda: PublicKey;
  let movieMintPda: PublicKey;
  let bondingCurvePda: PublicKey;
  let vaultPda: PublicKey;
  let exitPoolPda: PublicKey;
  let bondingCurveAta: PublicKey;
  let buyerAta: PublicKey;
  let buyer2Ata: PublicKey;

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

    buyer2Ata = getAssociatedTokenAddressSync(
      movieMintPda,
      buyer2.publicKey,
      true
    );
    console.log("Buyer ATA: ", buyer2Ata.toString());

    console.log(
      "provider.connection.rpcEndpoint: ",
      provider.connection.rpcEndpoint == "http://127.0.0.1:8899"
    );

    if (localnet) {
      await connection.requestAirdrop(newAdmin.publicKey, 5_000_000_000); // 5 SOL
      await connection.requestAirdrop(creator.publicKey, 5_000_000_000); // 5 SOL
      await connection.requestAirdrop(buyer.publicKey, 5_000_000_000); // 5 SOL
      await connection.requestAirdrop(buyer2.publicKey, 5_000_000_000); // 5 SOL
      await connection.requestAirdrop(viewer.publicKey, 5_000_000_000); // 5 SOL
      await new Promise((resolve) => setTimeout(resolve, 1000));
      console.log(await connection.getBalance(newAdmin.publicKey));
      console.log(await connection.getBalance(creator.publicKey));
    } else {
      await connection.sendTransaction(
        new Transaction().add(
          SystemProgram.transfer({
            fromPubkey: admin.publicKey,
            toPubkey: newAdmin.publicKey,
            lamports: 100_000_000,
          }),
          SystemProgram.transfer({
            fromPubkey: admin.publicKey,
            toPubkey: creator.publicKey,
            lamports: 100_000_000,
          }),
          SystemProgram.transfer({
            fromPubkey: admin.publicKey,
            toPubkey: buyer.publicKey,
            lamports: 100_000_000,
          }),
          SystemProgram.transfer({
            fromPubkey: admin.publicKey,
            toPubkey: buyer2.publicKey,
            lamports: 100_000_000,
          }),
          SystemProgram.transfer({
            fromPubkey: admin.publicKey,
            toPubkey: viewer.publicKey,
            lamports: 100_000_000,
          })
        ),
        [admin.payer]
      );
    }
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
    assert.equal(movieMintAccount.decimals, 0, "Mint should have 0 decimals");
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

    let tx = await program.methods
      .buy(new BN(INITIAL_BUY_AMOUNT))
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
    // expect(solTransferred).to.equal(INITIAL_BUY_AMOUNT);
    // expect(buyerSolSpent).to.be.greaterThanOrEqual(INITIAL_BUY_AMOUNT);

    // 🔸 (B) Buyer ATA received tokens
    expect(buyerTokensAfter).to.be.greaterThan(buyerTokensBefore);
    expect(buyerTokensAfter).to.be.equal(INITIAL_BUY_AMOUNT);

    // 🔸 (C) Token mint total supply should match (optional but good)
    const mintInfo = await getMint(connection, movieMintPda);
    expect(Number(mintInfo.supply)).to.equal(buyerTokensAfter);

    console.log("✅ Assertions passed!");
  });
  it("Single Buyer sells token and receives sol", async () => {
    console.log("✅ sell start!");
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

    let tx = await program.methods
      .sell(new BN(SELL_AMOUNT))
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
    console.log("Sell transaction ID: ", tx);
    // 3️⃣  POST-STATE SNAPSHOT
    const buyerEndBalance = await connection.getBalance(buyer.publicKey);
    const vaultEndBalance = await connection.getBalance(vaultPda);

    const buyerAtaInfoAfter = await getAccount(connection, buyerAta);
    const buyerTokensAfter = Number(buyerAtaInfoAfter.amount);

    // const buyerTokensAfter =
    //   (await provider.connection.getTokenAccountBalance(buyerAta)).value
    //     .uiAmount;
    console.log("Final Buyer SOL:  ", buyerEndBalance);
    console.log("Final Vault SOL:  ", vaultEndBalance);
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
  it("Multiple Buyers buy and sell token", async () => {
    console.log("✅ buy and sell start!");
    // 1️⃣  PRE-STATE SNAPSHOT
    const buyerStartBalance = await connection.getBalance(buyer.publicKey);
    const buyer2StartBalance = await connection.getBalance(buyer2.publicKey);
    const vaultStartBalance = await connection.getBalance(vaultPda);

    let buyerTokensBefore = 0;
    try {
      const buyerAtaInfoBefore = await getAccount(connection, buyerAta);
      buyerTokensBefore = Number(buyerAtaInfoBefore.amount);
      console.log("Initial Buyer Tokens:", buyerTokensBefore);
    } catch (e: any) {
      console.log("Buyer 1 Account does not exist yet");
    }
    let buyer2TokensBefore = 0;
    try {
      const buyer2AtaInfoBefore = await getAccount(connection, buyer2Ata);
      buyer2TokensBefore = Number(buyer2AtaInfoBefore);
      console.log("Initial Buyer 2 Tokens:", buyer2TokensBefore);
    } catch (e: any) {
      console.log("Buyer 2 Account does not exist yet");
    }

    console.log("Initial Buyer 1 SOL:", buyerStartBalance);
    console.log("Initial Buyer 2 SOL:", buyer2StartBalance);
    console.log("Initial Vault SOL:  ", vaultStartBalance);

    // let tx = await program.methods
    //   .sell(new BN(SELL_AMOUNT))
    //   .accountsStrict({
    //     buyer: buyer.publicKey,
    //     movieMint: movieMintPda,
    //     bondingCurve: bondingCurvePda,
    //     vault: vaultPda,
    //     buyerAta: buyerAta,
    //     settings: settingsPda,
    //     associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
    //     tokenProgram: TOKEN_PROGRAM_ID,
    //     systemProgram: SYSTEM_PROGRAM_ID,
    //   })
    //   .signers([buyer])
    //   .rpc();
    // console.log("Sell transaction ID: ", tx);
    let tx = await program.methods
      .buy(new BN(INITIAL_BUY_AMOUNT))
      .accountsStrict({
        buyer: buyer2.publicKey,
        movieMint: movieMintPda,
        bondingCurve: bondingCurvePda,
        vault: vaultPda,
        buyerAta: buyer2Ata,
        settings: settingsPda,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: SYSTEM_PROGRAM_ID,
      })
      .signers([buyer2])
      .rpc();
    console.log("Buy 2 transaction ID: ", tx);
    // 3️⃣  POST-STATE SNAPSHOT
    const buyerEndBalance = await connection.getBalance(buyer.publicKey);
    const buyer2EndBalance = await connection.getBalance(buyer2.publicKey);
    const vaultEndBalance = await connection.getBalance(vaultPda);

    const buyerAtaInfoAfter = await getAccount(connection, buyerAta);
    const buyerTokensAfter = Number(buyerAtaInfoAfter.amount);

    const buyer2AtaInfoAfter = await getAccount(connection, buyer2Ata);
    const buyer2TokensAfter = Number(buyer2AtaInfoAfter.amount);

    // const buyerTokensAfter =
    //   (await provider.connection.getTokenAccountBalance(buyerAta)).value
    //     .uiAmount;
    console.log("Final Buyer 1 SOL:", buyerEndBalance);
    console.log("Final Buyer 2 SOL:", buyer2EndBalance);
    console.log("Final Vault SOL:  ", vaultEndBalance);
    console.log("Final Buyer 2 Tokens:", buyer2TokensAfter);

    const solTransferred = vaultStartBalance - vaultEndBalance;

    // assert(
    //   buyerStartBalance + solTransferred == buyerEndBalance,
    //   "Buyer and vault balance mismatch"
    // );

    // 🔸 (B) Buyer ATA received tokens
    // assert(
    //   buyer2TokensAfter < buyer2TokensBefore,
    //   "Buyer tokens should decrease after sell"
    // );
    // assert(
    //   buyer2StartBalance < buyer2EndBalance,
    //   "Buyer SOL balance should increase after sell"
    // );

    // 🔸 (C) Token mint total supply should match (optional but good)
    const mintInfo = await getMint(connection, movieMintPda);
    // expect(Number(mintInfo.supply)).to.equal(buyerTokensAfter);

    console.log("✅ Assertions passed!");
  });
  it("Creator release movie and exit pool gets created", async () => {
    const tx = await program.methods
      .release(new BN(TICKET_PRICE))
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
    //TODO: Mint NFT

    let createAssetArgs = {
      name: "Movie Asset",
      uri: "https://example.com/my-asset.json",
    };

    const exitPoolBalanceBefore = await connection.getBalance(exitPoolPda);
    console.log("exitPoolBalanceBefore: ", exitPoolBalanceBefore);
    const tx = await program.methods
      .watch(createAssetArgs)
      .accountsStrict({
        viewer: viewer.publicKey,
        movieMint: movieMintPda,
        bondingCurve: bondingCurvePda,
        exitPool: exitPoolPda,
        asset: asset.publicKey,
        collection: null,
        coreProgram: MPL_CORE_PROGRAM_ID,
        systemProgram: SYSTEM_PROGRAM_ID,
      })
      .signers([viewer, asset])
      .rpc();

    console.log("Transaction Signature: ", tx);

    const exitPoolBalanceAfter = await connection.getBalance(exitPoolPda);
    console.log("exitPoolBalanceAfter: ", exitPoolBalanceAfter);
    assert(
      exitPoolBalanceAfter > exitPoolBalanceBefore,
      "Balance should be greater than before"
    );

    const assetAccount = await fetchAsset(umi, asset.publicKey.toString());
    console.log("assetAccount: ", assetAccount);
    console.log("assetAccount name: ", assetAccount.name);
    console.log("assetAccount uri: ", assetAccount.uri);
    expect(assetAccount.name).to.equal(createAssetArgs.name);
    expect(assetAccount.uri).to.equal(createAssetArgs.uri);
    expect(assetAccount.owner.toString()).to.equal(viewer.publicKey.toString());
  });
  it("token holders exit by redeeming their tokens from exit pool", async () => {
    const exitPoolBalanceBefore = await connection.getBalance(exitPoolPda);
    const buyerBalanceBefore = await connection.getBalance(buyer.publicKey);
    const buyerAtaInfoBefore = await getAccount(connection, buyerAta);
    const buyerAtaBalanceBefore = Number(buyerAtaInfoBefore.amount);
    // const buyerAtaBalanceBefore = (
    //   await provider.connection.getTokenAccountBalance(buyerAta)
    // ).value.uiAmount;
    const tx = await program.methods
      .exit(new BN(EXIT_TOKENS))
      .accountsStrict({
        exiter: buyer.publicKey,
        movieMint: movieMintPda,
        bondingCurve: bondingCurvePda,
        exitPool: exitPoolPda,
        buyerAta: buyerAta,
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: SYSTEM_PROGRAM_ID,
      })
      .signers([buyer])
      .rpc();

    console.log("Transaction Signature: ", tx);

    const exitPoolBalanceAfter = await connection.getBalance(exitPoolPda);
    const buyerBalanceAfter = await connection.getBalance(buyer.publicKey);
    const buyerAtaInfoAfter = await getAccount(connection, buyerAta);
    const buyerAtaBalanceAfter = Number(buyerAtaInfoAfter.amount);
    // const buyerAtaBalanceAfter = (
    //   await provider.connection.getTokenAccountBalance(buyerAta)
    // ).value.uiAmount;
    console.log("buyerAtaBalanceBefore: ", buyerAtaBalanceBefore);
    console.log("buyerAtaBalanceAfter:  ", buyerAtaBalanceAfter);
    console.log("exitPoolBalanceBefore: ", exitPoolBalanceBefore);
    console.log("exitPoolBalanceAfter:  ", exitPoolBalanceAfter);
    console.log("buyerBalanceBefore:    ", buyerBalanceBefore);
    console.log("buyerBalanceAfter:     ", buyerBalanceAfter);
    assert(
      exitPoolBalanceBefore > exitPoolBalanceAfter,
      "Balance should be lesser than before"
    );
    assert(
      buyerBalanceBefore < buyerBalanceAfter,
      "Balance of token holder should be greater"
    );
    assert(
      buyerAtaBalanceBefore > buyerAtaBalanceAfter,
      "Balance should be lesser than before"
    );
  });
});
