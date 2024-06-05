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

import { PublicKey } from "@solana/web3.js";
import { createAssociatedTokenAccount, getAccount, getAssociatedTokenAddress } from "@solana/spl-token";
import * as bs58 from 'bs58';
import React, { useContext, useEffect, useState } from "react";
import { Accordion, Button, Form, InputGroup, ToggleButton } from "react-bootstrap";
import { GenerateKeyPairFromMnemonic, GenerateKeyPairFromSecret } from "../AccountTools";
import Balance from "./Balance";
import ConnectionContextProvider from "./ConnectionContextProvider";
import { ConnectionContext } from "./ConnectionContextProvider";
import AdvButton from "./AdvButton";


const Account = ({ label, secretKey, onKeyPairChange, onBalanceChange = () => { } }) => {
    const [mnemonic, setMnemonic] = useState('');
    const [sKey, setSKey] = useState('');
    const [keyPair, setKeyPair] = useState(undefined);
    const [showSecretKey, setShowSecretKey] = useState(false);
    const [showSeed, setShowSeed] = useState(false);

    useEffect(() => {
        generateFromSecret(secretKey);
    }, []);

    const generateFromSecret = () => {
        const kPair = GenerateKeyPairFromSecret(sKey);
        if (kPair) {
            // console.log(kPair.secretKey.toString());
            // console.log(kPair.secretKey.toLocaleString());
            setMnemonic('');
            setSKey(bs58.encode(kPair.secretKey));
            setKeyPair(kPair);
            onKeyPairChange(kPair);
        } else {
            setMnemonic('');
            setSKey('');
            setKeyPair(undefined);
            onKeyPairChange(undefined);
        }
    };

    const generateKeyPair = () => {
        const { keyPair: kPair, mnemonic: mSeed } = GenerateKeyPairFromMnemonic();
        setMnemonic(mSeed);
        if (kPair) {
            setSKey(bs58.encode(kPair.secretKey));
            setKeyPair(kPair);
            onKeyPairChange(kPair);
        } else {
            setSKey('');
            setKeyPair(undefined);
            onKeyPairChange(undefined);
        }
    }

    const removeAccount = () => {
        setSKey('');
        setKeyPair(undefined);
        onKeyPairChange(undefined);
    };

    const handleMnemonicChange = (event) => setMnemonic(event.target.value);
    const handleSKeyChange = (event) => setSKey(event.target.value);
    const handleHideSecretKeyChange = e => {
        setShowSecretKey(!showSecretKey);
    }
    const handleToggleHideSeed = e => {
        setShowSeed(!showSeed);
    }

    const secretKeyField = (showRemove = true) => (
        <InputGroup className="mb-1">
            <InputGroup.Text>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width={18} height={18} className="me-2 p-0">
                    <path fillRule="evenodd" d="M15.75 1.5a6.75 6.75 0 00-6.651 7.906c.067.39-.032.717-.221.906l-6.5 6.499a3 3 0 00-.878 2.121v2.818c0 .414.336.75.75.75H6a.75.75 0 00.75-.75v-1.5h1.5A.75.75 0 009 19.5V18h1.5a.75.75 0 00.53-.22l2.658-2.658c.19-.189.517-.288.906-.22A6.75 6.75 0 1015.75 1.5zm0 3a.75.75 0 000 1.5A2.25 2.25 0 0118 8.25a.75.75 0 001.5 0 3.75 3.75 0 00-3.75-3.75z" clipRule="evenodd" />
                </svg>
                {!showRemove && label} Secret Key</InputGroup.Text>
            {sKey.length < 20 && <Button onClick={() => generateKeyPair()}>Generate New</Button>}
            <Form.Control aria-label="Secret Key" onChange={handleSKeyChange} value={sKey} placeholder='or enter here' type={!showRemove || showSecretKey ? 'text' : 'password'} />
            {showRemove && <>
                <InputGroup.Text onClick={handleHideSecretKeyChange} style={{ cursor: 'pointer' }}>
                    {
                        showSecretKey ?
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width={20} height={20} className="" style={{ marginBottom: '1px' }}>
                                <path d="M12 15a3 3 0 100-6 3 3 0 000 6z" />
                                <path fillRule="evenodd" d="M1.323 11.447C2.811 6.976 7.028 3.75 12.001 3.75c4.97 0 9.185 3.223 10.675 7.69.12.362.12.752 0 1.113-1.487 4.471-5.705 7.697-10.677 7.697-4.97 0-9.186-3.223-10.675-7.69a1.762 1.762 0 010-1.113zM17.25 12a5.25 5.25 0 11-10.5 0 5.25 5.25 0 0110.5 0z" clipRule="evenodd" />
                            </svg>
                            :
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width={20} height={20} className="" style={{ marginBottom: '1px' }}>
                                <path d="M3.53 2.47a.75.75 0 00-1.06 1.06l18 18a.75.75 0 101.06-1.06l-18-18zM22.676 12.553a11.249 11.249 0 01-2.631 4.31l-3.099-3.099a5.25 5.25 0 00-6.71-6.71L7.759 4.577a11.217 11.217 0 014.242-.827c4.97 0 9.185 3.223 10.675 7.69.12.362.12.752 0 1.113z" />
                                <path d="M15.75 12c0 .18-.013.357-.037.53l-4.244-4.243A3.75 3.75 0 0115.75 12zM12.53 15.713l-4.243-4.244a3.75 3.75 0 004.243 4.243z" />
                                <path d="M6.75 12c0-.619.107-1.213.304-1.764l-3.1-3.1a11.25 11.25 0 00-2.63 4.31c-.12.362-.12.752 0 1.114 1.489 4.467 5.704 7.69 10.675 7.69 1.5 0 2.933-.294 4.242-.827l-2.477-2.477A5.25 5.25 0 016.75 12z" />
                            </svg>
                    }
                </InputGroup.Text>
                {/* <InputGroup.Checkbox aria-label="Checkbox for hiding the secret key" onChange={handleHideSecretKeyChange} checked={showSecretKey} />
                <InputGroup.Text>Show</InputGroup.Text> */}
            </>}
            {sKey.length > 0 && <Button onClick={() => generateFromSecret(sKey)}>Use</Button>}
            {showRemove && <Button onClick={removeAccount} variant='warning'>Clear</Button>}
        </InputGroup>
    );

    const seedField = () => {
        return (
            <>
                <Form.Control aria-label="Mnemonic Seed Phrase" onChange={handleMnemonicChange} value={mnemonic} type={showSeed ? 'text' : 'password'} />
                <InputGroup.Text onClick={handleToggleHideSeed} style={{ cursor: 'pointer' }}>
                    {
                        showSeed ?
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width={20} height={20} className="" style={{ marginBottom: '1px' }}>
                                <path d="M12 15a3 3 0 100-6 3 3 0 000 6z" />
                                <path fillRule="evenodd" d="M1.323 11.447C2.811 6.976 7.028 3.75 12.001 3.75c4.97 0 9.185 3.223 10.675 7.69.12.362.12.752 0 1.113-1.487 4.471-5.705 7.697-10.677 7.697-4.97 0-9.186-3.223-10.675-7.69a1.762 1.762 0 010-1.113zM17.25 12a5.25 5.25 0 11-10.5 0 5.25 5.25 0 0110.5 0z" clipRule="evenodd" />
                            </svg>
                            :
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width={20} height={20} className="" style={{ marginBottom: '1px' }}>
                                <path d="M3.53 2.47a.75.75 0 00-1.06 1.06l18 18a.75.75 0 101.06-1.06l-18-18zM22.676 12.553a11.249 11.249 0 01-2.631 4.31l-3.099-3.099a5.25 5.25 0 00-6.71-6.71L7.759 4.577a11.217 11.217 0 014.242-.827c4.97 0 9.185 3.223 10.675 7.69.12.362.12.752 0 1.113z" />
                                <path d="M15.75 12c0 .18-.013.357-.037.53l-4.244-4.243A3.75 3.75 0 0115.75 12zM12.53 15.713l-4.243-4.244a3.75 3.75 0 004.243 4.243z" />
                                <path d="M6.75 12c0-.619.107-1.213.304-1.764l-3.1-3.1a11.25 11.25 0 00-2.63 4.31c-.12.362-.12.752 0 1.114 1.489 4.467 5.704 7.69 10.675 7.69 1.5 0 2.933-.294 4.242-.827l-2.477-2.477A5.25 5.25 0 016.75 12z" />
                            </svg>
                    }
                </InputGroup.Text>
            </>
        );
    };

    return (
        keyPair ?
            <Accordion className="my-1">
                <Accordion.Item eventKey="account">
                    <Accordion.Header>
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width={18} height={18} className="me-2 w-6 h-6">
                            <path fillRule="evenodd" d="M7.5 6a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zM3.751 20.105a8.25 8.25 0 0116.498 0 .75.75 0 01-.437.695A18.683 18.683 0 0112 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 01-.437-.695z" clipRule="evenodd" />
                        </svg>
                        {`${label}: `}{keyPair.publicKey.toBase58()}</Accordion.Header>
                    <Accordion.Body>
                        {mnemonic !== "" &&
                            <InputGroup className="mb-1">
                                <InputGroup.Text>
                                    {/* <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width={18} height={18} className="me-2">
                                        <path fillRule="evenodd" d="M12 1.5a5.25 5.25 0 00-5.25 5.25v3a3 3 0 00-3 3v6.75a3 3 0 003 3h10.5a3 3 0 003-3v-6.75a3 3 0 00-3-3v-3c0-2.9-2.35-5.25-5.25-5.25zm3.75 8.25v-3a3.75 3.75 0 10-7.5 0v3h7.5z" clipRule="evenodd" />
                                    </svg> */}
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width={18} height={18} className="me-2">
                                        <path d="M11.25 5.337c0-.355-.186-.676-.401-.959a1.647 1.647 0 01-.349-1.003c0-1.036 1.007-1.875 2.25-1.875S15 2.34 15 3.375c0 .369-.128.713-.349 1.003-.215.283-.401.604-.401.959 0 .332.278.598.61.578 1.91-.114 3.79-.342 5.632-.676a.75.75 0 01.878.645 49.17 49.17 0 01.376 5.452.657.657 0 01-.66.664c-.354 0-.675-.186-.958-.401a1.647 1.647 0 00-1.003-.349c-1.035 0-1.875 1.007-1.875 2.25s.84 2.25 1.875 2.25c.369 0 .713-.128 1.003-.349.283-.215.604-.401.959-.401.31 0 .557.262.534.571a48.774 48.774 0 01-.595 4.845.75.75 0 01-.61.61c-1.82.317-3.673.533-5.555.642a.58.58 0 01-.611-.581c0-.355.186-.676.401-.959.221-.29.349-.634.349-1.003 0-1.035-1.007-1.875-2.25-1.875s-2.25.84-2.25 1.875c0 .369.128.713.349 1.003.215.283.401.604.401.959a.641.641 0 01-.658.643 49.118 49.118 0 01-4.708-.36.75.75 0 01-.645-.878c.293-1.614.504-3.257.629-4.924A.53.53 0 005.337 15c-.355 0-.676.186-.959.401-.29.221-.634.349-1.003.349-1.036 0-1.875-1.007-1.875-2.25s.84-2.25 1.875-2.25c.369 0 .713.128 1.003.349.283.215.604.401.959.401a.656.656 0 00.659-.663 47.703 47.703 0 00-.31-4.82.75.75 0 01.83-.832c1.343.155 2.703.254 4.077.294a.64.64 0 00.657-.642z" />
                                    </svg>
                                    Mnemonic Seed Phrase
                                </InputGroup.Text>
                                {seedField()}
                                {/* <Form.Control aria-label="Mnemonic Seed Phrase" onChange={handleMnemonicChange} value={mnemonic} /> */}
                            </InputGroup>}
                        <InputGroup className="mb-1">
                            <InputGroup.Text>
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width={18} height={18} fill="currentColor" className="me-2">
                                    <path fillRule="evenodd" d="M4.5 3.75a3 3 0 00-3 3v10.5a3 3 0 003 3h15a3 3 0 003-3V6.75a3 3 0 00-3-3h-15zm4.125 3a2.25 2.25 0 100 4.5 2.25 2.25 0 000-4.5zm-3.873 8.703a4.126 4.126 0 017.746 0 .75.75 0 01-.351.92 7.47 7.47 0 01-3.522.877 7.47 7.47 0 01-3.522-.877.75.75 0 01-.351-.92zM15 8.25a.75.75 0 000 1.5h3.75a.75.75 0 000-1.5H15zM14.25 12a.75.75 0 01.75-.75h3.75a.75.75 0 010 1.5H15a.75.75 0 01-.75-.75zm.75 2.25a.75.75 0 000 1.5h3.75a.75.75 0 000-1.5H15z" clipRule="evenodd" />
                                </svg>
                                Public Key
                            </InputGroup.Text>
                            <Form.Control aria-label="Public Key" disabled value={keyPair.publicKey.toBase58()} />
                        </InputGroup>
                        {secretKeyField()}
                        <Balance publicKey={keyPair.publicKey.toBase58()} onBalanceChange={onBalanceChange} />
                    </Accordion.Body>
                </Accordion.Item>
            </Accordion>
            :
            secretKeyField(false)
    );
};

