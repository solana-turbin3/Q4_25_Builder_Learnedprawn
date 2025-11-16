use anchor_lang::prelude::*;

#[constant]
pub const SETTINGS: &[u8] = b"settings";
#[constant]
pub const SUPPLY: u64 = 1000000;
// #[constant]
// pub const DECIMALS: u64 = 1_000_000;
#[constant]
pub const MINT: &[u8] = b"mint";
#[constant]
pub const CURVE: &[u8] = b"curve";
#[constant]
pub const VAULT_CURVE: &[u8] = b"curve_vault";
#[constant]
pub const EXIT_POOL: &[u8] = b"exit_pool";
#[constant]
pub const INITIAL_PRICE: u128 = 1_000_000; //0.001SOL = 1 Token | 1_000_000 lamports == 0.001SOL
#[constant]
pub const SLOPE: u128 = 1_000_000; //0.001SOL = 1 Token | 1_000_000 lamports == 0.001SOL
