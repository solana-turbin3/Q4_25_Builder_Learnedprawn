use anchor_lang::{
    prelude::*,
    system_program::{transfer, Transfer},
};
use anchor_spl::token::{burn, Burn, Mint, Token, TokenAccount};

use crate::{
    error::BlockBusterError, state::Settings, BondingCurve, CURVE, EXIT_POOL, MINT, SETTINGS,
    SUPPLY, VAULT_CURVE,
};

#[derive(Accounts)]
pub struct Exit<'info> {
    #[account(mut)]
    pub exiter: Signer<'info>,

    #[account(
        seeds = [MINT.as_ref(), bonding_curve.name.as_bytes().as_ref(), bonding_curve.initializer.key().as_ref() ],
        mint::decimals = 6,
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

    #[account(
        mut,
        associated_token::mint = movie_mint,
        associated_token::authority = exiter,
    )]
    pub buyer_ata: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

impl<'info> Exit<'info> {
    pub fn exit(&mut self, amount_in_tokens: u64, bumps: &ExitBumps) -> Result<()> {
        let signer_seeds: &[&[&[u8]]] = &[&[
            CURVE,
            &self.movie_mint.to_account_info().key.as_ref(),
            &[bumps.bonding_curve],
        ]];

        let burn_accounts = Burn {
            authority: self.exiter.to_account_info(),
            mint: self.movie_mint.to_account_info(),
            from: self.buyer_ata.to_account_info(),
        };

        let burn_context = CpiContext::new_with_signer(
            self.token_program.to_account_info(),
            burn_accounts,
            signer_seeds,
        );

        //TODO: decimal precision
        burn(burn_context, amount_in_tokens)?;
        let cpi_program = self.system_program.to_account_info();
        let cpi_accounts = Transfer {
            from: self.exit_pool.to_account_info(),
            to: self.exiter.to_account_info(),
        };
        let cpi_context = CpiContext::new(cpi_program, cpi_accounts);
        transfer(cpi_context, self.bonding_curve.ticket_price)?;
        Ok(())
    }
}
