use anchor_lang::{
    prelude::*,
    system_program::{transfer, Transfer},
};
use anchor_spl::{
    associated_token::AssociatedToken,
    token::{mint_to, set_authority, Mint, MintTo, SetAuthority, Token, TokenAccount},
};

use crate::{
    bonding_curve, error::BlockBusterError, state::Settings, BondingCurve, CURVE, INITIAL_PRICE, MINT, SETTINGS, SLOPE, SUPPLY, VAULT_CURVE
};

#[derive(Accounts)]
pub struct Buy<'info> {
    #[account(mut)]
    pub buyer: Signer<'info>,

    #[account(
        mut,
        seeds = [MINT.as_ref(), bonding_curve.name.as_bytes().as_ref(), bonding_curve.initializer.key().as_ref() ],
        mint::decimals = 0,
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

        Ok(())
    }

    //using a linear bonding curve for PoC
    // let price  = a*supply + initial_price;
    // pub fn calculate_token_amount(&mut self, amount_in_sol: u64) -> Result<u64> {
    //     let slope: u64 = 1;
    //     let initial_price: u64 = 1;
    //     let token_price_in_sol: u64 = slope.checked_mul(self.movie_mint.supply as u64).ok_or(BlockBusterError::Overflow)?.checked_add(initial_price).ok_or(BlockBusterError::Overflow)?;  
    //     let token_amount = amount_in_sol.checked_div(token_price_in_sol).ok_or(BlockBusterError::Overflow)?;
    //
    //     Ok(token_amount)
    // }
    pub fn calculate_sol_cost(&mut self, amount_in_tokens: u64) -> Result<u64 >{
        let slope: u128 = 1;
        let token_price_in_sol: u128 = slope.checked_mul(self.movie_mint.supply as u128).ok_or(BlockBusterError::Overflow)?.checked_add(INITIAL_PRICE).ok_or(BlockBusterError::Overflow)?;  
        let sol_amount: u128 = (amount_in_tokens as u128).checked_mul(token_price_in_sol).ok_or(BlockBusterError::Overflow)?;
        msg!("sol_amount: {}" ,sol_amount);

       Ok(sol_amount as u64)
    }
    pub fn calculate_price_in_lamports(
        &mut self,
    amount: u64,
    ) -> Result<u64> {
    let amount = amount as u128;
    let base_price = INITIAL_PRICE;
    let slope = SLOPE;
    let supply = self.bonding_curve.token_reserve as u128;
    let scale = 10u128.pow(self.movie_mint.decimals as u32);

    // price = base_price + slope * supply
        //    = slope*(10²)/2 + initial_price * 10
        // let price = slope.checked_mul(supply.pow(amount))
        // cost = slope * (k²) / 2 + initial_price * k
        // BUY:
        // cost(s, k) = (m/2) * ((s+k)² - s²) + c*k
        msg!("amount: {}", amount);
        msg!("base_price: {}", base_price);
        msg!("slope: {}", slope);
        msg!("supply: {}", supply);
        let buy_lamports = (slope  * ((supply + amount).pow(2) - supply.pow(2))) / 2  + base_price * amount;
    // let price = base_price
    //     .checked_add(slope.checked_mul(supply.checked_add(amount).ok_or(BlockBusterError::Overflow)?).ok_or(BlockBusterError::Overflow)?)
    //     .ok_or(BlockBusterError::Overflow)?;
    //
    // // cost = (amount * price) / 10^decimals
    // let total_cost = amount
    //     .checked_mul(price)
    //     .ok_or(BlockBusterError::Overflow)?;
    //
    // buy_lamports = buy_lamports
    //     .checked_div(scale)
    //     .ok_or(BlockBusterError::Overflow)?;
        msg!("BUY lamports: {}", buy_lamports);

    Ok(buy_lamports as u64)
}
}
