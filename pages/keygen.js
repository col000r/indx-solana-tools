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

import React, { useState, useContext, useEffect } from "react";
import { Keypair, LAMPORTS_PER_SOL, Transaction, sendAndConfirmTransaction, SystemProgram, PublicKey } from "@solana/web3.js";
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";
import * as bip39 from "bip39";
import * as bs58 from 'bs58';
import { derivePath } from "ed25519-hd-key";
import { Button, InputGroup, Form, Card } from "react-bootstrap";
import Balance from "../components/Balance";
import ConnectionContextProvider, { ConnectionContext } from "../components/ConnectionContextProvider";

import TopNavBar from "../components/TopNavBar";
import ToolsCard from "../components/ToolsCard";
import { SendSOL } from "../components/SendSOL";

export const ensureItsAUint8Array = (data) => {
    console.log("ensure it's Uint8", data);
    let json = data.toString();
    if (!json.startsWith('[')) json = `[${json}`;
    if (!json.endsWith(']')) json = `${json}]`;
    const uint8arr = Uint8Array.from(JSON.parse(json));
    return uint8arr;
};

const KeyPair = () => {
    const [keyPair, setKeyPair] = useState({ mnemonic: "", seed: "", keypair: { publicKey: "", secretKey: "", secretUint8: [] } });
    const [sendSolAmount, setSendSolAmount] = useState(1);
    const [sendSolAddress, setSendSolAddress] = useState('');
    const [count, setCount] = useState(0); //just to trigger balance changes
    const [accountATAs, setAccountATAs] = useState([]);

    const clusterConn = useContext(ConnectionContext);

    useEffect(() => {
        refreshATAs();
    }, [keyPair, clusterConn])

    const generateKeyPair = () => {
        const mnemonic = bip39.generateMnemonic();
        generateEverythingFromMnemonic(mnemonic);
    }

    const handleMnemonicChange = (event) => {
        setKeyPair((prevState) => {
            return { ...prevState, mnemonic: event.target.value };
        });
        //console.log(keyPair);
    };
    const handlePublicKeyChange = (event) => {
        setKeyPair((prevState) => {
            return { ...prevState, keypair: { publicKey: event.target.value, secretKey: prevState.keypair.secretKey, secretUint8: prevState.keypair.secretUint8 } }
        });
    };
    const handleSecretKeyChange = (event) => {
        setKeyPair((prevState) => {
            try {
                const kPair = Keypair.fromSecretKey(bs58.decode(event.target.value));
                return { ...prevState, keypair: { publicKey: prevState.keypair.publicKey, secretKey: event.target.value, secretUint8: kPair.secretKey.toString() } };
            } catch (e) {
                return { ...prevState, keypair: { publicKey: '', secretKey: event.target.value, secretUint8: '' } };
            };
        });
    };

    const handleSecretUint8Change = (event) => {
        setKeyPair((prevState) => {
            return { ...prevState, keypair: { publicKey: prevState.keypair.publicKey, secretKey: prevState.keypair.secretKey, secretUint8: event.target.value } }
        });
    };

    const generateFromMnemonic = () => {
        if (!keyPair.mnemonic) return;
        generateEverythingFromMnemonic(keyPair.mnemonic);
    };

    const generateFromSecret = ({ secretKey }) => {
        console.log(secretKey);
        const kPair = Keypair.fromSecretKey(bs58.decode(secretKey ? secretKey : keyPair.keypair.secretKey));
        const publicKeyBs58 = kPair.publicKey.toBase58();
        console.log(publicKeyBs58);
        setKeyPair({ mnemonic: "", keypair: { publicKey: publicKeyBs58, secretKey: bs58.encode(kPair.secretKey), secretUint8: kPair.secretKey.toString() } });
    };

    const generateFromSecretUnit8 = () => {
        const uint8arr = ensureItsAUint8Array(keyPair.keypair.secretUint8);
        console.log(">>>", uint8arr);
        const kPair = Keypair.fromSecretKey(uint8arr);
        const publicKeyBs58 = kPair.publicKey.toBase58();
        const secretKeyBs58 = bs58.encode(kPair.secretKey);
        console.log(publicKeyBs58);
        setKeyPair({ mnemonic: "", keypair: { publicKey: publicKeyBs58, secretKey: secretKeyBs58, secretUint8: kPair.secretKey.toString() } });
    };

    const generateDerived = () => {
        generateEverythingFromMnemonic(keyPair.mnemonic);
    };

    const generateEverythingFromMnemonic = (mnemonic) => {
        console.log('gen everything from: ', mnemonic);
        const seed = bip39.mnemonicToSeedSync(mnemonic, "");
        //const kPair = Keypair.fromSeed(seed);
        //const kPair = Keypair.fromSeed(seed.toString("hex").key);
        const kPair = Keypair.fromSeed(seed.slice(0, 32));

        const publicKeyBs58 = kPair.publicKey.toBase58();
        const secretKeyBs58 = bs58.encode(kPair.secretKey);

        let derivedKeyPairs = [];
        for (let i = 0; i < 10; i++) {
            const path = `m/44'/501'/${i}'/0'`;
            const derivedKeyPair = Keypair.fromSeed(derivePath(path, seed.toString("hex")).key);
            derivedKeyPairs.push({ publicKey: derivedKeyPair.publicKey.toBase58(), secretKey: (bs58.encode(derivedKeyPair.secretKey)) });
            //console.log(`${path} => ${derivedKeyPair.publicKey.toBase58()}`);
        }

        console.log("mnemonic: ", mnemonic);
        console.log("seed: ", seed);
        console.log("publicKey: ", kPair.publicKey.toJSON());
        console.log("publicKey Base58: ", kPair.publicKey.toBase58(), kPair.publicKey.toBase58().length);
        console.log("secretKey: ", kPair.secretKey);
        console.log("secretKey Base58: ", bs58.encode(kPair.secretKey), bs58.encode(kPair.secretKey).length);
        console.log("secretKey length", kPair.secretKey.length);

        setKeyPair({ mnemonic: mnemonic, keypair: { publicKey: publicKeyBs58, secretKey: secretKeyBs58, secretUint8: kPair.secretKey.toString() }, derived: derivedKeyPairs });

    };

    const test = () => { };

    const refreshATAs = async () => {
        if (!keyPair.keypair.publicKey) return; //ABORT

        const connection = clusterConn.connection;
        // const connection = new Connection(clusterApiUrl(props.cluster));
        const accounts = await connection.getParsedProgramAccounts(
            TOKEN_PROGRAM_ID,
            {
                filters: [
                    {
                        dataSize: 165, // number of bytes
                    },
                    {
                        memcmp: {
                            offset: 32, // number of bytes
                            bytes: keyPair.keypair.publicKey
                        },
                    },
                ],
            },
        );

        console.log(`Found ${accounts.length} token account(s) for wallet ${keyPair.keypair.publicKey}`);
        let atas = [];
        accounts.forEach((account, i) => {
            const ata = {
                pubKey: account.pubkey.toBase58(),
                mint: account.account.data["parsed"]["info"]["mint"],
                balance: 'Loading...'
            };
            atas.push(ata);
            console.log(`-- Token Account Address ${i + 1}: ${account.pubkey.toString()} --`);
            console.log(`Mint: ${account.account.data["parsed"]["info"]["mint"]}`);
            console.log(`Amount: ${account.account.data["parsed"]["info"]["tokenAmount"]["uiAmount"]}`);

            getTokenBalances(atas);

        });
        setAccountATAs(atas);
    }

    const getTokenBalance = async (pubKey) => {
        return clusterConn.connection.getTokenAccountBalance(new PublicKey(pubKey))
            .then((tokenAmount) => {
                console.log(pubKey, tokenAmount);
                return tokenAmount.value.amount / Math.pow(10, tokenAmount.value.decimals);
            });
    };

    const getTokenBalances = async (atas) => {

        let uatas = [];
        for (let ata of atas) {
            await getTokenBalance(ata.pubKey).then((balance) => {
                uatas.push({
                    pubKey: ata.pubKey,
                    mint: ata.mint,
                    balance: balance
                });
            });
        }

        setAccountATAs(uatas);
    };

    const onSOLSent = () => {
        setCount(count + 1);
    };

    return (
        <ConnectionContextProvider>
            <TopNavBar currentPage={1} />
            <ToolsCard title='' description={<>Create a new <em>Wallet</em> from scratch or from an existing seed phrase, secret key or Uint8Array.<br />Or simply paste in an existing public key to inspect any wallet.</>}>
                <Card.Header>
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width={18} height={18} className="me-2 mb-1">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a2.25 2.25 0 00-2.25-2.25H15a3 3 0 11-6 0H5.25A2.25 2.25 0 003 12m18 0v6a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 18v-6m18 0V9M3 12V9m18 0a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 9m18 0V6a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 6v3" />
                    </svg>
                    Wallet
                </Card.Header>
                <Card.Body>
                    <InputGroup className='mb-1'>
                        <InputGroup.Text>
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width={18} height={18} className="me-2">
                                <path d="M11.25 5.337c0-.355-.186-.676-.401-.959a1.647 1.647 0 01-.349-1.003c0-1.036 1.007-1.875 2.25-1.875S15 2.34 15 3.375c0 .369-.128.713-.349 1.003-.215.283-.401.604-.401.959 0 .332.278.598.61.578 1.91-.114 3.79-.342 5.632-.676a.75.75 0 01.878.645 49.17 49.17 0 01.376 5.452.657.657 0 01-.66.664c-.354 0-.675-.186-.958-.401a1.647 1.647 0 00-1.003-.349c-1.035 0-1.875 1.007-1.875 2.25s.84 2.25 1.875 2.25c.369 0 .713-.128 1.003-.349.283-.215.604-.401.959-.401.31 0 .557.262.534.571a48.774 48.774 0 01-.595 4.845.75.75 0 01-.61.61c-1.82.317-3.673.533-5.555.642a.58.58 0 01-.611-.581c0-.355.186-.676.401-.959.221-.29.349-.634.349-1.003 0-1.035-1.007-1.875-2.25-1.875s-2.25.84-2.25 1.875c0 .369.128.713.349 1.003.215.283.401.604.401.959a.641.641 0 01-.658.643 49.118 49.118 0 01-4.708-.36.75.75 0 01-.645-.878c.293-1.614.504-3.257.629-4.924A.53.53 0 005.337 15c-.355 0-.676.186-.959.401-.29.221-.634.349-1.003.349-1.036 0-1.875-1.007-1.875-2.25s.84-2.25 1.875-2.25c.369 0 .713.128 1.003.349.283.215.604.401.959.401a.656.656 0 00.659-.663 47.703 47.703 0 00-.31-4.82.75.75 0 01.83-.832c1.343.155 2.703.254 4.077.294a.64.64 0 00.657-.642z" />
                            </svg>
                            Mnemonic Seed Phrase
                        </InputGroup.Text>
                        <Form.Control aria-label="Mnemonic" onChange={handleMnemonicChange} value={keyPair?.mnemonic} />
                        <Button onClick={keyPair?.mnemonic !== '' ? generateFromMnemonic : generateKeyPair}>Generate</Button>
                        {/* <Button onClick={generateDerived} variant='secondary'>Derive</Button> */}
                    </InputGroup>
                    <InputGroup className='mb-1'>
                        <InputGroup.Text style={{ width: '130px' }}>
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width={18} height={18} fill="currentColor" className="me-2">
                                <path fillRule="evenodd" d="M4.5 3.75a3 3 0 00-3 3v10.5a3 3 0 003 3h15a3 3 0 003-3V6.75a3 3 0 00-3-3h-15zm4.125 3a2.25 2.25 0 100 4.5 2.25 2.25 0 000-4.5zm-3.873 8.703a4.126 4.126 0 017.746 0 .75.75 0 01-.351.92 7.47 7.47 0 01-3.522.877 7.47 7.47 0 01-3.522-.877.75.75 0 01-.351-.92zM15 8.25a.75.75 0 000 1.5h3.75a.75.75 0 000-1.5H15zM14.25 12a.75.75 0 01.75-.75h3.75a.75.75 0 010 1.5H15a.75.75 0 01-.75-.75zm.75 2.25a.75.75 0 000 1.5h3.75a.75.75 0 000-1.5H15z" clipRule="evenodd" />
                            </svg>
                            Public Key
                        </InputGroup.Text>
                        <Form.Control aria-label="Public Key" onChange={handlePublicKeyChange} value={keyPair?.keypair.publicKey} />
                    </InputGroup>
                    <InputGroup className='mb-1'>
                        <InputGroup.Text style={{ width: '130px' }}>
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width={18} height={18} className="me-2 p-0">
                                <path fillRule="evenodd" d="M15.75 1.5a6.75 6.75 0 00-6.651 7.906c.067.39-.032.717-.221.906l-6.5 6.499a3 3 0 00-.878 2.121v2.818c0 .414.336.75.75.75H6a.75.75 0 00.75-.75v-1.5h1.5A.75.75 0 009 19.5V18h1.5a.75.75 0 00.53-.22l2.658-2.658c.19-.189.517-.288.906-.22A6.75 6.75 0 1015.75 1.5zm0 3a.75.75 0 000 1.5A2.25 2.25 0 0118 8.25a.75.75 0 001.5 0 3.75 3.75 0 00-3.75-3.75z" clipRule="evenodd" />
                            </svg>
                            Secret Key
                        </InputGroup.Text>
                        <Form.Control aria-label="Secret Key" onChange={handleSecretKeyChange} value={keyPair?.keypair.secretKey} />
                        <Button onClick={generateFromSecret} disabled={keyPair?.keypair.secretKey?.length < 20}>Generate</Button>
                    </InputGroup>
                    <InputGroup className='mb-1'>
                        <InputGroup.Text>
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width={18} height={18} className="me-2">
                                <path fillRule="evenodd" d="M1.5 5.625c0-1.036.84-1.875 1.875-1.875h17.25c1.035 0 1.875.84 1.875 1.875v12.75c0 1.035-.84 1.875-1.875 1.875H3.375A1.875 1.875 0 011.5 18.375V5.625zM21 9.375A.375.375 0 0020.625 9h-7.5a.375.375 0 00-.375.375v1.5c0 .207.168.375.375.375h7.5a.375.375 0 00.375-.375v-1.5zm0 3.75a.375.375 0 00-.375-.375h-7.5a.375.375 0 00-.375.375v1.5c0 .207.168.375.375.375h7.5a.375.375 0 00.375-.375v-1.5zm0 3.75a.375.375 0 00-.375-.375h-7.5a.375.375 0 00-.375.375v1.5c0 .207.168.375.375.375h7.5a.375.375 0 00.375-.375v-1.5zM10.875 18.75a.375.375 0 00.375-.375v-1.5a.375.375 0 00-.375-.375h-7.5a.375.375 0 00-.375.375v1.5c0 .207.168.375.375.375h7.5zM3.375 15h7.5a.375.375 0 00.375-.375v-1.5a.375.375 0 00-.375-.375h-7.5a.375.375 0 00-.375.375v1.5c0 .207.168.375.375.375zm0-3.75h7.5a.375.375 0 00.375-.375v-1.5A.375.375 0 0010.875 9h-7.5A.375.375 0 003 9.375v1.5c0 .207.168.375.375.375z" clipRule="evenodd" />
                            </svg>
                            Secret Key (Uint8)
                        </InputGroup.Text>
                        <Form.Control aria-label="Secret Key Uint8" onChange={handleSecretUint8Change} value={keyPair?.keypair.secretUint8} />
                        <Button onClick={generateFromSecretUnit8} disabled={keyPair?.keypair.secretUint8 < 20}>Generate</Button>
                    </InputGroup>
                </Card.Body>
            </ToolsCard>

            <ToolsCard title='' description={<>The contents of your Wallet.</>}>
                <Card.Header>
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width={18} height={18} className="me-2 mb-1">
                        <path d="M21 6.375c0 2.692-4.03 4.875-9 4.875S3 9.067 3 6.375 7.03 1.5 12 1.5s9 2.183 9 4.875z" />
                        <path d="M12 12.75c2.685 0 5.19-.586 7.078-1.609a8.283 8.283 0 001.897-1.384c.016.121.025.244.025.368C21 12.817 16.97 15 12 15s-9-2.183-9-4.875c0-.124.009-.247.025-.368a8.285 8.285 0 001.897 1.384C6.809 12.164 9.315 12.75 12 12.75z" />
                        <path d="M12 16.5c2.685 0 5.19-.586 7.078-1.609a8.282 8.282 0 001.897-1.384c.016.121.025.244.025.368 0 2.692-4.03 4.875-9 4.875s-9-2.183-9-4.875c0-.124.009-.247.025-.368a8.284 8.284 0 001.897 1.384C6.809 15.914 9.315 16.5 12 16.5z" />
                        <path d="M12 20.25c2.685 0 5.19-.586 7.078-1.609a8.282 8.282 0 001.897-1.384c.016.121.025.244.025.368 0 2.692-4.03 4.875-9 4.875s-9-2.183-9-4.875c0-.124.009-.247.025-.368a8.284 8.284 0 001.897 1.384C6.809 19.664 9.315 20.25 12 20.25z" />
                    </svg>
                    Balance and Tokens
                </Card.Header>
                <Card.Body>
                    {keyPair?.keypair.publicKey ? (
                        <>
                            {/* <ClusterDropdown label='Cluster' /> */}
                            <Balance publicKey={keyPair.keypair.publicKey} count={count} />
                            <p></p>

                            {accountATAs.length > 0 ? (
                                <>
                                    {
                                        accountATAs.map((ata, id) => (
                                            <InputGroup key={'ataig' + id} className="mb-1">
                                                <InputGroup.Text key={'ataM' + id}>Mint</InputGroup.Text>
                                                <Form.Control value={ata.mint} disabled={true} />
                                                <InputGroup.Text key={'ata' + id}>Key</InputGroup.Text>
                                                <Form.Control value={ata.pubKey} disabled={true} />
                                                <InputGroup.Text key={'atab' + id}>Balance</InputGroup.Text>
                                                <Form.Control value={ata.balance} disabled={true} />
                                            </InputGroup>
                                        ))
                                    }
                                </>

                            ) : <div>No Token Accounts found</div>}
                        </>
                    )
                        : <div style={{ textAlign: 'center' }} className='text-muted'>No Wallet</div>
                    }
                </Card.Body>
            </ToolsCard>

            <SendSOL secretKey={keyPair?.keypair?.secretKey} onChanged={onSOLSent} />

            <ToolsCard title='' description={<>Additional KeyPairs can be derived from the same mnemonic seed phrase.</>}>
                <Card.Header>
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width={18} height={18} className="me-2 mb-1">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z" />
                    </svg>
                    Derived Keys
                </Card.Header>
                <Card.Body>
                    {keyPair?.derived && keyPair?.derived.length ? (
                        <div>
                            {
                                keyPair.derived.map((kPair, id) => (
                                    <InputGroup key={id} className='mb-1'>
                                        <InputGroup.Text key={'t' + id}>Derived {id}</InputGroup.Text>
                                        <Form.Control key={'pK' + id} value={kPair.publicKey} onChange={test} />
                                        <Form.Control key={'sK' + id} value={kPair.secretKey} onChange={test} />
                                        <Button onClick={() => { generateFromSecret({ secretKey: kPair.secretKey }) }}>Use</Button>
                                    </InputGroup>
                                ))
                            }
                        </div>
                    ) : keyPair.mnemonic.length == 0 ? (
                        <p style={{ textAlign: 'center' }} className='text-muted'>
                            <i>Derived Keypairs can only be generated from a mnemonic seed phrase</i>
                        </p>
                    ) : (
                        <p style={{ textAlign: 'center' }} className='text-muted'>
                            <i>No derived KeyPairs generated</i>
                        </p>
                    )}
                </Card.Body>
            </ToolsCard>
    
        </ConnectionContextProvider>
    );
};

export default KeyPair;

