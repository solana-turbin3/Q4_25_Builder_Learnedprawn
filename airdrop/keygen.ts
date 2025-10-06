import {
  createKeyPairFromBytes,
  createSignerFromKeyPair,
  getBase58Encoder,
} from "@solana/kit";

const keypairBase58 =
  "31SBT15HMBRMBPHqvkGRbfe9UER3DkPCkP5XFK2x3Eg2CHqApnb8nsmREZ6Wakq7uXrb6aY97LjVSa2Q9DDaTYMM";

const keypair = await createKeyPairFromBytes(
  getBase58Encoder().encode(keypairBase58),
);
console.log(getBase58Encoder().encode(keypairBase58));
const signer = await createSignerFromKeyPair(keypair);

console.log(signer.address);
