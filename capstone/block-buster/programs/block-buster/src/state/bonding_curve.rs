use anchor_lang::prelude::*;

#[derive(InitSpace)]
#[account]
pub struct BondingCurve {
    pub mint: Pubkey,
    pub completion_lamports: u64,
    pub token_reserve: u64,
    pub sol_reserve: u64,
    pub total_token_supply: u64,
    pub complete: bool,
    pub initializer: Pubkey,
    pub curve_bump: u8,
    pub vault_bump: u8,
}
