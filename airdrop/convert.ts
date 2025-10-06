import bs58 from "bs58";

const uint8array = [112, 114, 101, 114, 101, 113, 115];

console.log("phantom key: ", bs58.encode(uint8array));
