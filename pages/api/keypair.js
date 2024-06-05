// import {Metaplex} from "@metaplex-foundation/js";
import {Keypair} from "@solana/web3.js";

export default async function handler(req, res) {
    console.log(req.query);
    const keypair = Keypair.generate();

    res.status(200).json({'publicKey': keypair.publicKey, 'privateKey': keypair.secretKey});
};
