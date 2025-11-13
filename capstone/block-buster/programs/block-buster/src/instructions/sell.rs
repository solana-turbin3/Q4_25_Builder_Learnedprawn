use anchor_lang::{
    prelude::*,
    system_program::{transfer, Transfer},
};
use anchor_spl::{
    associated_token::AssociatedToken,
    token::{burn, mint_to, set_authority, Burn, Mint, MintTo, SetAuthority, Token, TokenAccount},
};

use crate::{
    bonding_curve, error::BlockBusterError, state::Settings, BondingCurve, CURVE, DECIMALS, MINT,
    SETTINGS, SUPPLY, VAULT_CURVE,
};

#[derive(Accounts)]
pub struct Sell<'info> {
    #[account(mut)]
    pub buyer: Signer<'info>,

    #[account(
        mut,
        seeds = [MINT.as_ref(), bonding_curve.name.as_bytes().as_ref(), bonding_curve.initializer.key().as_ref() ],
        mint::decimals = 6,
        mint::authority = bonding_curve,
        bump
    )]
    pub movie_mint: Account<'info, Mint>,

    #[account(
        seeds = [CURVE.as_ref(), movie_mint.key().as_ref()],
        bump
    )]
    pub bonding_curve: Account<'info, BondingCurve>,

    #[account(
        mut,
        seeds = [VAULT_CURVE.as_ref(), movie_mint.key().as_ref()],
        bump
    )]
    pub vault: SystemAccount<'info>,

    #[account(
        mut,
        associated_token::mint = movie_mint,
        associated_token::authority = buyer 
    )]
    pub buyer_ata: Account<'info, TokenAccount>,
    #[account(
        seeds = [SETTINGS.as_ref()],
        bump = settings.bump,
        constraint = !settings.paused @ BlockBusterError::Paused
    )]
    pub settings: Account<'info, Settings>,

    pub associated_token_program: Program<'info, AssociatedToken>,
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

impl<'info> Sell<'info> {
    pub fn sell(&mut self, amount_in_tokens: u64, bumps: &SellBumps) -> Result<()> {

        let signer_seeds: &[&[&[u8]]] = &[&[
            CURVE,
            &self.movie_mint.to_account_info().key.as_ref(),
            &[bumps.bonding_curve],
        ]];

        let burn_accounts = Burn {
            authority: self.buyer.to_account_info(),
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

        let sol_amount = self.calculate_sol_amount(amount_in_tokens);

        let transfer_accounts = Transfer {
            from: self.vault.to_account_info(),
            to: self.buyer.to_account_info(),
        };

        let cpi_transfer_context =
            CpiContext::new(self.system_program.to_account_info(), transfer_accounts);

        transfer(cpi_transfer_context, sol_amount)?;
        Ok(())
    }

    //using a linear bonding curve for PoC
    // let price  = a*supply + initial_price;
    pub fn calculate_sol_amount(&mut self, amount_in_tokens: u64) -> u64 {
        let slope = 1;
        let initial_price = 1;
        let token_price_in_sol = slope * self.bonding_curve.token_reserve + initial_price;
        let sol_amount = amount_in_tokens * token_price_in_sol;

       sol_amount 
    }
}
