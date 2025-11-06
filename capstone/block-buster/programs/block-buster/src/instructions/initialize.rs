use anchor_lang::prelude::*;

use crate::state::Settings;

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(mut)]
    pub admin: Signer<'info>,

    #[account(
        init,
        payer = admin,
        seeds = [b"settings"],
        space = Settings::DISCRIMINATOR.len() + Settings::INIT_SPACE,
        bump 
    )]
    pub settings: Account<'info, Settings>,

    pub system_program: Program<'info, System>,
}

impl<'info> Initialize<'info> {
    pub fn initialize_settings(&mut self, fee_basis_points: u8, bumps: &InitializeBumps) -> Result<()> {
        self.settings.set_inner(Settings {
            initialized: true,
            paused: false,
            authority: self.admin.key(),
            fee_recipient: self.admin.key(),
            fee_basis_points,
            supply: 1000,
            bump: bumps.settings
        });

        Ok(())
    }
}
