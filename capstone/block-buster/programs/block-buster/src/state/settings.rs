use anchor_lang::prelude::*;

#[derive(InitSpace)]
#[account]
pub struct Settings {
    pub initialized: bool,
    pub paused: bool,
    pub authority: Pubkey,
    pub fee_recipient: Pubkey,
    pub fee_basis_points: u8,
    pub supply: u64,
    pub bump: u8,
}
