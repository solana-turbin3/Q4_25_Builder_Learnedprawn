// import * as anchor from "@coral-xyz/anchor";
// import { Program } from "@coral-xyz/anchor";
// import { AnchorAmmQ425 } from "../target/types/anchor_amm_q4_25";
// import { expect } from "chai";
// import {
//   mintTo,
//   ASSOCIATED_TOKEN_PROGRAM_ID,
//   createMint,
//   getAssociatedTokenAddress,
//   getAssociatedTokenAddressSync,
//   createAssociatedTokenAccountInstruction,
// } from "@solana/spl-token";
// import { TOKEN_PROGRAM_ID } from "@coral-xyz/anchor/dist/cjs/utils/token";
//
// describe("anchor-amm-q4-25", () => {
//   // Configure the client to use the local cluster.
//   const provider = anchor.AnchorProvider.env();
//   anchor.setProvider(anchor.AnchorProvider.env());
//
//   const program = anchor.workspace.anchorAmmQ425 as Program<AnchorAmmQ425>;
//
//   const initializer = provider.wallet.publicKey;
//   const user = anchor.web3.Keypair.generate();
//
//   let mintX: anchor.web3.PublicKey;
//   let mintY: anchor.web3.PublicKey;
//
//   const seed = new anchor.BN(1);
//   const fee = 11;
//
//   let configPda: anchor.web3.PublicKey;
//   let configBump: number;
//
//   let mintLpPda: anchor.web3.PublicKey;
//   let mintLpBump: number;
//
//   let vaultX: anchor.web3.PublicKey;
//   let vaultY: anchor.web3.PublicKey;
//
//   let userX: anchor.web3.PublicKey;
//   let userY: anchor.web3.PublicKey;
//   let userLp: anchor.web3.PublicKey;
//
//   before(async () => {
//     await provider.connection.requestAirdrop(
//       initializer,
//       10 * anchor.web3.LAMPORTS_PER_SOL
//     );
//     await provider.connection.requestAirdrop(
//       user.publicKey,
//       10 * anchor.web3.LAMPORTS_PER_SOL
//     );
//     await new Promise((resolve) => setTimeout(resolve, 1000));
//
//     mintX = await createMint(
//       provider.connection,
//       provider.wallet.payer,
//       initializer,
//       null,
//       0
//     );
//     mintY = await createMint(
//       provider.connection,
//       provider.wallet.payer,
//       initializer,
//       null,
//       0
//     );
//
//     [configPda, configBump] = anchor.web3.PublicKey.findProgramAddressSync(
//       [Buffer.from("config"), seed.toArrayLike(Buffer, "le", 8)],
//       program.programId
//     );
//     [mintLpPda, mintLpBump] = anchor.web3.PublicKey.findProgramAddressSync(
//       [Buffer.from("lp"), configPda.toBuffer()],
//       program.programId
//     );
//   });
//
//   it("Initialize amm and deposit", async () => {
//     // Add your test here.
//     vaultX = getAssociatedTokenAddressSync(mintX, configPda, true);
//     console.log(vaultX.toBase58()); // should match vault_x in transaction logs
//
//     vaultY = getAssociatedTokenAddressSync(mintY, configPda, true);
//     console.log(vaultY.toBase58()); // should match vault_x in transaction logs
//
//     await program.methods
//       .initialize(seed, fee, initializer)
//       .accountsStrict({
//         initializer,
//         mintX,
//         mintY,
//         mintLp: mintLpPda,
//         vaultX,
//         vaultY,
//         config: configPda,
//         tokenProgram: TOKEN_PROGRAM_ID,
//         associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
//         systemProgram: anchor.web3.SystemProgram.programId,
//       })
//       .rpc();
//
//     const ammAccount = await program.account.config.fetch(configPda);
//     // expect(ammAccount.seed.abs()).to.equal(seed);
//     expect(ammAccount.authority.toBase58()).to.equal(initializer.toBase58());
//     expect(ammAccount.mintX.toBase58()).to.equal(mintX.toBase58());
//     expect(ammAccount.mintY.toBase58()).to.equal(mintY.toBase58());
//     expect(ammAccount.fee).to.equal(fee);
//     expect(ammAccount.locked).to.equal(false);
//     expect(ammAccount.configBump).to.equal(configBump);
//     expect(ammAccount.lpBump).to.equal(mintLpBump);
//
//     userX = getAssociatedTokenAddressSync(mintX, initializer, true);
//     // makerAtaA = getAssociatedTokenAddressSync(mintA, maker);
//     const userXTx = new anchor.web3.Transaction().add(
//       createAssociatedTokenAccountInstruction(
//         initializer,
//         userX,
//         initializer,
//         mintX
//       )
//     );
//     await mintTo(
//       provider.connection,
//       provider.wallet.payer,
//       mintX,
//       userX,
//       provider.wallet.publicKey,
//       10 * 2
//     );
//     await provider.sendAndConfirm(userXTx);
//     console.log("userX: ", userX);
//     userY = getAssociatedTokenAddressSync(mintY, initializer, true);
//     const userYTx = new anchor.web3.Transaction().add(
//       createAssociatedTokenAccountInstruction(
//         initializer,
//         userY,
//         initializer,
//         mintY
//       )
//     );
//     await mintTo(
//       provider.connection,
//       provider.wallet.payer,
//       mintY,
//       userY,
//       provider.wallet.publicKey,
//       10 * 2
//     );
//     await provider.sendAndConfirm(userYTx);
//     console.log("userY: ", userY);
//     userLp = getAssociatedTokenAddressSync(mintLpPda, initializer, true);
//
//     console.log("user: ", initializer);
//     await program.methods
//       .deposit(new anchor.BN(10), new anchor.BN(10), new anchor.BN(10))
//       .accountsStrict({
//         user: initializer,
//         mintX,
//         mintY,
//         config: configPda,
//         mintLp: mintLpPda,
//         vaultX,
//         vaultY,
//         userX,
//         userY,
//         userLp,
//         tokenProgram: TOKEN_PROGRAM_ID,
//         associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
//         systemProgram: anchor.web3.SystemProgram.programId,
//       })
//       .rpc();
//   });
// });
// Delimiter
import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { AnchorAmmQ425 } from "../target/types/anchor_amm_q4_25";
import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  createMint,
  getAccount,
  getOrCreateAssociatedTokenAccount,
  mintTo,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import { assert } from "chai";

