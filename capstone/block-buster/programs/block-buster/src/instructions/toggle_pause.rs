use anchor_lang::prelude::*;

use crate::{error::BlockBusterError, state::Settings, SETTINGS, SUPPLY};

#[derive(Accounts)]
pub struct TogglePause<'info> {
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

impl<'info> TogglePause<'info> {
    pub fn toggle_pause(&mut self) -> Result<()> {
        if self.settings.paused {
            self.settings.paused = false;
        } else {
            self.settings.paused = true;
        }
        Ok(())
    }
}
