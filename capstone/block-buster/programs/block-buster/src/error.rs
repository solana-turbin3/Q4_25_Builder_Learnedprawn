use anchor_lang::prelude::*;

#[error_code]
pub enum BlockBusterError {
    #[msg("Admin not authorised")]
    NotAdmin,
    #[msg("Program Paused")]
    Paused,
}
