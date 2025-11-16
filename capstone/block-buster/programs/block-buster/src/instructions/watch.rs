use std::str::FromStr;

use anchor_lang::{
    prelude::*,
    system_program::{transfer, Transfer},
};
use anchor_spl::token::{Mint, Token};

use crate::{
    error::BlockBusterError, state::Settings, BondingCurve, CURVE, EXIT_POOL, MINT, SETTINGS,
    SUPPLY, VAULT_CURVE,
};
use mpl_core::{
    accounts::BaseCollectionV1, instructions::CreateV2CpiBuilder, ID as CORE_PROGRAM_ID,
};

#[derive(AnchorDeserialize, AnchorSerialize)]
// pub struct CreateAssetArgs {
pub struct TicketNftArgs {
    name: String,
    uri: String,
}

#[derive(Accounts)]
pub struct Watch<'info> {
    // Also the nft mint payer
    #[account(mut)]
    pub viewer: Signer<'info>,

    #[account(
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
        seeds = [EXIT_POOL.as_ref(), movie_mint.key().as_ref()],
        bump
    )]
    pub exit_pool: SystemAccount<'info>,

    //NFT accounts
    #[account(
        mut,
        constraint = asset.data_is_empty() @ BlockBusterError::AssetAlreadyInitialized,
    )]
    pub asset: Signer<'info>,
    #[account(
        mut,
        constraint = collection.owner == &CORE_PROGRAM_ID @ BlockBusterError::InvalidCollection,
        constraint = !collection.data_is_empty() @ BlockBusterError::UninitializedCollection,
    )]
    /// CHECK: Verified by mpl-core
    pub collection: Option<UncheckedAccount<'info>>,

    #[account(address = CORE_PROGRAM_ID)]
    /// CHECK: this account is checked by the address constraint
    pub core_program: UncheckedAccount<'info>,
    pub system_program: Program<'info, System>,
}

// TODO: Mint NFT
impl<'info> Watch<'info> {
    pub fn watch(&mut self, bumps: &WatchBumps) -> Result<()> {
        let cpi_program = self.system_program.to_account_info();
        let cpi_accounts = Transfer {
            from: self.viewer.to_account_info(),
            to: self.exit_pool.to_account_info(),
        };
        let cpi_context = CpiContext::new(cpi_program, cpi_accounts);
        transfer(cpi_context, self.bonding_curve.ticket_price)?;

        Ok(())
    }

    pub fn mint_nft_ticket(&mut self, args: TicketNftArgs, bumps: &WatchBumps) -> Result<()> {
        let collection = match &self.collection {
            Some(collection) => Some(collection.to_account_info()),
            None => None,
        };
        // let collection = &self.collection.take();
        // clone() ??
        // let collection = &self
        //     .collection
        //     .map(|collection| collection.to_account_info());

        let something = CreateV2CpiBuilder::new(&self.core_program.to_account_info())
            .asset(&self.asset.to_account_info())
            .collection(collection.as_ref())
            .authority(None)
            .payer(&self.viewer.to_account_info())
            .owner(Some(&self.viewer.to_account_info()))
            .update_authority(None)
            .system_program(&self.system_program.to_account_info())
            .name(args.name)
            .uri(args.uri)
            .invoke()?;
        msg!("something: {:?}", something);

        Ok(())
    }
}
