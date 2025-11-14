use anchor_lang::{
    prelude::*,
    system_program::{transfer, Transfer},
};
use anchor_spl::{
    associated_token::AssociatedToken,
    token::{mint_to, set_authority, Mint, MintTo, SetAuthority, Token, TokenAccount},
};

use crate::{
    bonding_curve, error::BlockBusterError, state::Settings, BondingCurve, CURVE, DECIMALS, MINT,
    SETTINGS, SUPPLY, VAULT_CURVE,
};

#[derive(Accounts)]
pub struct Buy<'info> {
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
        mut,
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
        init_if_needed,
        payer = buyer,
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

impl<'info> Buy<'info> {
    pub fn buy(&mut self, amount_in_sol: u64, bumps: &BuyBumps) -> Result<()> {

        let transfer_accounts = Transfer {
            from: self.buyer.to_account_info(),
            to: self.vault.to_account_info(),
        };

        let cpi_transfer_context =
            CpiContext::new(self.system_program.to_account_info(), transfer_accounts);

        transfer(cpi_transfer_context, amount_in_sol)?;

        let signer_seeds: &[&[&[u8]]] = &[&[
            CURVE,
            &self.movie_mint.to_account_info().key.as_ref(),
            &[bumps.bonding_curve],
        ]];

        let mint_accounts = MintTo {
            authority: self.bonding_curve.to_account_info(),
            mint: self.movie_mint.to_account_info(),
            to: self.buyer_ata.to_account_info(),
        };

        let mint_context = CpiContext::new_with_signer(
            self.token_program.to_account_info(),
            mint_accounts,
            signer_seeds,
        );

        let token_amount = self.calculate_token_amount(amount_in_sol).expect("calculation failed");

        //TODO: decimal precision
        mint_to(mint_context, token_amount)?;
        self.bonding_curve.token_reserve += token_amount;

        Ok(())
    }

    //using a linear bonding curve for PoC
    // let price  = a*supply + initial_price;
    pub fn calculate_token_amount(&mut self, amount_in_sol: u64) -> Result<u64> {
        let slope: u64 = 1;
        let initial_price: u64 = 1;
        let token_price_in_sol: u64 = slope.checked_mul(self.movie_mint.supply as u64).ok_or(BlockBusterError::Overflow)?.checked_add(initial_price).ok_or(BlockBusterError::Overflow)?;  
        let token_amount = amount_in_sol / token_price_in_sol;

        Ok(token_amount)
    }
}
