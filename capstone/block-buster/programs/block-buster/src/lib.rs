pub mod constants;
pub mod error;
pub mod instructions;
pub mod state;

use anchor_lang::prelude::*;

pub use constants::*;
pub use instructions::*;
pub use state::*;

declare_id!("BN61uwvvUDGr9RwdHt5MNxT3ci4VNVxiC9Uxh5zdVU7X");

#[program]
pub mod block_buster {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>, fee_basis_points: u8) -> Result<()> {
        ctx.accounts
            .initialize_settings(fee_basis_points, &ctx.bumps)
    }
    pub fn set_settings(
        ctx: Context<SetSettings>,
        paused: bool,
        new_admin: Pubkey,
        fee_basis_points: u8,
    ) -> Result<()> {
        ctx.accounts
            .set_settings(paused, new_admin, fee_basis_points, &ctx.bumps)
    }

    pub fn create(
        ctx: Context<Create>,
        name: String,
        symbol: String,
        uri: String,
        initializer_share: u64,
        total_fundraising: u64,
    ) -> Result<()> {
        ctx.accounts.create(
            name,
            symbol,
            uri,
            initializer_share,
            total_fundraising,
            &ctx.bumps,
        )
    }
}
