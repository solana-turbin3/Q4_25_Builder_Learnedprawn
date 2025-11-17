use anchor_lang::{
    prelude::*,
    system_program::{transfer, Transfer},
};
use anchor_spl::{
    associated_token::AssociatedToken,
    token::{burn, mint_to, set_authority, Burn, Mint, MintTo, SetAuthority, Token, TokenAccount},
};

use crate::{
    bonding_curve, error::BlockBusterError, state::Settings, BondingCurve, CURVE,   MINT, SETTINGS,  SUPPLY, VAULT_CURVE
};

#[derive(Accounts)]
pub struct Sell<'info> {
    #[account(mut)]
    pub buyer: Signer<'info>,

    #[account(
        mut,
        seeds = [MINT.as_ref(),  bonding_curve.initializer.key().as_ref()],
        mint::decimals = 0,
        mint::authority = bonding_curve,
        bump
    )]
    pub movie_mint: Account<'info, Mint>,

    #[account(
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

        let lamports = self.calculate_price_in_lamports(amount_in_tokens)?;
        let burn_accounts = Burn {
            authority: self.buyer.to_account_info(),
            mint: self.movie_mint.to_account_info(),
            from: self.buyer_ata.to_account_info(),
        };

        let burn_context = CpiContext::new(
            self.token_program.to_account_info(),
            burn_accounts,
        );

        //TODO: decimal precision
        burn(burn_context, amount_in_tokens)?;

        self.bonding_curve.token_reserve -= amount_in_tokens;


        msg!("lamports: {}" ,lamports);
        let transfer_signer_seeds: &[&[&[u8]]] = &[&[
        // seeds = [VAULT_CURVE.as_ref(), movie_mint.key().as_ref()],
            VAULT_CURVE,
            &self.movie_mint.to_account_info().key.as_ref(),
            &[bumps.vault],
        ]];

        let transfer_accounts = Transfer {
            from: self.vault.to_account_info(),
            to: self.buyer.to_account_info(),
        };

        let cpi_transfer_context =
            CpiContext::new_with_signer(self.system_program.to_account_info(), transfer_accounts, transfer_signer_seeds);

        transfer(cpi_transfer_context, lamports)?;
        Ok(())
    }

    //using a linear bonding curve for PoC
    // let price  = a*supply + initial_price;
    pub fn calculate_sol_cost(&mut self, amount_in_tokens: u64) -> Result<u64 >{
        let slope: u64 = 1;
        let initial_price: u64 = 1;
        let token_price_in_sol: u64 = slope.checked_mul(self.bonding_curve.token_reserve as u64).ok_or(BlockBusterError::Overflow)?.checked_add(initial_price).ok_or(BlockBusterError::Overflow)?;  
        let sol_amount = amount_in_tokens.checked_mul(token_price_in_sol).ok_or(BlockBusterError::Overflow)?;
        msg!("sol_amount: {}" ,sol_amount);

       Ok(sol_amount)
    }
    pub fn calculate_price_in_lamports(
        &mut self,
    amount: u64,
    ) -> Result<u64> {
    let amount = amount as u128;
    let base_price = self.bonding_curve.initial_price as u128;
    let slope = self.bonding_curve.slope as u128;
    // let supply = (self.movie_mint.supply as u128).checked_sub(amount).ok_or(BlockBusterError::Overflow)?;
    let supply = self.bonding_curve.token_reserve as u128;
    let scale = 10u128.pow(self.movie_mint.decimals as u32);

    // price = base_price + slope * supply
        // cost = slope * (k²) / 2 + initial_price * k
        // BUY:
        // cost(s, k) = (m/2) * ((s+k)² - s²) + c*k
        // SELL:
        // cost(s, k) = (m/2) * ((s)² - (s-k)²) + c*k
        msg!("amount: {}", amount);
        msg!("base_price: {}", base_price);
        msg!("slope: {}", slope);
        msg!("supply: {}", supply);
        let old_refund_lamports = (slope  * (supply.pow(2) - (supply - amount).pow(2))) / 2  + base_price * amount;
        msg!("old_lamports: {}", old_refund_lamports);
        // refund_lamports = slope.checked_mul(supply.pow(2).checked_sub((supply.checked_sub(amount).ok_or(BlockBusterError::Overflow)?).ok_or(BlockBusterError::Overflow)?.pow(2))).ok_or(BlockBusterError::Overflow)?;
        let refund_lamports = slope.checked_mul(supply.pow(2).checked_sub(supply.checked_sub(amount).ok_or(BlockBusterError::Overflow)?.pow(2)).ok_or(BlockBusterError::Overflow)?).ok_or(BlockBusterError::Overflow)?.checked_div(2).ok_or(BlockBusterError::Overflow)?.checked_add(base_price.checked_mul(amount).ok_or(BlockBusterError::Overflow)?).ok_or(BlockBusterError::Overflow)?;
        msg!("new_refund_lamports: {}", refund_lamports);


    // let price = base_price
    //     .checked_add(slope.checked_mul(supply).ok_or(BlockBusterError::Overflow)?)
    //     .ok_or(BlockBusterError::Overflow)?;
    //
    // // cost = (amount * price) / 10^decimals
    // let total_cost = amount
    //     .checked_mul(price)
    //     .ok_or(BlockBusterError::Overflow)?;
    //
        // refund_lamports = refund_lamports
        // .checked_div(scale)
        // .ok_or(BlockBusterError::Overflow)?;
        msg!("SELL lamports: {}", refund_lamports);

    Ok(refund_lamports as u64)
    }
}
