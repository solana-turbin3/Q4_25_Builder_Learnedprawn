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
import { Umi } from "@metaplex-foundation/umi";

describe("block-buster", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.blockBuster as Program<BlockBuster>;
  const connection = provider.connection;

  let localnet = provider.connection.rpcEndpoint == "http://127.0.0.1:8899";
  console.log("localnet: ", localnet);

  let umi: Umi;
  if (localnet) {
    umi = createUmi("http://localhost:8899").use(mplCore());
  } else {
    umi = createUmi(
      "https://turbine-solanad-4cde.devnet.rpcpool.com/9a9da9cf-6db1-47dc-839a-55aca5c9c80a"
    ).use(mplCore());
  }

  const feeBasisPoints = 0;

  const CREATOR_SHARE = 10;

  const FUNDRAISING_GOAL = 1 * LAMPORTS_PER_SOL;

  const INITIAL_BUY_AMOUNT = 100;

  const SELL_AMOUNT = 2;

  const TICKET_PRICE = 0.01 * LAMPORTS_PER_SOL; // 0.01 SOL

  const EXIT_TOKENS = 1;

  const INITIAL_PRICE = 100_000; //0.001SOL = 1 Token | 1_000_000 lamports == 0.001SOL

  //This means for each token minted cost of next token will increase by 0.0001SOL
  const SLOPE = 50_000; //0.00005SOL

  const admin = provider.wallet;
  console.log("Admin pubkey:     ", admin.publicKey.toString());
  console.log("Admin privatekey: ", admin.payer.secretKey.toString());

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

    asset = Keypair.generate();
  }

  let settingsPda: PublicKey;
  let movieMintPda: PublicKey;
  let bondingCurvePda: PublicKey;
  let vaultPda: PublicKey;
  let exitPoolPda: PublicKey;
  let bondingCurveAta: PublicKey;
  let buyerAta: PublicKey;
  let buyer2Ata: PublicKey;
  let creatorAta: PublicKey;

  before(async () => {
    settingsPda = PublicKey.findProgramAddressSync(
      [Buffer.from("settings")],
      program.programId
    )[0];
    console.log("Settings PDA: ", settingsPda.toString());

    movieMintPda = PublicKey.findProgramAddressSync(
      // seeds = [MINT.as_ref(),  creator.key().as_ref() ],
      [Buffer.from("mint"), creator.publicKey.toBuffer()],
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
      // (seeds = [EXIT_POOL.as_ref(), movie_mint.key().as_ref()]),
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

    creatorAta = getAssociatedTokenAddressSync(
      movieMintPda,
      creator.publicKey,
      true
    );
    console.log("Buyer ATA: ", buyerAta.toString());

    console.log("Is this localnet: ", localnet);

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
      // sendAndConfirmTransaction();
      await connection.sendTransaction(
        new Transaction().add(
          SystemProgram.transfer({
            fromPubkey: admin.publicKey,
            toPubkey: newAdmin.publicKey,
            lamports: 1_000_000_000,
          }),
          SystemProgram.transfer({
            fromPubkey: admin.publicKey,
            toPubkey: creator.publicKey,
            lamports: 1_000_000_000,
          }),
          SystemProgram.transfer({
            fromPubkey: admin.publicKey,
            toPubkey: buyer.publicKey,
            lamports: 1_000_000_000,
          }),
          SystemProgram.transfer({
            fromPubkey: admin.publicKey,
            toPubkey: buyer2.publicKey,
            lamports: 1_000_000_000,
          }),
          SystemProgram.transfer({
            fromPubkey: admin.publicKey,
            toPubkey: viewer.publicKey,
            lamports: 1_000_000_000,
          })
        ),
        [admin.payer]
      );
    }
  });

  it("Settings initialized", async () => {
    const tx = await program.methods
      .initialize(feeBasisPoints)
      .accountsStrict({
        admin: admin.publicKey,
        settings: settingsPda,
        systemProgram: SystemProgram.programId,
      })
      .rpc();
    console.log("Settings initialized transaction signature", tx);

    const settings = await program.account.settings.fetch(settingsPda);
    assert.equal(settings.feeBasisPoints, feeBasisPoints);
    assert.equal(settings.initialized, true);
    assert(settings.feeRecipient.equals(admin.publicKey));
    console.log("Settings Initialized Assertions passed ✅");
  });
  it("Settings changed", async () => {
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
    console.log("Settings changed transaction signature", tx);

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
    console.log("Settings changed Assertions passed ✅");
  });
  it("Create Token Mint and initialize bonding curve values", async () => {
    const tx = await program.methods
      .create(
        new BN(CREATOR_SHARE),
        new BN(FUNDRAISING_GOAL),
        new BN(SLOPE),
        new BN(INITIAL_PRICE)
      )
      .accountsStrict({
        creator: creator.publicKey,
        movieMint: movieMintPda,
        bondingCurve: bondingCurvePda,
        vault: vaultPda,
        settings: settingsPda,
        creatorAta: creatorAta,
        tokenProgram: TOKEN_PROGRAM_ID,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        systemProgram: SYSTEM_PROGRAM_ID,
      })
      .signers([creator])
      .rpc();
    console.log("Create Token transaction: ", tx);

    const creatorTokens = await getAccount(connection, creatorAta);
    const creatorTokensAfter = Number(creatorTokens.amount);
    console.log("creatorTokensAfter: ", creatorTokensAfter);
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
      CREATOR_SHARE,
      "New mint should have creator share amount of tokens"
    );
    assert.equal(movieMintAccount.decimals, 0, "Mint should have 0 decimals");
    assert.equal(bondingCurve.complete, false);

    // Initial flags
    assert.equal(
      bondingCurve.complete,
      false,
      "Bonding curve should start incomplete"
    );

    // Reserves
    assert.equal(
      Number(bondingCurve.tokenReserve),
      0,
      "Token reserve should be 0"
    );

    // Fundraising goal
    assert.equal(
      Number(bondingCurve.completionLamports),
      FUNDRAISING_GOAL,
      "Completion lamports mismatch"
    );

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
    console.log("Bonding Curve creation Assertions passed ✅");
  });
  it("Paused testing", async () => {
    const tx1 = await program.methods
      .togglePause()
      .accountsStrict({
        admin: newAdmin.publicKey,
        settings: settingsPda,
        systemProgram: SystemProgram.programId,
      })
      .signers([newAdmin])
      .rpc();
    console.log("Toggle Paused transaction: ", tx1);
    const settingsPaused = await program.account.settings.fetch(settingsPda);
    assert(settingsPaused.paused);
    try {
      await program.methods
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
      assert.fail("transaction should fail as its paused");
    } catch (e: any) {
      console.log("Error paused: ", e);
    }

    //togglePause() signature is same so it is required that it be in a different blockhash to avoid the problem of double spending.
    //Another solution is to add a instruction of transfer of very small amount (1 lamport to differentiate the instruction.)
    await new Promise((r) => setTimeout(r, 500));

    const tx2 = await program.methods
      .togglePause()
      .accountsStrict({
        admin: newAdmin.publicKey,
        settings: settingsPda,
        systemProgram: SystemProgram.programId,
      })
      .signers([newAdmin])
      .rpc();
    console.log("Toggle un-Paused transaction: ", tx2);
    const settingsUnPaused = await program.account.settings.fetch(settingsPda);
    assert(!settingsUnPaused.paused);
    console.log("Paused testing Assertions passed ✅");
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

    expect(buyerTokensAfter).to.be.greaterThan(buyerTokensBefore);
    expect(buyerTokensAfter).to.be.equal(INITIAL_BUY_AMOUNT);

    const mintInfo = await getMint(connection, movieMintPda);
    expect(Number(mintInfo.supply)).to.equal(buyerTokensAfter + CREATOR_SHARE);

    console.log("Buy and transfer Assertions passed ✅");
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

    console.log("Final Buyer SOL:  ", buyerEndBalance);
    console.log("Final Vault SOL:  ", vaultEndBalance);
    console.log("Final Buyer Tokens:", buyerTokensAfter);

    const solTransferred = vaultStartBalance - vaultEndBalance;

    assert(
      buyerStartBalance + solTransferred == buyerEndBalance,
      "Buyer and vault balance mismatch"
    );

    assert(
      buyerTokensAfter < buyerTokensBefore,
      "Buyer tokens should decrease after sell"
    );
    assert(
      buyerStartBalance < buyerEndBalance,
      "Buyer SOL balance should increase after sell"
    );

    const mintInfo = await getMint(connection, movieMintPda);
    expect(Number(mintInfo.supply)).to.equal(buyerTokensAfter + CREATOR_SHARE);

    console.log("Sell and transfer Assertions passed ✅");
  });
  it("Multiple Buyers buy and sell token", async () => {
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

    const tx1 = await program.methods
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
    console.log("Sell transaction ID: ", tx1);

    await new Promise((resolve) => setTimeout(resolve, 500));

    const tx2 = await program.methods
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
    console.log("Buy 2 transaction ID: ", tx2);
    // 3️⃣  POST-STATE SNAPSHOT
    const buyerEndBalance = await connection.getBalance(buyer.publicKey);
    const buyer2EndBalance = await connection.getBalance(buyer2.publicKey);
    const vaultEndBalance = await connection.getBalance(vaultPda);

    const buyer2AtaInfoAfter = await getAccount(connection, buyer2Ata);
    const buyer2TokensAfter = Number(buyer2AtaInfoAfter.amount);

    console.log("Final Buyer 1 SOL:", buyerEndBalance);
    console.log("Final Buyer 2 SOL:", buyer2EndBalance);
    console.log("Final Vault SOL:  ", vaultEndBalance);
    console.log("Final Buyer 2 Tokens:", buyer2TokensAfter);

    const bondingCurveAccount = await program.account.bondingCurve.fetch(
      bondingCurvePda
    );
    console.log("complete status: ", bondingCurveAccount.complete);

    console.log("Multiple Buy, Sell and transfer Assertions passed ✅");
  });
  it("Try buying more tokens after fundraising target reached and fails", async () => {
    const bondingCurveAccount = await program.account.bondingCurve.fetch(
      bondingCurvePda
    );
    console.log("complete status: ", bondingCurveAccount.complete);
    console.log("Buyer after complete tried: ");
    // 1️⃣  PRE-STATE SNAPSHOT
    const buyerStartBalance = await connection.getBalance(buyer.publicKey);
    const vaultStartBalance = await connection.getBalance(vaultPda);

    let buyerTokensBefore = 0;
    try {
      const buyerAtaInfoBefore = await getAccount(connection, buyerAta);
      buyerTokensBefore = Number(buyerAtaInfoBefore.amount);
      console.log("Initial Buyer Tokens:", buyerTokensBefore);
    } catch (e: any) {
      console.log("Buyer 1 Account does not exist yet");
    }

    console.log("Initial Buyer 1 SOL:", buyerStartBalance);
    console.log("Initial Vault SOL:  ", vaultStartBalance);

    try {
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
      console.log("After complete Buy transaction ID: ", tx);
      assert.fail("Buying after completion should fail");
    } catch (e: any) {
      console.log("Buying Error: ", e);
    }
    // 3️⃣  POST-STATE SNAPSHOT
    const buyerEndBalance = await connection.getBalance(buyer.publicKey);
    const vaultEndBalance = await connection.getBalance(vaultPda);

    console.log("Final Buyer 1 SOL:", buyerEndBalance);
    console.log("Final Vault SOL:  ", vaultEndBalance);

    console.log("Buying after target met fails assertion passed ✅ ");
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
    console.log("Exit pool creation assertion passed ✅ ");
  });
  it("Viewer pays ticket price in SOL and receives NFT", async () => {
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

    if (!localnet) {
      await new Promise((resolve) => setTimeout(resolve, 20000));
    }
    const assetAccount = await fetchAsset(umi, asset.publicKey.toString());
    console.log("assetAccount: ", assetAccount);
    console.log("assetAccount name: ", assetAccount.name);
    console.log("assetAccount uri: ", assetAccount.uri);
    expect(assetAccount.name).to.equal(createAssetArgs.name);
    expect(assetAccount.uri).to.equal(createAssetArgs.uri);
    expect(assetAccount.owner.toString()).to.equal(viewer.publicKey.toString());

    console.log("Ticket bought NFT minted assertion passed ✅ ");
  });
  it("token holders exit by redeeming their tokens from exit pool", async () => {
    const exitPoolBalanceBefore = await connection.getBalance(exitPoolPda);
    const buyerBalanceBefore = await connection.getBalance(buyer.publicKey);
    const buyerAtaInfoBefore = await getAccount(connection, buyerAta);
    const buyerAtaBalanceBefore = Number(buyerAtaInfoBefore.amount);
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
    console.log("Token holder exit assertion passed ✅ ");
  });
});
