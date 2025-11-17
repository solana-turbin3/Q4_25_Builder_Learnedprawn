use anchor_lang::{
    prelude::*,
    system_program::{transfer, Transfer},
};
use anchor_spl::token::{Mint, Token};

use crate::{
    error::BlockBusterError, state::Settings, BondingCurve, CURVE, EXIT_POOL, MINT, SETTINGS,
    SUPPLY, VAULT_CURVE,
};

#[derive(Accounts)]
pub struct Release<'info> {
    #[account(mut)]
    pub creator: Signer<'info>,

    #[account(
        seeds = [MINT.as_ref(),  creator.key().as_ref() ],
        mint::decimals = 0,
        mint::authority = bonding_curve,
        bump
    )]
    pub movie_mint: Account<'info, Mint>,

    #[account(
        mut,
        seeds = [CURVE.as_ref(), movie_mint.key().as_ref()],
        bump
    )]
    pub bonding_curve: Account<'info, BondingCurve>,

    #[account(
        mut,
        seeds = [EXIT_POOL.as_ref(), movie_mint.key().as_ref()],
        bump
    )]
    pub exit_pool: SystemAccount<'info>,

    pub system_program: Program<'info, System>,
}

impl<'info> Release<'info> {
    pub fn release(&mut self, ticket_price: u64, bumps: &ReleaseBumps) -> Result<()> {
        let rent_exempt: u64 =
            Rent::get()?.minimum_balance(self.exit_pool.to_account_info().data_len());
        let cpi_program = self.system_program.to_account_info();
        let cpi_accounts = Transfer {
            from: self.creator.to_account_info(),
            to: self.exit_pool.to_account_info(),
        };
        let cpi_context = CpiContext::new(cpi_program, cpi_accounts);
        transfer(cpi_context, rent_exempt)?;
        self.bonding_curve.ticket_price = ticket_price;
        Ok(())
    }
}
