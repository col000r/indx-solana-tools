// import {Metaplex} from "@metaplex-foundation/js";
import { Keypair } from "@solana/web3.js";
import * as bip39 from "bip39";


export default async function handler(req, res) {
    console.log(req.query);
    const mnemonic = bip39.generateMnemonic();
    const seed = bip39.mnemonicToSeedSync(mnemonic, "");
    const keypair = Keypair.generate();

    res.status(200).json({'mnemonic': mnemonic, 'publicKey': keypair.publicKey, 'privateKey': keypair.secretKey});
};
