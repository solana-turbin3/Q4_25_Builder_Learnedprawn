import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { AnchorAmmQ425 } from "../target/types/anchor_amm_q4_25";
import { expect } from "chai";
import { mintTo, ASSOCIATED_TOKEN_PROGRAM_ID, createMint, getAssociatedTokenAddress, getAssociatedTokenAddressSync, createAssociatedTokenAccountInstruction } from "@solana/spl-token";
import { TOKEN_PROGRAM_ID } from "@coral-xyz/anchor/dist/cjs/utils/token";

describe("anchor-amm-q4-25", () => {
    // Configure the client to use the local cluster.
    const provider = anchor.AnchorProvider.env();
    anchor.setProvider(anchor.AnchorProvider.env());

    const program = anchor.workspace.anchorAmmQ425 as Program<AnchorAmmQ425>;

    const initializer = provider.wallet.publicKey;
    const user = anchor.web3.Keypair.generate();

    let mintX: anchor.web3.PublicKey;
    let mintY: anchor.web3.PublicKey;

    const seed = new anchor.BN(1);
    const fee = 10;
    let configPda: anchor.web3.PublicKey;
    let configBump: number;
    let mintLpPda: anchor.web3.PublicKey;
    let mintLpBump: number;

    let vaultX: anchor.web3.PublicKey;
    let vaultY: anchor.web3.PublicKey;

    let userX: anchor.web3.PublicKey;
    let userY: anchor.web3.PublicKey;
    let userLp: anchor.web3.PublicKey;

    before(async () => {
        await provider.connection.requestAirdrop(
            initializer,
            10 * anchor.web3.LAMPORTS_PER_SOL
        );
        await provider.connection.requestAirdrop(
            user.publicKey,
            10 * anchor.web3.LAMPORTS_PER_SOL
        );
        await new Promise((resolve) => setTimeout(resolve, 1000));

        mintX = await createMint(provider.connection, provider.wallet.payer, initializer, null, 0);
        mintY = await createMint(provider.connection, provider.wallet.payer, initializer, null, 0);
    });
    it("Initialize amm and deposit", async () => {
        // Add your test here.
        [configPda, configBump] = anchor.web3.PublicKey.findProgramAddressSync([Buffer.from("config"), seed.toArrayLike(Buffer, "le", 8)], program.programId);
        [mintLpPda, mintLpBump] = anchor.web3.PublicKey.findProgramAddressSync([Buffer.from("lp"), configPda.toBuffer()], program.programId);
        vaultX = getAssociatedTokenAddressSync(mintX, configPda, true);
        vaultY = getAssociatedTokenAddressSync(mintY, configPda, true);

        await program.methods.initialize(seed, fee, initializer).accountsStrict({ initializer, mintX, mintY, mintLp: mintLpPda, vaultX, vaultY, config: configPda, tokenProgram: TOKEN_PROGRAM_ID, associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID, systemProgram: anchor.web3.SystemProgram.programId }).rpc()

        const ammAccount = await program.account.config.fetch(configPda);
        // expect(ammAccount.seed.abs()).to.equal(seed);
        expect(ammAccount.authority.toBase58()).to.equal(initializer.toBase58());
        expect(ammAccount.mintX.toBase58()).to.equal(mintX.toBase58());
        expect(ammAccount.mintY.toBase58()).to.equal(mintY.toBase58());
        expect(ammAccount.fee).to.equal(fee);
        expect(ammAccount.locked).to.equal(false);
        expect(ammAccount.configBump).to.equal(configBump);
        expect(ammAccount.lpBump).to.equal(mintLpBump);


        userX = getAssociatedTokenAddressSync(mintX, initializer, true);
        // makerAtaA = getAssociatedTokenAddressSync(mintA, maker);
        const userXTx = new anchor.web3.Transaction().add(
            createAssociatedTokenAccountInstruction(
                initializer,
                userX,
                initializer,
                mintX
            )
        );
        await mintTo(
            provider.connection,
            provider.wallet.payer,
            mintX,
            userX,
            provider.wallet.publicKey,
            10 * 2
        );
        await provider.sendAndConfirm(userXTx);
        console.log("userX: ", userX);
        userY = getAssociatedTokenAddressSync(mintY, initializer, true);
        const userYTx = new anchor.web3.Transaction().add(
            createAssociatedTokenAccountInstruction(
                initializer,
                userY,
                initializer,
                mintY
            )
        );
        await mintTo(
            provider.connection,
            provider.wallet.payer,
            mintY,
            userY,
            provider.wallet.publicKey,
            10 * 2
        );
        await provider.sendAndConfirm(userYTx);
        console.log("userY: ", userY);
        userLp = getAssociatedTokenAddressSync(mintLpPda, initializer, true);

        console.log("user: ", initializer);
        await program.methods.deposit(new anchor.BN(10), new anchor.BN(10), new anchor.BN(10)).accountsStrict({ user: initializer, mintX, mintY, config: configPda, mintLp: mintLpPda, vaultX, vaultY, userX, userY, userLp, tokenProgram: TOKEN_PROGRAM_ID, associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID, systemProgram: anchor.web3.SystemProgram.programId }).rpc()


    });

});
