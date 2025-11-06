use anchor_lang::prelude::*;
use anchor_spl::{associated_token::AssociatedToken, token::{Mint, Token, TokenAccount}};

use crate::{state::Settings, BondingCurve, SUPPLY};

#[derive(Accounts)]
#[instruction(name: String)]
pub struct Create<'info> {
    #[account(mut)]
    pub creator: Signer<'info>,

    #[account(
        init,
        payer = creator,
        seeds = [b"mint".as_ref(), name.as_bytes().as_ref(), creator.key().as_ref() ],
        mint::decimals = 6,
        mint::authority = settings,
        bump
    )]
    pub movie_mint: Account<'info, Mint>,

    #[account(
        init,
        payer = creator,
        seeds = [b"curve".as_ref(), movie_mint.key().as_ref()],
        space = BondingCurve::DISCRIMINATOR.len() + BondingCurve::INIT_SPACE,
        bump
    )]
    pub bonding_curve: Account<'info, BondingCurve>,

    #[account(
        seeds = [b"curve_vault".as_ref(), movie_mint.key().as_ref()],
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
        seeds = [b"settings"],
        bump 
    )]
    pub settings: Account<'info, Settings>,

    pub associated_token_program: Program<'info, AssociatedToken>,
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

impl<'info> Create<'info> {
    pub fn create(&mut self, bumps: &CreateBumps) -> Result<()> {
        Ok(())
    }
}