const isBase58 = (value) => /^[A-HJ-NP-Za-km-z1-9]*$/.test(value);

export const PublicKeyField = ({ label = '', publicKey = '', onKeyChange, notValidWarning = "⚠️ Not a valid key", emptyWarning = '', className }) => {
    label = <><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width={18} height={18} fill="currentColor" className="me-2">
        <path fillRule="evenodd" d="M4.5 3.75a3 3 0 00-3 3v10.5a3 3 0 003 3h15a3 3 0 003-3V6.75a3 3 0 00-3-3h-15zm4.125 3a2.25 2.25 0 100 4.5 2.25 2.25 0 000-4.5zm-3.873 8.703a4.126 4.126 0 017.746 0 .75.75 0 01-.351.92 7.47 7.47 0 01-3.522.877 7.47 7.47 0 01-3.522-.877.75.75 0 01-.351-.92zM15 8.25a.75.75 0 000 1.5h3.75a.75.75 0 000-1.5H15zM14.25 12a.75.75 0 01.75-.75h3.75a.75.75 0 010 1.5H15a.75.75 0 01-.75-.75zm.75 2.25a.75.75 0 000 1.5h3.75a.75.75 0 000-1.5H15z" clipRule="evenodd" />
    </svg>{label}</>;

    return (
        <Base58Field label={label} keyB58={publicKey} onKeyChange={onKeyChange} notValidWarning={notValidWarning} emptyWarning={emptyWarning} className={className} />
    );
};