describe("anchor-amm-q4-25", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.anchorAmmQ425 as Program<AnchorAmmQ425>;

  const user = provider.wallet.publicKey;

  //   Defining all account here
  let mintX: anchor.web3.PublicKey;
  let mintY: anchor.web3.PublicKey;
  let mintLp: anchor.web3.PublicKey;
  let configPDA: anchor.web3.PublicKey;
  let vaultX: anchor.web3.PublicKey;
  let vaultY: anchor.web3.PublicKey;
  let userX: anchor.web3.PublicKey;
  let userY: anchor.web3.PublicKey;
  let userLP: anchor.web3.PublicKey;

  const SIX_DECIMAL = BigInt(1_000_000);

  const seed = new anchor.BN(9876);
  const fee = 10;
  const initialAmount = 10_000_000_000; // 10,000 tokens

  before(async () => {
    await provider.connection.requestAirdrop(
      user,
      10 * anchor.web3.LAMPORTS_PER_SOL
    );

    // creating mint for tokens X and Y
    mintX = await createMint(
      provider.connection,
      provider.wallet.payer,
      user,
      null,
      6
    );
    mintY = await createMint(
      provider.connection,
      provider.wallet.payer,
      user,
      null,
      6
    );

    // create ATA for token X and Y for user
    const userXInfo = await getOrCreateAssociatedTokenAccount(
      provider.connection,
      provider.wallet.payer,
      mintX,
      user
    );
    userX = userXInfo.address;
    const userYInfo = await getOrCreateAssociatedTokenAccount(
      provider.connection,
      provider.wallet.payer,
      mintY,
      user
    );
    userY = userYInfo.address;

    // mint initial tokens to user
    await mintTo(
      provider.connection,
      provider.wallet.payer,
      mintX,
      userX,
      user,
      initialAmount
    );
    await mintTo(
      provider.connection,
      provider.wallet.payer,
      mintY,
      userY,
      user,
      initialAmount
    );

    // Deriving PDAs
    [configPDA] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("config"), seed.toArrayLike(Buffer, "le", 8)],
      program.programId
    );

    [mintLp] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("lp"), configPDA.toBuffer()],
      program.programId
    );

    [vaultX] = anchor.web3.PublicKey.findProgramAddressSync(
      [configPDA.toBuffer(), TOKEN_PROGRAM_ID.toBuffer(), mintX.toBuffer()],
      ASSOCIATED_TOKEN_PROGRAM_ID
    );

    [vaultY] = anchor.web3.PublicKey.findProgramAddressSync(
      [configPDA.toBuffer(), TOKEN_PROGRAM_ID.toBuffer(), mintY.toBuffer()],
      ASSOCIATED_TOKEN_PROGRAM_ID
    );

    [userLP] = anchor.web3.PublicKey.findProgramAddressSync(
      [
        provider.wallet.publicKey.toBuffer(),
        TOKEN_PROGRAM_ID.toBuffer(),
        mintLp.toBuffer(),
      ],
      ASSOCIATED_TOKEN_PROGRAM_ID
    );
  });

  it("Initialize AMM pool", async () => {
    const tx = await program.methods
      .initialize(seed, fee, user)
      .accountsStrict({
        initializer: user,
        mintX: mintX,
        mintY: mintY,
        mintLp: mintLp,
        vaultX: vaultX,
        vaultY: vaultY,
        config: configPDA,
        tokenProgram: TOKEN_PROGRAM_ID,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .rpc();

    console.log("AMM pool initialised, tx is: ", tx);

    const configAccount = await program.account.config.fetch(configPDA);
    assert.equal(configAccount.seed.toString(), seed.toString());
    assert.equal(configAccount.fee, fee);
    assert.equal(configAccount.mintX.toString(), mintX.toString());
    assert.equal(configAccount.mintY.toString(), mintY.toString());
    assert.equal(configAccount.locked, false);
  });

  it("Initial Deposit to Liquidity", async () => {
    const depositMaxX = new anchor.BN(1_000_000_000); // lets keep max_x = 1000 tokens
    const depositMaxY = new anchor.BN(2_000_000_000); // lets keep max_y = 2000 tokens

    console.log(
      `In this case depositMaxX is: ${
        BigInt(depositMaxX.toString()) / SIX_DECIMAL
      }`
    );
    console.log(
      `In this case depositMaxY is: ${
        BigInt(depositMaxY.toString()) / SIX_DECIMAL
      }`
    );
    console.log(
      `In this case amount to be deposit is: ${
        BigInt(1_000_000_000) / SIX_DECIMAL
      }`
    );
    const tx = await program.methods
      .deposit(new anchor.BN(1_000_000_000), depositMaxX, depositMaxY)
      .accountsStrict({
        user: user,
        mintX: mintX,
        mintY: mintY,
        config: configPDA,
        mintLp: mintLp,
        vaultX: vaultX,
        vaultY: vaultY,
        userX: userX,
        userY: userY,
        userLp: userLP,
        tokenProgram: TOKEN_PROGRAM_ID,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .rpc();

    console.log("Deposit successful, tx is: ", tx);

    const vaultXAccount = await getAccount(provider.connection, vaultX);
    const vaultYAccount = await getAccount(provider.connection, vaultY);
    const userLpAccountInfo = await getAccount(provider.connection, userLP);

    console.log(
      `Vault X balance: ${
        BigInt(vaultXAccount.amount.toString()) / SIX_DECIMAL
      } Tokens`
    );
    console.log(
      `Vault Y balance: ${
        BigInt(vaultYAccount.amount.toString()) / SIX_DECIMAL
      } Tokens`
    );
    console.log(
      `User LP balance: ${
        BigInt(userLpAccountInfo.amount.toString()) / SIX_DECIMAL
      } LP tokens`
    );

    assert.equal(
      userLpAccountInfo.amount.toString(),
      new anchor.BN(1_000_000_000).toString()
    );
    assert.ok(
      vaultXAccount.amount <= depositMaxX.toNumber(),
      "Slippage exceed"
    );
    assert.ok(
      vaultYAccount.amount <= depositMaxY.toNumber(),
      "Slippage exceed"
    );
  });
  it("Second deposit to Liquidity", async () => {
    const depositMaxX = new anchor.BN(100_000_000); // lets keep max_x = 100 tokens
    const depositMaxY = new anchor.BN(200_000_000); // lets keep max_y = 200 tokens

    console.log(
      `In this case depositMaxX is: ${
        BigInt(depositMaxX.toString()) / SIX_DECIMAL
      }`
    );
    console.log(
      `In this case depositMaxY is: ${
        BigInt(depositMaxY.toString()) / SIX_DECIMAL
      }`
    );
    console.log(
      `In this case amount to be deposit is: ${
        BigInt(100_000_000) / SIX_DECIMAL
      }`
    );

    const tx = await program.methods
      .deposit(new anchor.BN(100_000_000), depositMaxX, depositMaxY)
      .accountsStrict({
        user: user,
        mintX: mintX,
        mintY: mintY,
        config: configPDA,
        mintLp: mintLp,
        vaultX: vaultX,
        vaultY: vaultY,
        userX: userX,
        userY: userY,
        userLp: userLP,
        tokenProgram: TOKEN_PROGRAM_ID,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .rpc();

    console.log("Second Deposit successful, tx is: ", tx);

    const vaultXAccount = await getAccount(provider.connection, vaultX);
    const vaultYAccount = await getAccount(provider.connection, vaultY);
    const userLpAccountInfo = await getAccount(provider.connection, userLP);

    console.log(
      `Vault X balance: ${
        BigInt(vaultXAccount.amount.toString()) / SIX_DECIMAL
      } Tokens`
    );
    console.log(
      `Vault Y balance: ${
        BigInt(vaultYAccount.amount.toString()) / SIX_DECIMAL
      } Tokens`
    );
    console.log(
      `User LP balance: ${
        BigInt(userLpAccountInfo.amount.toString()) / SIX_DECIMAL
      } LP tokens`
    );

    assert.equal(
      userLpAccountInfo.amount.toString(),
      new anchor.BN(1_100_000_000).toString()
    );
  });

  it("Swap 100 token X for token Y", async () => {
    const swapAmount = new anchor.BN(100_000_000);
    const min = new anchor.BN(1);

    const userXAmountBefore = await getAccount(provider.connection, userX);
    const userYAmountBefore = await getAccount(provider.connection, userY);

    const tx = await program.methods
      .swap(true, swapAmount, min)
      .accountsStrict({
        user: user,
        mintX: mintX,
        mintY: mintY,
        config: configPDA,
        mintLp: mintLp,
        vaultX: vaultX,
        vaultY: vaultY,
        userX: userX,
        userY: userY,
        userLp: userLP,
        tokenProgram: TOKEN_PROGRAM_ID,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .rpc();

    console.log("Swap successful, tx is: ", tx);

    const userXAmountAfter = await getAccount(provider.connection, userX);
    const userYAmountAfter = await getAccount(provider.connection, userY);

    assert.ok(
      userXAmountAfter.amount < userXAmountBefore.amount,
      "User X balance should decrease"
    );
    assert.ok(
      userYAmountAfter.amount > userYAmountBefore.amount,
      "User Y balance should increase"
    );

    console.log(
      `User have Initial X token: ${
        BigInt(userXAmountBefore.amount.toString()) / SIX_DECIMAL
      } Tokens`
    );
    console.log(
      `User have Initial Y token: ${
        BigInt(userYAmountBefore.amount.toString()) / SIX_DECIMAL
      } Tokens`
    );
    console.log(
      `User have After X token: ${
        BigInt(userXAmountAfter.amount.toString()) / SIX_DECIMAL
      } Tokens`
    );
    console.log(
      `User have After Y token: ${
        BigInt(userYAmountAfter.amount.toString()) / SIX_DECIMAL
      } Tokens`
    );

    console.log(
      `X balance change: ${
        BigInt(
          (userXAmountBefore.amount - userXAmountAfter.amount).toString()
        ) / SIX_DECIMAL
      }`
    );
    console.log(
      `Y balance change: ${
        BigInt(
          (userYAmountAfter.amount - userYAmountBefore.amount).toString()
        ) / SIX_DECIMAL
      }`
    );
  });

  it("now Swap 150 token X for token Y", async () => {
    const swapAmount = new anchor.BN(150_000_000);
    const min = new anchor.BN(1);

    const userXAmountBefore = await getAccount(provider.connection, userX);
    const userYAmountBefore = await getAccount(provider.connection, userY);

    const tx = await program.methods
      .swap(true, swapAmount, min)
      .accountsStrict({
        user: user,
        mintX: mintX,
        mintY: mintY,
        config: configPDA,
        mintLp: mintLp,
        vaultX: vaultX,
        vaultY: vaultY,
        userX: userX,
        userY: userY,
        userLp: userLP,
        tokenProgram: TOKEN_PROGRAM_ID,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .rpc();

    console.log("Swap successful, tx is: ", tx);

    const userXAmountAfter = await getAccount(provider.connection, userX);
    const userYAmountAfter = await getAccount(provider.connection, userY);

    assert.ok(
      userXAmountAfter.amount < userXAmountBefore.amount,
      "User X balance should decrease"
    );
    assert.ok(
      userYAmountAfter.amount > userYAmountBefore.amount,
      "User Y balance should increase"
    );

    console.log(
      `User have Initial X token: ${
        BigInt(userXAmountBefore.amount.toString()) / SIX_DECIMAL
      } Tokens`
    );
    console.log(
      `User have Initial Y token: ${
        BigInt(userYAmountBefore.amount.toString()) / SIX_DECIMAL
      } Tokens`
    );
    console.log(
      `User have After X token: ${
        BigInt(userXAmountAfter.amount.toString()) / SIX_DECIMAL
      } Tokens`
    );
    console.log(
      `User have After Y token: ${
        BigInt(userYAmountAfter.amount.toString()) / SIX_DECIMAL
      } Tokens`
    );

    console.log(
      `X balance change: ${
        BigInt(
          (userXAmountBefore.amount - userXAmountAfter.amount).toString()
        ) / SIX_DECIMAL
      }`
    );
    console.log(
      `Y balance change: ${
        BigInt(
          (userYAmountAfter.amount - userYAmountBefore.amount).toString()
        ) / SIX_DECIMAL
      }`
    );
  });

  it("Swap 150 token Y for token X", async () => {
    const swapAmount = new anchor.BN(150_000_000);
    const min = new anchor.BN(1);

    const userXAmountBefore = await getAccount(provider.connection, userX);
    const userYAmountBefore = await getAccount(provider.connection, userY);

    const tx = await program.methods
      .swap(false, swapAmount, min)
      .accountsStrict({
        user: user,
        mintX: mintX,
        mintY: mintY,
        config: configPDA,
        mintLp: mintLp,
        vaultX: vaultX,
        vaultY: vaultY,
        userX: userX,
        userY: userY,
        userLp: userLP,
        tokenProgram: TOKEN_PROGRAM_ID,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .rpc();

    console.log("Swap successful, tx is: ", tx);

    const userXAmountAfter = await getAccount(provider.connection, userX);
    const userYAmountAfter = await getAccount(provider.connection, userY);

    assert.ok(
      userXAmountAfter.amount > userXAmountBefore.amount,
      "User X balance should decrease"
    );
    assert.ok(
      userYAmountAfter.amount < userYAmountBefore.amount,
      "User Y balance should increase"
    );

    console.log(
      `User have Initial X token: ${
        BigInt(userXAmountBefore.amount.toString()) / SIX_DECIMAL
      } Tokens`
    );
    console.log(
      `User have Initial Y token: ${
        BigInt(userYAmountBefore.amount.toString()) / SIX_DECIMAL
      } Tokens`
    );
    console.log(
      `User have After X token: ${
        BigInt(userXAmountAfter.amount.toString()) / SIX_DECIMAL
      } Tokens`
    );
    console.log(
      `User have After Y token: ${
        BigInt(userYAmountAfter.amount.toString()) / SIX_DECIMAL
      } Tokens`
    );

    console.log(
      `X balance change: ${
        BigInt(
          (userXAmountAfter.amount - userXAmountBefore.amount).toString()
        ) / SIX_DECIMAL
      }`
    );
    console.log(
      `Y balance change: ${
        BigInt(
          (userYAmountBefore.amount - userYAmountAfter.amount).toString()
        ) / SIX_DECIMAL
      }`
    );
  });

  it("Withdraws liquidity from the pool", async () => {
    const userLpBefore = await getAccount(provider.connection, userLP);
    const withdrawAmount = Number(userLpBefore.amount.toString()) / 2; // Withdraw half

    const userXBefore = await getAccount(provider.connection, userX);
    const userYBefore = await getAccount(provider.connection, userY);

    const tx = await program.methods
      .withdraw(
        new anchor.BN(withdrawAmount.toString()),
        new anchor.BN(0),
        new anchor.BN(0)
      )
      .accountsStrict({
        user: user,
        mintX: mintX,
        mintY: mintY,
        config: configPDA,
        mintLp: mintLp,
        vaultX: vaultX,
        vaultY: vaultY,
        userX: userX,
        userY: userY,
        userLp: userLP,
        tokenProgram: TOKEN_PROGRAM_ID,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .rpc();

    console.log("Withdraw transaction signature:", tx);

    const userLpAfter = await getAccount(provider.connection, userLP);
    const userXAfter = await getAccount(provider.connection, userX);
    const userYAfter = await getAccount(provider.connection, userY);

    assert.ok(
      userLpAfter.amount < userLpBefore.amount,
      "LP balance should decrease"
    );
    assert.ok(
      userXAfter.amount > userXBefore.amount,
      "User X balance should increase"
    );
    assert.ok(
      userYAfter.amount > userYBefore.amount,
      "User Y balance should increase"
    );

    console.log(
      `LP tokens burned: ${
        BigInt((userLpBefore.amount - userLpAfter.amount).toString()) /
        SIX_DECIMAL
      }`
    );
    console.log(
      `X received: ${
        BigInt((userXAfter.amount - userXBefore.amount).toString()) /
        SIX_DECIMAL
      }`
    );
    console.log(
      `Y received:", ${
        BigInt((userYAfter.amount - userYBefore.amount).toString()) /
        SIX_DECIMAL
      }`
    );
  });
});
