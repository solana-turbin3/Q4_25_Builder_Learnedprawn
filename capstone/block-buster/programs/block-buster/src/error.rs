use anchor_lang::prelude::*;

#[error_code]
pub enum BlockBusterError {
    #[msg("Admin not authorised")]
    NotAdmin,
    #[msg("Program Paused")]
    Paused,
    #[msg("Overflow")]
    Overflow,
    #[msg("Invalid Collection")]
    InvalidCollection,
    #[msg("Collection is not initialized")]
    UninitializedCollection,
    #[msg("Asset already initialized")]
    AssetAlreadyInitialized,
}
