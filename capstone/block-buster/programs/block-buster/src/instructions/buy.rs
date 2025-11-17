use anchor_lang::{
    prelude::*,
    system_program::{transfer, Transfer},
};
use anchor_spl::{
    associated_token::AssociatedToken,
    token::{mint_to, set_authority, Mint, MintTo, SetAuthority, Token, TokenAccount},
};

use crate::{
    bonding_curve, error::BlockBusterError, state::Settings, BondingCurve, CURVE,  MINT, SETTINGS,  SUPPLY, VAULT_CURVE
};

#[derive(Accounts)]
pub struct Buy<'info> {
    #[account(mut)]
    pub buyer: Signer<'info>,

    #[account(
        mut,
        seeds = [MINT.as_ref(), bonding_curve.initializer.key().as_ref()],
        mint::decimals = 0,
        mint::authority = bonding_curve,
        bump
    )]
    pub movie_mint: Account<'info, Mint>,

    #[account(
        mut,
        seeds = [CURVE.as_ref(), movie_mint.key().as_ref()],
        bump,
        constraint = !bonding_curve.complete @ BlockBusterError::Complete,
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
        constraint = !settings.paused @ BlockBusterError::Paused,
    )]
    pub settings: Account<'info, Settings>,

    pub associated_token_program: Program<'info, AssociatedToken>,
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

impl<'info> Buy<'info> {
    pub fn buy(&mut self, amount_in_tokens: u64, bumps: &BuyBumps) -> Result<()> {

        let lamports = self.calculate_price_in_lamports(amount_in_tokens)?;

        let transfer_accounts = Transfer {
            from: self.buyer.to_account_info(),
            to: self.vault.to_account_info(),
        };

        let cpi_transfer_context =
            CpiContext::new(self.system_program.to_account_info(), transfer_accounts);

        transfer(cpi_transfer_context, lamports)?;

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


        //TODO: decimal precision
        mint_to(mint_context, amount_in_tokens)?;

        self.bonding_curve.token_reserve += amount_in_tokens;
        if self.vault.lamports() >= self.bonding_curve.completion_lamports {
            self.bonding_curve.complete = true;
        }

        Ok(())
    }

    pub fn calculate_price_in_lamports(
        &mut self,
    amount: u64,
    ) -> Result<u64> {
    let amount = amount as u128;
    let base_price = self.bonding_curve.initial_price as u128;
    let slope = self.bonding_curve.slope as u128;
    let supply = self.bonding_curve.token_reserve as u128;

    // price = base_price + slope * supply
        // cost = slope * (k²) / 2 + initial_price * k
        // BUY:
        // cost(s, k) = (m/2) * ((s+k)² - s²) + c*k
        // let old_buy_lamports = (slope  * ((supply + amount).pow(2) - supply.pow(2))) / 2  + base_price * amount;

        let buy_lamports = slope.checked_mul(supply.checked_add(amount).ok_or(BlockBusterError::Overflow)?.pow(2).checked_sub(supply.pow(2)).ok_or(BlockBusterError::Overflow)?).ok_or(BlockBusterError::Overflow)?.checked_div(2).ok_or(BlockBusterError::Overflow)?.checked_add(base_price.checked_mul(amount).ok_or(BlockBusterError::Overflow)?).ok_or(BlockBusterError::Overflow)?;

    Ok(buy_lamports as u64)
}
}