export const PrivateKeyField = ({ label = '', privateKey = '', onKeyChange, notValidWarning = "⚠️ Not a valid key", emptyWarning = '', className }) => {
    return (
        <Base58Field label={label} keyB58={privateKey} onKeyChange={onKeyChange} notValidWarning={notValidWarning} emptyWarning={emptyWarning} className={className} minLength={44} maxLength={88} />
    );
};

export const Base58Field = ({ label = '', keyB58 = '', onKeyChange, notValidWarning = "⚠️ Not a valid key", emptyWarning = "", minLength = 32, maxLength = 44, className }) => {
    const [mkey, setMKey] = useState(keyB58);

    const handleKeyChange = (e) => {
        let tkey = e.target.value;
        setMKey(tkey);
        onKeyChange(tkey);
    }

    return (
        <InputGroup className={className}>
            {label &&
                <InputGroup.Text>{label}</InputGroup.Text>}
            <Form.Control aria-label={label} onChange={handleKeyChange} value={mkey} />
            {mkey.length > 0 && (mkey.length < minLength || mkey.length > maxLength || !isBase58(mkey)) &&
                <InputGroup.Text>{notValidWarning}</InputGroup.Text>}
            {mkey.length == 0 && emptyWarning !== "" &&
                <InputGroup.Text>{emptyWarning}</InputGroup.Text>}
        </InputGroup>
    );
};

