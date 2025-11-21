use anchor_lang::{
    prelude::*,
    system_program::{transfer, Transfer},
};
use anchor_spl::{
    associated_token::AssociatedToken,
    token::{mint_to, Mint, MintTo, Token, TokenAccount},
};

use crate::{
    error::BlockBusterError, state::Settings, BondingCurve, CURVE, MINT, SETTINGS, VAULT_CURVE,
};

#[derive(Accounts)]
pub struct Create<'info> {
    #[account(mut)]
    pub creator: Signer<'info>,

    #[account(
        init,
        payer = creator,
        seeds = [MINT.as_ref(), creator.key().as_ref()],
        mint::decimals = 0,
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
        mut,
        seeds = [VAULT_CURVE.as_ref(), movie_mint.key().as_ref()],
        bump
    )]
    pub vault: SystemAccount<'info>,

    #[account(
        seeds = [SETTINGS.as_ref()],
        bump = settings.bump,
        constraint = !settings.paused @ BlockBusterError::Paused
    )]
    pub settings: Account<'info, Settings>,

    #[account(
        init_if_needed,
        payer = creator,
        associated_token::mint = movie_mint,
        associated_token::authority = creator
    )]
    pub creator_ata: Account<'info, TokenAccount>,
    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
}

impl<'info> Create<'info> {
    pub fn create(
        &mut self,
        initializer_share: u64,
        total_fundraising: u64,
        slope: u64,
        initial_price: u64,
        bumps: &CreateBumps,
    ) -> Result<()> {
        let rent_exempt: u64 =
            Rent::get()?.minimum_balance(self.vault.to_account_info().data_len());
        let cpi_program = self.system_program.to_account_info();
        let cpi_accounts = Transfer {
            from: self.creator.to_account_info(),
            to: self.vault.to_account_info(),
        };
        let cpi_context = CpiContext::new(cpi_program, cpi_accounts);

        transfer(cpi_context, rent_exempt)?;

        let signer_seeds: &[&[&[u8]]] = &[&[
            CURVE,
            &self.movie_mint.to_account_info().key.as_ref(),
            &[bumps.bonding_curve],
        ]];

        let mint_accounts = MintTo {
            authority: self.bonding_curve.to_account_info(),
            mint: self.movie_mint.to_account_info(),
            to: self.creator_ata.to_account_info(),
        };

        let mint_context = CpiContext::new_with_signer(
            self.token_program.to_account_info(),
            mint_accounts,
            signer_seeds,
        );

        mint_to(mint_context, initializer_share)?;

        self.bonding_curve.token_reserve += initializer_share;

        self.bonding_curve.set_inner(BondingCurve {
            mint: self.movie_mint.key(),
            completion_lamports: total_fundraising,
            token_reserve: 0,
            complete: false,
            initializer: self.creator.key(),
            initializer_share,
            ticket_price: 0,
            slope,
            initial_price,
            curve_bump: bumps.bonding_curve,
            vault_bump: bumps.vault,
        });

        Ok(())
    }
}
