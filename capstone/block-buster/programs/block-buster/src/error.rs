use anchor_lang::prelude::*;

#[error_code]
pub enum BlockBusterError {
    #[msg("Admin not authorised")]
    NotAdmin,
    #[msg("Creator can only release movie")]
    NotCreator,
    #[msg("Program Paused")]
    Paused,
    #[msg("Fundraising target complete")]
    Complete,
    #[msg("Fundraising target not complete")]
    NotComplete,
    #[msg("Overflow")]
    Overflow,
    #[msg("Invalid Collection")]
    InvalidCollection,
    #[msg("Collection is not initialized")]
    UninitializedCollection,
    #[msg("Asset already initialized")]
    AssetAlreadyInitialized,
}
