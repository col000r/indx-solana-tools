// Copyright (c) 2023 Markus Hofer
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in all
// copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
// SOFTWARE.

import { Keypair } from "@solana/web3.js";
import * as bs58 from 'bs58';
import * as bip39 from 'bip39';

export const GenerateKeyPairFromSecret = (secretKey) => {
    if (!secretKey) {
        console.log('NO KEY');
        return;
    }  
    secretKey = EnsureItsAUint8Array(secretKey);
    try {
        secretKey = bs58.encode(secretKey);
        //console.log('bs58 encoded', secretKey);
    } catch (e) {
        //console.log('bs58 encode error', e)
    }
    try {
        secretKey = bs58.decode(secretKey);
        const kPair = Keypair.fromSecretKey(secretKey);
        return kPair;
    } catch (e) {
        console.log('fromSecretKey error: ', e);
    }
    return undefined;
};

export const GenerateMnemonic = () => {
    const mnemonic = bip39.generateMnemonic();
    return mnemonic;
}

export const GenerateKeyPairFromMnemonic = (mnemonic) => {
    //console.log('gen KeyPair from: ', mnemonic);

    if(!mnemonic) {
        mnemonic = GenerateMnemonic();
        //console.log('no mnemonic given, generated one: ', mnemonic)
    }

    const seed = bip39.mnemonicToSeedSync(mnemonic, "");
    const kPair = Keypair.fromSeed(seed.slice(0, 32));

    // console.log("mnemonic: ", mnemonic);
    // console.log("seed: ", seed);
    // console.log("publicKey: ", kPair.publicKey.toJSON());
    // console.log("publicKey Base58: ", kPair.publicKey.toBase58());
    // console.log("secretKey: ", kPair.secretKey);
    // console.log("secretKey Base58: ", bs58.encode(kPair.secretKey));

    return ({keyPair: kPair, mnemonic: mnemonic});
};

export const GenerateDerivedKeyPairsFromMnemonic = ({mnemonic, mnemonicPassword = "", num = 10}) => {
    if(!mnemonic){
        console.log('No mnemonic given. Aborting...');
        return undefined;
    }

    let derivedKeyPairs = [];
    const seed = bip39.mnemonicToSeedSync(mnemonic, mnemonicPassword);

    for (let i = 0; i < num; i++) {
        const path = `m/44'/501'/${i}'/0'`;
        const derivedKeyPair = Keypair.fromSeed(derivePath(path, seed.toString("hex")).key);
        derivedKeyPairs.push(derivedKeyPair);
        //console.log(`${path} => ${derivedKeyPair.publicKey.toBase58()}`);
    }

    return derivedKeyPairs;
};

export const EnsureItsAUint8Array = (data) => {
    //console.log("ensure it's Uint8", data);
    let json = data.toString();
    if (!json.startsWith('[')) json = `[${json}`;
    if (!json.endsWith(']')) json = `${json}]`;
    try {
        const uint8arr = Uint8Array.from(JSON.parse(json));
        //console.log('uint8arr: ', uint8arr);
        return uint8arr;
    } catch (e) {
        console.log('not a Uint8 array...');
        return data;
    }
};
