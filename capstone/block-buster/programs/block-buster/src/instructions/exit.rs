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
        let burn_accounts = Burn {
            authority: self.exiter.to_account_info(),
            mint: self.movie_mint.to_account_info(),
            from: self.buyer_ata.to_account_info(),
        };

        let burn_context = CpiContext::new(self.token_program.to_account_info(), burn_accounts);

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

    pub fn calculate_exit_sol(&mut self, amount_in_tokens: u64) -> Result<u64> {
        // let exit_pool_lamports = self.exit_pool.lamports(); // 10^9
        // let movie_mint_supply = self.movie_mint.supply; //10^6
        // let movie_mint_decimals = self.movie_mint.decimals; //10^6
        // let lamports_per_token = (exit_pool_lamports as u128
        //     * 10u128.pow(movie_mint_decimals as u32))
        //     / movie_mint_supply as u128;
        // let lamports_per_token = (self.exit_pool.lamports() as u128)
        //     .checked_mul(10u128.pow(self.movie_mint.decimals as u32))
        //     .ok_or(BlockBusterError::Overflow)?
        //     .checked_div(self.movie_mint.supply as u128)
        //     .ok_or(BlockBusterError::Overflow)?;
        // Ok((lamports_per_token * (amount_in_tokens as u128)) as u64)
        Ok(((self.exit_pool.lamports() as u128)
            .checked_mul(10u128.pow(self.movie_mint.decimals as u32))
            .ok_or(BlockBusterError::Overflow)?
            .checked_div(self.movie_mint.supply as u128)
            .ok_or(BlockBusterError::Overflow)?)
        .checked_mul(amount_in_tokens as u128)
        .ok_or(BlockBusterError::Overflow)? as u64)
    }
}
