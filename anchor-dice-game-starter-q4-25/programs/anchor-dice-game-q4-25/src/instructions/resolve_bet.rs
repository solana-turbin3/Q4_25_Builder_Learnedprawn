use anchor_instruction_sysvar::Ed25519InstructionSignatures;
use anchor_lang::{
    prelude::*,
    system_program::{transfer, Transfer},
};
use solana_program::{
    ed25519_program,
    hash::hash,
    sysvar::instructions::{load_instruction_at_checked, ID},
};

use crate::{errors::DiceError, state::Bet};

pub const HOUSE_EDGE: u16 = 150;

#[derive(Accounts)]
pub struct ResolveBet<'info> {
    #[account(mut)]
    pub player: Signer<'info>,
    ///CHECK: This is safe
    pub house: UncheckedAccount<'info>,
    #[account(
        mut,
        seeds = [b"vault", house.key().as_ref()],
        bump
    )]
    pub vault: SystemAccount<'info>,
    #[account(
        mut,
        close = player,
        seeds = [b"bet", vault.key().as_ref(), bet.seed.to_le_bytes().as_ref()],
        bump = bet.bump
    )]
    pub bet: Account<'info, Bet>,
    #[account(address = ID)]
    ///CHECK: This is safe
    pub instruction_sysvar: UncheckedAccount<'info>,
    pub system_program: Program<'info, System>,
}

impl<'info> ResolveBet<'info> {
    pub fn verify_ed25519_signature(&mut self, sig: &[u8]) -> Result<()> {
        // loading the instruction from index 0
        let ix = load_instruction_at_checked(0, &self.instruction_sysvar.to_account_info())?;

        // checking program id of instruction being checked is the precompiled ed25519 program. Ed25519SigVerify111111111111111111111111111
        require_keys_eq!(
            ix.program_id,
            ed25519_program::ID,
            DiceError::Ed25519Program
        );

        // checking that no were accounts passed in to the ed25519 programs as all data required
        // for signature is in the calldata in flat bytes format.
        require_eq!(ix.accounts.len(), 0, DiceError::Ed25519AccountLengthNotZero);

        //Converts the raw instruction bytes into a rust struct as show below:
        // pub struct Ed25519InstructionSignatures(pub Vec<Ed25519InstructionSignature>);
        let signatures = Ed25519InstructionSignatures::unpack(&ix.data).unwrap().0;

        require_eq!(signatures.len(), 1, DiceError::Ed25519DataLength);

        // We take the first and only signature from the above array and it looks like this:
        // pub struct Ed25519InstructionSignature {
        //     pub is_verifiable: bool,
        //     pub offsets: Ed25519InstructionOffsets,
        //     pub public_key: Option<Pubkey>,
        //     pub signature: Option<[u8;SIGNATURE_SERIALIZED_SIZE]>,
        //     pub message: Option<Vec<u8>>
        // }
        let signature = &signatures[0];

        //     Checking this field to be true
        //     pub is_verifiable: bool,
        require!(signature.is_verifiable, DiceError::Ed25519NotVerifiable);

        //     Checking this field:
        //     pub public_key: Option<Pubkey>,
        //     As its a option ok_or required.
        //     We are checking that the signature is done by the house and no one else.
        require_keys_eq!(
            signature.public_key.ok_or(DiceError::Ed25519Pubkey)?,
            self.house.key(),
            DiceError::Ed25519Pubkey
        );

        // Actual comparison of the provided signature and previous instruction signature
        // Because we have verified all inputs (message in the next check) we can be sure that if
        // this signature matches we have the right signature.
        require!(
            &signature
                .signature
                .as_ref()
                .ok_or(DiceError::Ed25519Signature)?
                .eq(sig),
            DiceError::Ed25519Signature
        );

        // Checking the content of the message to be same as what is expected (bet)
        require!(
            &signature
                .message
                .as_ref()
                .ok_or(DiceError::Ed25519Message)?
                .eq(&self.bet.to_slice()),
            DiceError::Ed25519Message
        );
        Ok(())
    }
    pub fn resolve_bet(&mut self, sig: &Vec<u8>, bumps: &ResolveBetBumps) -> Result<()> {
        let hash = hash(sig).to_bytes();
        let mut hash_16: [u8; 16] = [0; 16];
        hash_16.copy_from_slice(&hash[0..16]);
        let lower = u128::from_le_bytes(hash_16);
        hash_16.copy_from_slice(&hash[16..32]);
        let upper = u128::from_le_bytes(hash_16);

        let roll = (lower.wrapping_add(upper).wrapping_rem(100) as u8) + 1;

        if self.bet.roll > roll {
            let payout = (self.bet.amount as u128)
                .checked_mul(1000 - (HOUSE_EDGE as u128))
                .ok_or(DiceError::Overflow)?
                .checked_div((roll as u128) - 1)
                .ok_or(DiceError::Overflow)?
                .checked_div(100)
                .ok_or(DiceError::Overflow)? as u64;
            let transfer_accounts = Transfer {
                from: self.vault.to_account_info(),
                to: self.player.to_account_info(),
            };

            let signer_seeds: &[&[&[u8]]] =
                &[&[b"vault", &self.house.key().to_bytes(), &[bumps.vault]]];

            let transfer_context = CpiContext::new_with_signer(
                self.system_program.to_account_info(),
                transfer_accounts,
                signer_seeds,
            );

            transfer(transfer_context, payout)?;
        }

        Ok(())
    }
}
