import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { AnchorDiceGameQ425 } from "../target/types/anchor_dice_game_q4_25";
import {
  Ed25519Program,
  Keypair,
  sendAndConfirmTransaction,
  SystemProgram,
  SYSVAR_INSTRUCTIONS_PUBKEY,
  Transaction,
} from "@solana/web3.js";

describe("anchor-dice-game-q4-25", () => {
  // Configure the client to use the local cluster.
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace
    .anchorDiceGameQ425 as Program<AnchorDiceGameQ425>;

  const player = provider.wallet; // player
  const house = Keypair.generate(); // house of game

  let vault: anchor.web3.PublicKey;
  let bet1PDA: anchor.web3.PublicKey;
  let bet2PDA: anchor.web3.PublicKey;
  let bet3PDA: anchor.web3.PublicKey;
  let bet4PDA: anchor.web3.PublicKey;

  const seed1 = new anchor.BN(1234);
  const seed2 = new anchor.BN(2334);
  const seed3 = new anchor.BN(3456);
  const seed4 = new anchor.BN(4567);

  const roll1 = 50;
  const roll2 = 10;
  const roll3 = 90;
  const roll4 = 50;

  const betAmount = new anchor.BN(1_000_000_000); // 1 SOL

  const bigNumber = BigInt(1_000_000_000); // 1 SOl

  const initialize_amount = new anchor.BN(9_000_000_000); // 9 SOL deposit to vault

  before(async () => {
    // 10 SOL airdrop to user account to play
    console.log(`House wallet: ${house.publicKey}`);
    await provider.connection.requestAirdrop(
      house.publicKey,
      10 * anchor.web3.LAMPORTS_PER_SOL
    );

    await new Promise((resolve) => setTimeout(resolve, 10000));

    const preBalanceHouse = await provider.connection.getBalance(
      house.publicKey,
      "confirmed"
    );

    console.log(`House wallet balance: ${BigInt(preBalanceHouse) / bigNumber}`);

    // Deriving PDAs
    [vault] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("vault"), house.publicKey.toBuffer()],
      program.programId
    );
    [bet1PDA] = anchor.web3.PublicKey.findProgramAddressSync(
      [
        Buffer.from("bet"),
        vault.toBuffer(),
        seed1.toArrayLike(Buffer, "le", 16),
      ],
      program.programId
    );
    [bet2PDA] = anchor.web3.PublicKey.findProgramAddressSync(
      [
        Buffer.from("bet"),
        vault.toBuffer(),
        seed2.toArrayLike(Buffer, "le", 16),
      ],
      program.programId
    );
    [bet3PDA] = anchor.web3.PublicKey.findProgramAddressSync(
      [
        Buffer.from("bet"),
        vault.toBuffer(),
        seed3.toArrayLike(Buffer, "le", 16),
      ],
      program.programId
    );
    [bet4PDA] = anchor.web3.PublicKey.findProgramAddressSync(
      [
        Buffer.from("bet"),
        vault.toBuffer(),
        seed4.toArrayLike(Buffer, "le", 16),
      ],
      program.programId
    );
  });

  describe("Initialize game/vault to play", () => {
    it("Initialize game by transfering amount to vault by house", async () => {
      console.log(`Vault key is: ${vault.toString()}`);
      const ix = await program.methods
        .initialize(initialize_amount)
        .accountsStrict({
          house: house.publicKey,
          vault: vault,
          systemProgram: SystemProgram.programId,
        })
        .signers([house])
        .rpc()
        .then(confirmTx);

      console.log(`Vault Initialized, ix is : ${ix}`);

      const vaultBalance = await provider.connection.getBalance(
        vault,
        "confirmed"
      );
      console.log(`Vault balance is: ${BigInt(vaultBalance) / bigNumber}`);
    });
  });

  describe("First bet", () => {
    it("First bet by Player", async () => {
      console.log(`First bet: ${bet1PDA.toString()}`);
      const ix = await program.methods
        .placeBet(seed1, roll1, betAmount)
        .accountsStrict({
          player: player.publicKey,
          house: house.publicKey,
          vault: vault,
          bet: bet1PDA,
          systemProgram: SystemProgram.programId,
        })
        .signers([player.payer])
        .rpc()
        .then(confirmTx);
      console.log(`Player bet 1 SOL at ${roll1} roll`);
      console.log(`Transaction is: ${ix}`);
    });
    it("Resolving the first bet", async () => {
      const betAccount = await provider.connection.getAccountInfo(
        bet1PDA,
        "confirmed"
      );
      const vaultBefore = await provider.connection.getBalance(
        vault,
        "confirmed"
      );
      const sig_ix = Ed25519Program.createInstructionWithPrivateKey({
        privateKey: house.secretKey,
        message: betAccount.data.subarray(8),
      });
      const ix = await program.methods
        .resolveBet(Buffer.from(sig_ix.data.slice(16 + 32, 16 + 32 + 64)))
        .accountsStrict({
          house: house.publicKey,
          player: player.publicKey,
          vault: vault,
          bet: bet1PDA,
          instructionSysvar: SYSVAR_INSTRUCTIONS_PUBKEY,
          systemProgram: SystemProgram.programId,
        })
        .signers([house])
        .instruction();

      const tx = new Transaction().add(sig_ix).add(ix);
      try {
        await sendAndConfirmTransaction(provider.connection, tx, [house]);
      } catch (error) {
        console.log(`error : ${error}`);
      }
      const vaultAfter = await provider.connection.getBalance(
        vault,
        "confirmed"
      );
      console.log(
        `From first bet player get: ${
          BigInt(vaultBefore - vaultAfter) / bigNumber
        }`
      );
    });
  });
  describe("Second bet", () => {
    it("Second bet by Player", async () => {
      console.log(`Second bet: ${bet2PDA.toString()}`);
      const ix = await program.methods
        .placeBet(seed2, roll2, betAmount)
        .accountsStrict({
          player: player.publicKey,
          house: house.publicKey,
          vault: vault,
          bet: bet2PDA,
          systemProgram: SystemProgram.programId,
        })
        .signers([player.payer])
        .rpc()
        .then(confirmTx);
      console.log(`Player bet 1 SOL at ${roll2} roll`);
      console.log(`Transaction is: ${ix}`);
    });
    it("Resolving the Second bet", async () => {
      const betAccount = await provider.connection.getAccountInfo(
        bet2PDA,
        "confirmed"
      );
      const vaultBefore = await provider.connection.getBalance(
        vault,
        "confirmed"
      );
      const sig_ix = Ed25519Program.createInstructionWithPrivateKey({
        privateKey: house.secretKey,
        message: betAccount.data.subarray(8),
      });
      const ix = await program.methods
        .resolveBet(Buffer.from(sig_ix.data.slice(16 + 32, 16 + 32 + 64)))
        .accountsStrict({
          house: house.publicKey,
          player: player.publicKey,
          vault: vault,
          bet: bet2PDA,
          instructionSysvar: SYSVAR_INSTRUCTIONS_PUBKEY,
          systemProgram: SystemProgram.programId,
        })
        .signers([house])
        .instruction();

      const tx = new Transaction().add(sig_ix).add(ix);
      try {
        await sendAndConfirmTransaction(provider.connection, tx, [house]);
      } catch (error) {
        console.log(`error : ${error}`);
      }
      const vaultAfter = await provider.connection.getBalance(
        vault,
        "confirmed"
      );
      console.log(
        `From Second bet player get: ${
          BigInt(vaultBefore - vaultAfter) / bigNumber
        }`
      );
    });
  });
  describe("Third bet", () => {
    it("Third bet by Player", async () => {
      console.log(`Third bet: ${bet1PDA.toString()}`);
      const ix = await program.methods
        .placeBet(seed3, roll3, betAmount)
        .accountsStrict({
          player: player.publicKey,
          house: house.publicKey,
          vault: vault,
          bet: bet3PDA,
          systemProgram: SystemProgram.programId,
        })
        .signers([player.payer])
        .rpc()
        .then(confirmTx);
      console.log(`Player bet 1 SOL at ${roll3} roll`);
      console.log(`Transaction is: ${ix}`);
    });
    it("Resolving the first bet", async () => {
      const betAccount = await provider.connection.getAccountInfo(
        bet3PDA,
        "confirmed"
      );
      const vaultBefore = await provider.connection.getBalance(
        vault,
        "confirmed"
      );
      const sig_ix = Ed25519Program.createInstructionWithPrivateKey({
        privateKey: house.secretKey,
        message: betAccount.data.subarray(8),
      });
      const ix = await program.methods
        .resolveBet(Buffer.from(sig_ix.data.slice(16 + 32, 16 + 32 + 64)))
        .accountsStrict({
          house: house.publicKey,
          player: player.publicKey,
          vault: vault,
          bet: bet3PDA,
          instructionSysvar: SYSVAR_INSTRUCTIONS_PUBKEY,
          systemProgram: SystemProgram.programId,
        })
        .signers([house])
        .instruction();

      const tx = new Transaction().add(sig_ix).add(ix);
      try {
        await sendAndConfirmTransaction(provider.connection, tx, [house]);
      } catch (error) {
        console.log(`error : ${error}`);
      }
      const vaultAfter = await provider.connection.getBalance(
        vault,
        "confirmed"
      );
      console.log(
        `From Third bet player get: ${
          BigInt(vaultBefore - vaultAfter) / bigNumber
        }`
      );
    });
  });
  describe("Fourth bet", () => {
    it("Fourth bet by Player", async () => {
      console.log(`First bet: ${bet4PDA.toString()}`);
      const ix = await program.methods
        .placeBet(seed4, roll4, betAmount)
        .accountsStrict({
          player: player.publicKey,
          house: house.publicKey,
          vault: vault,
          bet: bet4PDA,
          systemProgram: SystemProgram.programId,
        })
        .signers([player.payer])
        .rpc()
        .then(confirmTx);
      console.log(`Player bet 1 SOL at ${roll4} roll`);
      console.log(`Transaction is: ${ix}`);
    });
    it("Resolving the first bet", async () => {
      const betAccount = await provider.connection.getAccountInfo(
        bet4PDA,
        "confirmed"
      );
      const vaultBefore = await provider.connection.getBalance(
        vault,
        "confirmed"
      );
      const sig_ix = Ed25519Program.createInstructionWithPrivateKey({
        privateKey: house.secretKey,
        message: betAccount.data.subarray(8),
      });
      const ix = await program.methods
        .resolveBet(Buffer.from(sig_ix.data.slice(16 + 32, 16 + 32 + 64)))
        .accountsStrict({
          house: house.publicKey,
          player: player.publicKey,
          vault: vault,
          bet: bet4PDA,
          instructionSysvar: SYSVAR_INSTRUCTIONS_PUBKEY,
          systemProgram: SystemProgram.programId,
        })
        .signers([house])
        .instruction();

      const tx = new Transaction().add(sig_ix).add(ix);
      try {
        await sendAndConfirmTransaction(provider.connection, tx, [house]);
      } catch (error) {
        console.log(`error : ${error}`);
      }
      const vaultAfter = await provider.connection.getBalance(
        vault,
        "confirmed"
      );
      console.log(
        `From Fourth bet player get: ${
          BigInt(vaultBefore - vaultAfter) / bigNumber
        }`
      );
    });
  });
});

const confirmTx = async (signature: string): Promise<string> => {
  const latestblockhash = await anchor
    .getProvider()
    .connection.getLatestBlockhash();
  await anchor.getProvider().connection.confirmTransaction(
    {
      signature,
      ...latestblockhash,
    },
    "confirmed"
  );
  return signature;
};
