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

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        ctx.accounts.initialize_settings(&ctx.bumps)
    }
}
