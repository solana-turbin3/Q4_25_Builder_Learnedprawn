use anchor_lang::prelude::*;

//TODO: Use metadata to store name and uri maybe.
#[derive(InitSpace)]
#[account]
pub struct BondingCurve {
    pub mint: Pubkey,
    #[max_len(10)]
    pub name: String,
    #[max_len(10)]
    pub uri: String,
    pub completion_lamports: u64,
    pub token_reserve: u64,
    pub sol_reserve: u64,
    pub total_token_supply: u64,
    pub complete: bool,
    pub initializer: Pubkey,
    pub initializer_share: u64,
    pub curve_bump: u8,
    pub vault_bump: u8,
}
