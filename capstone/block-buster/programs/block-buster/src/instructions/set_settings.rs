use anchor_lang::prelude::*;

use crate::state::Settings;

#[derive(Accounts)]
pub struct SetSettings<'info> {
    #[account(mut)]
    pub admin: Signer<'info>,

    #[account(
        mut,
        seeds = [b"settings"],
        bump,
        constraint = settings.authority == admin.key()
    )]
    pub settings: Account<'info, Settings>,

    pub system_program: Program<'info, System>,
}

impl<'info> SetSettings<'info> {
    pub fn initialize_settings(
        &mut self,
        paused: bool,
        fee_basis_points: u8,
        bumps: &SetSettingsBumps,
    ) -> Result<()> {
        self.settings.set_inner(Settings {
            initialized: true,
            paused,
            authority: self.admin.key(),
            fee_recipient: self.admin.key(),
            fee_basis_points,
            supply: 1000,
            bump: bumps.settings,
        });

        Ok(())
    }
}
