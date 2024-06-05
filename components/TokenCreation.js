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

import { createMint, getMint, setAuthority, AuthorityType } from "@solana/spl-token";
import React, { useEffect, useState, useContext } from "react";
import { InputGroup, Form } from "react-bootstrap";
import { Keypair, PublicKey } from "@solana/web3.js";
import * as bs58 from 'bs58';
import { ConnectionContext } from "./ConnectionContextProvider";
import AdvButton from "./AdvButton";
import { Metaplex } from "@metaplex-foundation/js";

const generateKeyPairFromSecret = ({ secretKey }) => {
    const kPair = Keypair.fromSecretKey(bs58.decode(secretKey ? secretKey : keyPair.keypair.secretKey));
    const publicKeyBs58 = kPair.publicKey.toBase58();
    return kPair;
};

const TokenCreation = ({ publicKey, secretKey, mintAuthority, freezeAuthority, tokenAcc = '', accountBalance = 0, onMintAccountChange = () => { }, triggerValue = 0 }) => {
    const [mintPublicKey, setMintPublicKey] = useState('');
    const [tokenAccount, setTokenAccount] = useState(tokenAcc);
    const [mintAmount, setMintAmount] = useState(1000);
    const [totalSupply, setTotalSupply] = useState(0);
    const [tokenBalance, setTokenBalance] = useState(0);
    const [tokenDecimals, setTokenDecimals] = useState(8);
    const [tokenMetadata, setTokenMetadata] = useState({
        "name": "TOKEN_NAME",
        "symbol": "TOKEN_SYMBOL",
        "uri": "TOKEN_URI",
        "sellerFeeBasisPoints": 0,
        "creators": null,
        "collection": null,
        "uses": null
    });

    const clusterConn = useContext(ConnectionContext);

    useEffect(() => {
        setTokenAccount(tokenAcc);
        //console.log('tokenAcc', tokenAcc);
    }, []);

    useEffect(() => {
        console.log('triggerValue changed!', triggerValue);
        // setTimeout(() => {
            onRefreshTotalSupplyClicked();
        // }, 1000);
    }, [triggerValue]);

    useEffect(() => {
        if (tokenAccount?.length > 20) onRefreshTokenBalanceClicked();
    }, [tokenAccount]);

    useEffect(() => {
        if (mintPublicKey.length > 20) onLogMintInfoClicked();
    }, [mintPublicKey]);

    const createMintAccount = async (connection, feePayer, mintAuthority, freezeAuthority, decimals) => {
        const mintPubKey = await createMint(
            connection,
            feePayer,
            mintAuthority,
            freezeAuthority,
            decimals
        );
        console.log(mintPubKey.toJSON());
        setMintPublicKey(mintPubKey.toJSON());
        onMintAccountChange(mintPubKey.toJSON());

        const metaplex = new Metaplex(clusterConn.connection);
        const keyPair = Keypair.fromSecretKey(bs58.decode(secretKey));
        metaplex.use(keypairIdentity(keyPair));
        metaplex.use(nftStorage());
    };

    //TODO
    const closeMinting = async () => {
        const kPair = generateKeyPairFromSecret({ secretKey: secretKey });
        const mintPubkey = new PublicKey(mintPublicKey);

        let txhash = await setAuthority(
            clusterConn.connection, // connection
            kPair, // payer
            mintPubkey, // mint account || token account
            kPair, // current authority
            AuthorityType.MintTokens, // authority type
            `null` // new authority (you can pass `null` to close it)
        );

    }

    const onCreateMintAccountClicked = async () => {
        console.log('creating mint account...');
        setMintPublicKey("Please wait...");
        const connection = clusterConn.connection;
        // const connection = new Connection(clusterApiUrl(props.cluster));
        const pKey = new PublicKey(publicKey);
        const kPair = generateKeyPairFromSecret({ secretKey: secretKey });
        return createMintAccount(connection, kPair, mintAuthority, freezeAuthority, tokenDecimals)
    };

    const onLogMintInfoClicked = async () => {
        if(mintPublicKey.length < 20) return; // **** ABORT
        console.log(`getting info for ${mintPublicKey}`);
        const connection = clusterConn.connection;
        // const connection = new Connection(clusterApiUrl(props.cluster));
        try {
            let mintAccount = await getMint(connection, new PublicKey(mintPublicKey));
            console.log(mintAccount);
            setTotalSupply((Number(mintAccount.supply) / Math.pow(10, mintAccount.decimals)).toString());
            setTokenDecimals(mintAccount.decimals.toString());
        } catch (e) {
            console.error(e);
        }
    };

    const onRefreshTotalSupplyClicked = async () => {
        await onLogMintInfoClicked();
    };

    const onRefreshTokenBalanceClicked = async () => {
        const connection = clusterConn.connection;
        try {
            if (tokenAccount?.length < 20) return; // **** ABORT
            let tokenAmount = await connection.getTokenAccountBalance(new PublicKey(tokenAccount));
            console.log(tokenAmount);
            setTokenBalance(tokenAmount.value.amount / Math.pow(10, tokenAmount.value.decimals));
            console.log(tokenBalance);
        } catch (e) {
            throw e;
        }
    };

    const handleMintKeyChange = (event) => {
        console.log('handleMintKeyChange', event.target.value);
        setMintPublicKey(event.target.value);
        onMintAccountChange(event.target.value);
    };

    const handleMintAmountChange = (event) => {
        setMintAmount(event.target.value);
    };

    const handleTokenDecimalsChange = (event) => {
        setTokenDecimals(event.target.value);
    };

    const isMintDisabled = () => {
        return (mintPublicKey == '' || tokenAccount == '');
    }

    const onTokenAccountChange = e => setTokenAccount(e.target.value);

    return (
        <>
            <InputGroup className='mb-1'>
                <InputGroup.Text>
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width={18} height={18} fill="currentColor" className="me-2">
                        <path fillRule="evenodd" d="M4.5 3.75a3 3 0 00-3 3v10.5a3 3 0 003 3h15a3 3 0 003-3V6.75a3 3 0 00-3-3h-15zm4.125 3a2.25 2.25 0 100 4.5 2.25 2.25 0 000-4.5zm-3.873 8.703a4.126 4.126 0 017.746 0 .75.75 0 01-.351.92 7.47 7.47 0 01-3.522.877 7.47 7.47 0 01-3.522-.877.75.75 0 01-.351-.92zM15 8.25a.75.75 0 000 1.5h3.75a.75.75 0 000-1.5H15zM14.25 12a.75.75 0 01.75-.75h3.75a.75.75 0 010 1.5H15a.75.75 0 01-.75-.75zm.75 2.25a.75.75 0 000 1.5h3.75a.75.75 0 000-1.5H15z" clipRule="evenodd" />
                    </svg>
                    Token Mint Account
                </InputGroup.Text>
                <Form.Control aria-label="Mint Public Key" onChange={handleMintKeyChange} value={mintPublicKey} />
                <InputGroup.Text>Decimals</InputGroup.Text>
                <Form.Control aria-label="Token Decimals" onChange={handleTokenDecimalsChange} style={{ maxWidth: '4rem' }} value={tokenDecimals} />
                {mintPublicKey.length < 20 && <AdvButton onClick={onCreateMintAccountClicked} disabled={accountBalance < 0.002}>{`Create${!secretKey ? ` (No Wallet)` : accountBalance < 0.002 ? ' (Insufficiant Balance)' : ''}`}</AdvButton>}
            </InputGroup>
            <InputGroup className='mb-1'>
                <InputGroup.Text>
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width={18} height={18} className="me-2">
                        <path d="M21 6.375c0 2.692-4.03 4.875-9 4.875S3 9.067 3 6.375 7.03 1.5 12 1.5s9 2.183 9 4.875z" />
                        <path d="M12 12.75c2.685 0 5.19-.586 7.078-1.609a8.283 8.283 0 001.897-1.384c.016.121.025.244.025.368C21 12.817 16.97 15 12 15s-9-2.183-9-4.875c0-.124.009-.247.025-.368a8.285 8.285 0 001.897 1.384C6.809 12.164 9.315 12.75 12 12.75z" />
                        <path d="M12 16.5c2.685 0 5.19-.586 7.078-1.609a8.282 8.282 0 001.897-1.384c.016.121.025.244.025.368 0 2.692-4.03 4.875-9 4.875s-9-2.183-9-4.875c0-.124.009-.247.025-.368a8.284 8.284 0 001.897 1.384C6.809 15.914 9.315 16.5 12 16.5z" />
                        <path d="M12 20.25c2.685 0 5.19-.586 7.078-1.609a8.282 8.282 0 001.897-1.384c.016.121.025.244.025.368 0 2.692-4.03 4.875-9 4.875s-9-2.183-9-4.875c0-.124.009-.247.025-.368a8.284 8.284 0 001.897 1.384C6.809 19.664 9.315 20.25 12 20.25z" />
                    </svg>
                    Total Supply
                </InputGroup.Text>
                <Form.Control disabled={true} value={totalSupply} />
                <AdvButton onClick={onRefreshTotalSupplyClicked} variant='primary' disabled={mintPublicKey == ''} style={{ width: '110px' }}>Refresh</AdvButton>
            </InputGroup>
        </>
    );
};

export default TokenCreation;