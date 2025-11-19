pub mod constants;
pub mod error;
pub mod instructions;
pub mod state;

use anchor_lang::prelude::*;

pub use constants::*;
pub use instructions::*;
pub use state::*;

declare_id!("8uDndoDUtLqD3fhiZdKk9HAuQd3dVcbEkPNYS68iq5rZ");

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
        // name: String,
        // symbol: String,
        // uri: String,
        initializer_share: u64,
        total_fundraising: u64,
        slope: u64,
        initial_price: u64,
    ) -> Result<()> {
        ctx.accounts.create(
            // name,
            // symbol,
            // uri,
            initializer_share,
            total_fundraising,
            slope,
            initial_price,
            &ctx.bumps,
        )
    }
    pub fn toggle_pause(ctx: Context<TogglePause>) -> Result<()> {
        ctx.accounts.toggle_pause()
    }
    pub fn buy(ctx: Context<Buy>, amount_in_sol: u64) -> Result<()> {
        ctx.accounts.buy(amount_in_sol, &ctx.bumps)
    }
    pub fn sell(ctx: Context<Sell>, amount_in_sol: u64) -> Result<()> {
        ctx.accounts.sell(amount_in_sol, &ctx.bumps)
    }
    pub fn release(ctx: Context<Release>, ticket_price: u64) -> Result<()> {
        ctx.accounts.release(ticket_price, &ctx.bumps)
    }
    pub fn watch(ctx: Context<Watch>, args: TicketNftArgs) -> Result<()> {
        ctx.accounts.watch(&ctx.bumps)?;
        ctx.accounts.mint_nft_ticket(args, &ctx.bumps)
    }
    pub fn exit(ctx: Context<Exit>, amount_in_tokens: u64) -> Result<()> {
        ctx.accounts.exit(amount_in_tokens, &ctx.bumps)
    }
}
