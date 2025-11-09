use anchor_lang::prelude::*;

#[constant]
pub const SETTINGS: &[u8] = b"settings";
#[constant]
pub const SUPPLY: u64 = 1000000;
#[constant]
pub const DECIMALS: u64 = 1_000_000;
#[constant]
pub const MINT: &[u8] = b"mint";
#[constant]
pub const CURVE: &[u8] = b"curve";
#[constant]
pub const VAULT_CURVE: &[u8] = b"curve_vault";
