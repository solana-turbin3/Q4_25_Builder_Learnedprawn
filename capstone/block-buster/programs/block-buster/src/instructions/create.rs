use anchor_lang::prelude::*;
use anchor_spl::{associated_token::AssociatedToken, token::{mint_to, Mint, Token, TokenAccount}};

use crate::{state::Settings, BondingCurve, CURVE, MINT, SETTINGS, SUPPLY, VAULT_CURVE};

#[derive(Accounts)]
#[instruction(name: String)]
pub struct Create<'info> {
    #[account(mut)]
    pub creator: Signer<'info>,

    #[account(
        init,
        payer = creator,
        seeds = [MINT.as_ref(), name.as_bytes().as_ref(), creator.key().as_ref() ],
        mint::decimals = 6,
        mint::authority = bonding_curve,
        bump
    )]
    pub movie_mint: Account<'info, Mint>,

    #[account(
        init,
        payer = creator,
        seeds = [CURVE.as_ref(), movie_mint.key().as_ref()],
        space = BondingCurve::DISCRIMINATOR.len() + BondingCurve::INIT_SPACE,
        bump
    )]
    pub bonding_curve: Account<'info, BondingCurve>,

    #[account(
        seeds = [VAULT_CURVE.as_ref(), movie_mint.key().as_ref()],
        bump
    )]
    pub vault: SystemAccount<'info>,

    #[account(
        init,
        payer = creator,
        associated_token::mint = movie_mint,
        associated_token::authority = bonding_curve
    )]
    pub bonding_curve_ata: Account<'info, TokenAccount>,

    #[account(
        seeds = [SETTINGS.as_ref()],
        bump 
    )]
    pub settings: Account<'info, Settings>,

    pub associated_token_program: Program<'info, AssociatedToken>,
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

impl<'info> Create<'info> {
    pub fn create(&mut self, bumps: &CreateBumps) -> Result<()> {
        // signer_seeds:&[&[&[u8]]] = &[&[b"curve"]]
        // mint_accounts =
        // mint_context = CpiContext::new_with_signer(self.token_program.to_account_info(), , )
        // mint_to(ctx, self.settings.supply);
        // Ok(())
    }
}
