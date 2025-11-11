use anchor_lang::prelude::*;
use anchor_spl::{
    associated_token::AssociatedToken,
    token::{mint_to, set_authority, Mint, MintTo, SetAuthority, Token, TokenAccount},
};

use crate::{
    bonding_curve, error::BlockBusterError, state::Settings, BondingCurve, CURVE, MINT, SETTINGS,
    SUPPLY, VAULT_CURVE,
};

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

    // #[account(
    //     init,
    //     payer = creator,
    //     associated_token::mint = movie_mint,
    //     associated_token::authority = bonding_curve
    // )]
    // pub bonding_curve_ata: Account<'info, TokenAccount>,
    #[account(
        seeds = [SETTINGS.as_ref()],
        bump = settings.bump,
        constraint = !settings.paused @ BlockBusterError::Paused
    )]
    pub settings: Account<'info, Settings>,

    // pub associated_token_program: Program<'info, AssociatedToken>,
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

impl<'info> Create<'info> {
    pub fn create(
        &mut self,
        name: String,
        symbol: String,
        uri: String,
        initializer_share: u64,
        total_fundraising: u64,
        bumps: &CreateBumps,
    ) -> Result<()> {
        self.bonding_curve.set_inner(BondingCurve {
            mint: self.movie_mint.key(),
            name,
            symbol,
            uri,
            completion_lamports: total_fundraising,
            token_reserve: 0,
            sol_reserve: 0,
            total_token_supply: self.settings.supply,
            complete: false,
            initializer: self.creator.key(),
            initializer_share,
            curve_bump: self.bonding_curve.curve_bump,
            vault_bump: self.bonding_curve.vault_bump,
        });

        Ok(())
    }
}

// let signer_seeds: &[&[&[u8]]] = &[&[
//     CURVE,
//     &self.movie_mint.to_account_info().key.as_ref(),
//     &[bumps.bonding_curve],
// ]];
//
// let mint_accounts = MintTo {
//     authority: self.bonding_curve.to_account_info(),
//     mint: self.movie_mint.to_account_info(),
//     to: self.bonding_curve_ata.to_account_info(),
// };
//
// let mint_context = CpiContext::new_with_signer(
//     self.token_program.to_account_info(),
//     mint_accounts,
//     signer_seeds,
// );
//
// //Initial supply minted to bonding_curve.
// mint_to(mint_context, self.settings.supply)?;
//
// let authority_accounts = SetAuthority {
//     account_or_mint: self.movie_mint.to_account_info(),
//     current_authority: self.bonding_curve.to_account_info(),
// };
// let authority_context = CpiContext::new_with_signer(
//     self.token_program.to_account_info(),
//     authority_accounts,
//     signer_seeds,
// );
// set_authority(
//     authority_context,
//     anchor_spl::token::spl_token::instruction::AuthorityType::MintTokens,
//     None,
// )?;
//
//using a linear bonding curve for PoC
// let price  = a*supply + initial_price;
