use anchor_lang::prelude::*;

use crate::{error::BlockBusterError, state::Settings, SETTINGS, SUPPLY};

#[derive(Accounts)]
pub struct SetSettings<'info> {
    #[account(mut)]
    pub admin: Signer<'info>,

    #[account(
        mut,
        seeds = [SETTINGS.as_ref()],
        bump,
        constraint = settings.authority == admin.key() @ BlockBusterError::NotAdmin
    )]
    pub settings: Account<'info, Settings>,

    pub system_program: Program<'info, System>,
}

impl<'info> SetSettings<'info> {
    pub fn set_settings(
        &mut self,
        paused: bool,
        new_admin: Pubkey,
        fee_basis_points: u8,
        bumps: &SetSettingsBumps,
    ) -> Result<()> {
        self.settings.set_inner(Settings {
            initialized: true,
            paused,
            authority: new_admin.key(),
            fee_recipient: new_admin.key(),
            fee_basis_points,
            supply: SUPPLY,
            bump: bumps.settings,
        });

        Ok(())
    }
}
