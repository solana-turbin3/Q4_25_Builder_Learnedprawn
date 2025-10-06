pub fn add(left: u64, right: u64) -> u64 {
    left + right
}

#[cfg(test)]
mod tests {
    use std::str::FromStr;

    use super::*;
    use solana_client::rpc_client::RpcClient;
    use solana_sdk::{
        instruction::{AccountMeta, Instruction},
        pubkey::Pubkey,
        signature::{Keypair, Signer, read_keypair_file},
        transaction::Transaction,
    };
    use solana_system_interface::program as system_program;

    const RPC_URL: &str = "https://api.devnet.solana.com";
    // const RPC_URL: &str =
    //     "https://turbine-solanad-4cde.devnet.rpcpool.com/9a9da9cf-6db1-47dc-839a-55aca5c9c80a";
    #[test]
    fn it_works() {
        let result = add(2, 2);
        assert_eq!(result, 4);
    }
    #[test]
    fn keygen() {}
    #[test]
    fn claim_airdrop() {}
    #[test]
    fn transfer_sol() {}
    #[test]
    fn submit_rs() {
        let rpc_client = RpcClient::new(RPC_URL);

        let signer = read_keypair_file("turbin3Wallet.json").expect("Couldn't find wallet file");
        println!("singer: {:?}", signer.pubkey());

        let mint = Keypair::new();

        let turbin3_prereq_program =
            Pubkey::from_str("TRBZyQHB3m68FGeVsqTK39Wm4xejadjVhP5MAZaKWDM").unwrap();
        let collection = Pubkey::from_str("5ebsp5RChCGK7ssRZMVMufgVZhd2kFbNaotcZ5UvytN2").unwrap();
        let mpl_core_program =
            Pubkey::from_str("CoREENxT6tW1HoK8ypY1SxRMZTcVPm7R94rH4PZNhX7d").unwrap();
        let system_program = system_program::id();
        let signer_pubkey = signer.pubkey();
        let account_seeds = &[b"prereqs", signer_pubkey.as_ref()];
        let (prereq_pda, _bump) =
            Pubkey::find_program_address(account_seeds, &turbin3_prereq_program);
        let authority_seeds = &[b"collection", collection.as_ref()];
        let (authority, _bump) =
            Pubkey::find_program_address(authority_seeds, &turbin3_prereq_program);
        let data = vec![77, 124, 82, 163, 21, 133, 181, 206];
        let accounts = vec![
            AccountMeta::new(signer.pubkey(), true),     // user signer
            AccountMeta::new(prereq_pda, false),         // PDA account
            AccountMeta::new(mint.pubkey(), true),       // mint keypair
            AccountMeta::new(collection, false),         // collection
            AccountMeta::new_readonly(authority, false), // authority (PDA)
            AccountMeta::new_readonly(mpl_core_program, false), // mpl core program
            AccountMeta::new_readonly(system_program, false), // system program
        ];
        let blockhash = rpc_client
            .get_latest_blockhash()
            .expect("Failed to get recent blockhash");
        println!("blockhash: {:?}", blockhash);
        let instruction = Instruction {
            program_id: turbin3_prereq_program,
            accounts,
            data,
        };
        let transaction = Transaction::new_signed_with_payer(
            &[instruction],
            Some(&signer.pubkey()),
            &[&signer, &mint],
            blockhash,
        );
        let signature = rpc_client
            .send_and_confirm_transaction(&transaction)
            .expect("Failed to send transaction");
        println!(
            "Success! Check out your TX here:\nhttps://explorer.solana.com/tx/{}/?cluster=devnet",
            signature
        );
    }
}
