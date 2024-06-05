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

import { getMint, mintToChecked, getOrCreateAssociatedTokenAccount } from "@solana/spl-token";
import React, { useEffect, useState, useContext } from "react";
import { InputGroup, Form } from "react-bootstrap";
import { Keypair, PublicKey } from "@solana/web3.js";
import * as bs58 from 'bs58';
import { ConnectionContext } from "./ConnectionContextProvider";
import AdvButton from "./AdvButton";

const generateKeyPairFromSecret = ({ secretKey }) => {
    const kPair = Keypair.fromSecretKey(bs58.decode(secretKey ? secretKey : keyPair.keypair.secretKey));
    const publicKeyBs58 = kPair.publicKey.toBase58();
    return kPair;
};

const TokenMinting = ({mintAccount, publicKey, secretKey, mintAuthority, freezeAuthority, tokenAcc = '', accountBalance = 0, onTokensMinted = () => {}}) => {
    const [tokenAccount, setTokenAccount] = useState(tokenAcc);
    const [mintAmount, setMintAmount] = useState(1000);

    const clusterConn = useContext(ConnectionContext);

    useEffect(() => {
        setTokenAccount(tokenAcc);
    }, [tokenAcc]);

    const onMintClicked = async () => {
        console.log(`Minting ${mintAmount} ${mintAccount} tokens to ${tokenAccount}`)
        const connection = clusterConn.connection;
        // const connection = new Connection(clusterApiUrl(props.cluster));

        let tokenInfo = await getMint(connection, new PublicKey(mintAccount));
        const tokenDecimals = tokenInfo.decimals;

        const kPair = generateKeyPairFromSecret({ secretKey: secretKey });
        
        const ata = await getOrCreateAssociatedTokenAccount(
            connection, 
            kPair,
            new PublicKey(mintAccount),
            kPair.publicKey,
            true
        )
        console.log('ata', ata);
        console.log(ata.address.toBase58(), tokenAccount);
        const txhash = await mintToChecked(
            connection,
            kPair, // fee payer  
            new PublicKey(mintAccount), // mint
            new PublicKey(tokenAccount), // receiver (token account)
            kPair, // mint authority
            mintAmount * Math.pow(10, tokenDecimals), // how much to mint - if 8 decimals, then 10^8 for 1 token
            tokenDecimals // decimals
        );
        console.log(txhash);
        const latestBlockHash = await connection.getLatestBlockhash();
        const confirmation = await connection.confirmTransaction({
            blockhash: latestBlockHash.blockhash,
            lastValidBlockHeight: latestBlockHash.lastValidBlockHeight,
            signature: txhash,
        });
        onTokensMinted();
    };

    const handleMintAmountChange = (event) => {
        setMintAmount(event.target.value);
    };

    const isMintDisabled = () => {
        return (mintAccount == '' || tokenAccount == '');
    }

    const onTokenAccountChange = e => setTokenAccount(e.target.value);

    return (
        <>
            <InputGroup className='mb-1'>
                <InputGroup.Text>Mint</InputGroup.Text>
                <Form.Control aria-label="Mint Amount" onChange={handleMintAmountChange} value={mintAmount} />
                <InputGroup.Text>to</InputGroup.Text>
                <InputGroup.Text>
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width={18} height={18} fill="currentColor" className="me-2">
                        <path fillRule="evenodd" d="M4.5 3.75a3 3 0 00-3 3v10.5a3 3 0 003 3h15a3 3 0 003-3V6.75a3 3 0 00-3-3h-15zm4.125 3a2.25 2.25 0 100 4.5 2.25 2.25 0 000-4.5zm-3.873 8.703a4.126 4.126 0 017.746 0 .75.75 0 01-.351.92 7.47 7.47 0 01-3.522.877 7.47 7.47 0 01-3.522-.877.75.75 0 01-.351-.92zM15 8.25a.75.75 0 000 1.5h3.75a.75.75 0 000-1.5H15zM14.25 12a.75.75 0 01.75-.75h3.75a.75.75 0 010 1.5H15a.75.75 0 01-.75-.75zm.75 2.25a.75.75 0 000 1.5h3.75a.75.75 0 000-1.5H15z" clipRule="evenodd" />
                    </svg>
                    Token Account
                </InputGroup.Text>
                <Form.Control onChange={onTokenAccountChange} placeholder='enter here' value={tokenAccount}  />
                <AdvButton onClick={onMintClicked} variant='primary' disabled={isMintDisabled()} style={{width: '110px'}}>Mint</AdvButton>
            </InputGroup>
        </>
    );
};

export default TokenMinting;