export const TokenAccount = ({ label, mintAccount, keyPair, onTokenAccountChange = () => { }, onBalanceChange = () => { }, triggerValue = 0 }) => {
    const [mintPublicKey, setMintPublicKey] = useState(mintAccount);
    const [tokenAccount, setTokenAccount] = useState('');
    const [tokenBalance, setTokenBalance] = useState(0);

    useEffect(() => {
        onRefreshTokenBalanceClicked();
    }, [triggerValue, tokenAccount])

    useEffect(() => {
        //TODO: Check if the address actually exists yet!
        getAssociatedTokenAddress(new PublicKey(mintPublicKey), keyPair?.publicKey)
        .then((ata) => { 
            setTokenAccount(ata.toJSON()) 
        });
    }, [mintPublicKey]);

    const clusterConn = useContext(ConnectionContext);

    const onCreateTokenAccountClicked = async () => {
        console.log('creating associated token account...');
        const connection = clusterConn.connection;
        // const connection = new Connection(clusterApiUrl(props.cluster));
        const kPair = keyPair; //generateKeyPairFromSecret({ secretKey: secretKey });
        // Create Associated Token Account
        let ata = null;
        try {
            ata = await createAssociatedTokenAccount(
                connection,
                kPair, // fee payer
                new PublicKey(mintPublicKey), // mint
                kPair.publicKey // owner
            );
        } catch {
            console.log(`couldn't create an associated token account - might already exist. Fetching...`);
            ata = await getAssociatedTokenAddress(new PublicKey(mintPublicKey), kPair.publicKey);
        }
        console.log(ata.toJSON());
        setTokenAccount(ata.toJSON());
        onTokenAccountChange(ata.toJSON());
    };

    const onLogATAInfoClicked = () => {
        const getATAInfo = async () => {
            const connection = clusterConn.connection;
            // const connection = new Connection(clusterApiUrl(props.cluster));
            let ata = await getAccount(connection, new PublicKey(tokenAccount));
            console.log(ata);
        }
        getATAInfo();
    };

    const onRefreshTokenBalanceClicked = async () => {
        if (tokenAccount == '') return; //ABORT

        const connection = clusterConn.connection;

        try {
            let tokenAmount = await connection.getTokenAccountBalance(new PublicKey(tokenAccount));
            console.log(tokenAmount);
            setTokenBalance(tokenAmount.value.amount / Math.pow(10, tokenAmount.value.decimals));
            console.log(tokenBalance);
        } catch (e) { console.log(e); }
    };

    const handleTokenAccountChange = (event) => {
        setTokenAccount(event.target.value);
        onTokenAccountChange(event.target.value);
    };

    //TODO: Show dropdown with all token balances

    return (
        <ConnectionContextProvider>
            <InputGroup>
                <InputGroup.Text>
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width={18} height={18} fill="currentColor" className="me-2">
                        <path fillRule="evenodd" d="M4.5 3.75a3 3 0 00-3 3v10.5a3 3 0 003 3h15a3 3 0 003-3V6.75a3 3 0 00-3-3h-15zm4.125 3a2.25 2.25 0 100 4.5 2.25 2.25 0 000-4.5zm-3.873 8.703a4.126 4.126 0 017.746 0 .75.75 0 01-.351.92 7.47 7.47 0 01-3.522.877 7.47 7.47 0 01-3.522-.877.75.75 0 01-.351-.92zM15 8.25a.75.75 0 000 1.5h3.75a.75.75 0 000-1.5H15zM14.25 12a.75.75 0 01.75-.75h3.75a.75.75 0 010 1.5H15a.75.75 0 01-.75-.75zm.75 2.25a.75.75 0 000 1.5h3.75a.75.75 0 000-1.5H15z" clipRule="evenodd" />
                    </svg>
                    Token Account
                </InputGroup.Text>
                {tokenAccount.length == 0 && <AdvButton onClick={onCreateTokenAccountClicked} disabled={mintPublicKey == 'N/A'}>Create</AdvButton>}
                <Form.Control aria-label="Token Account" onChange={handleTokenAccountChange} placeholder='or enter here' value={tokenAccount} />
                <InputGroup.Text>
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width={18} height={18} className="me-2">
                        <path d="M21 6.375c0 2.692-4.03 4.875-9 4.875S3 9.067 3 6.375 7.03 1.5 12 1.5s9 2.183 9 4.875z" />
                        <path d="M12 12.75c2.685 0 5.19-.586 7.078-1.609a8.283 8.283 0 001.897-1.384c.016.121.025.244.025.368C21 12.817 16.97 15 12 15s-9-2.183-9-4.875c0-.124.009-.247.025-.368a8.285 8.285 0 001.897 1.384C6.809 12.164 9.315 12.75 12 12.75z" />
                        <path d="M12 16.5c2.685 0 5.19-.586 7.078-1.609a8.282 8.282 0 001.897-1.384c.016.121.025.244.025.368 0 2.692-4.03 4.875-9 4.875s-9-2.183-9-4.875c0-.124.009-.247.025-.368a8.284 8.284 0 001.897 1.384C6.809 15.914 9.315 16.5 12 16.5z" />
                        <path d="M12 20.25c2.685 0 5.19-.586 7.078-1.609a8.282 8.282 0 001.897-1.384c.016.121.025.244.025.368 0 2.692-4.03 4.875-9 4.875s-9-2.183-9-4.875c0-.124.009-.247.025-.368a8.284 8.284 0 001.897 1.384C6.809 19.664 9.315 20.25 12 20.25z" />
                    </svg>
                    Balance
                </InputGroup.Text>
                <InputGroup.Text>{tokenBalance}</InputGroup.Text>
                <AdvButton onClick={onRefreshTokenBalanceClicked} variant='primary' disabled={tokenAccount.length < 20}>Refresh</AdvButton>
                {/* <Button onClick={onLogATAInfoClicked} variant='secondary' disabled={tokenAccount.length < 20}>Log Info</Button> */}
            </InputGroup>
        </ConnectionContextProvider>
    );
};

export default Account;