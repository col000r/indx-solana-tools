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

import React, { useState, useContext } from "react";
import { PublicKey } from "@solana/web3.js";
import * as bs58 from 'bs58';
import { Card } from "react-bootstrap";
import TokenCreation from "../components/TokenCreation";
import ConnectionContextProvider, { ConnectionContext } from "../components/ConnectionContextProvider";
import TopNavBar from "../components/TopNavBar";
import Account, { PublicKeyField, TokenAccount } from "../components/Account";
import ToolsCard from "../components/ToolsCard";
import TokenMinting from "../components/TokenMinting";
import { getAssociatedTokenAddress } from "@solana/spl-token";

export const ensureItsAUint8Array = (data) => {
    console.log("ensure it's Uint8", data);
    let json = data.toString();
    if (!json.startsWith('[')) json = `[${json}`;
    if (!json.endsWith(']')) json = `${json}]`;
    const uint8arr = Uint8Array.from(JSON.parse(json));
    return uint8arr;
};

const TokensPage = () => {
    const [secretKey, setSecretKey] = useState("");
    const [accountBalance, setAccountBalance] = useState(0);
    const [keyPair, setKeyPair] = useState(null);
    const [mintAccount, setMintAccount] = useState('');
    const [tokenAccount, setTokenAccount] = useState('');
    const [tokenAccountTriggerValue, setTokenAccountTriggerValue] = useState(0);
    const [mintAuthority, setMintAuthority] = useState('');
    const [freezeAuthority, setFreezeAuthority] = useState('');

    const clusterConn = useContext(ConnectionContext);


    const changeKeyPair = (keyPair) => {
        //console.log('changeKeyPair', keyPair)
        if (keyPair) {
            setSecretKey(bs58.encode(keyPair.secretKey));
            console.log(bs58.encode(keyPair.secretKey));
            setKeyPair(keyPair);
        }
        else {
            setSecretKey('');
            setAccountBalance(0);
            setKeyPair(null);
        }
    }

    const onBalanceChange = (balance) => {
        setAccountBalance(balance);
    };

    const onMintAccountChange = (mintAcc) => {
        console.log('onMintAccountChange', mintAcc);
        setMintAccount(mintAcc);
        findTokenAccountFor(mintAcc);
    };

    const findTokenAccountFor = async (mintAcc) => {
        if (mintAcc?.length < 20) return; // ****
        getAssociatedTokenAddress(new PublicKey(mintAcc), keyPair.publicKey)
            .then((ata) => {
                console.log('findTokenAccount: ata', ata);
                setTokenAccount(ata.toJSON());
            })
    }

    const onTokenAccountChange = (tokenAcc) => {
        setTokenAccount(tokenAcc);
        console.log('set token account', tokenAcc)
    };

    const onTokensMinted = () => {
        setTokenAccountTriggerValue(Math.abs(Math.random() * 100000));
    };

    const onMintAuthorityChange = (key) => {
        setMintAuthority(key);
    };

    const onFreezeAuthorityChange = (key) => {
        setFreezeAuthority(key);
    }

    return (
        <ConnectionContextProvider>
            <TopNavBar currentPage={2} />
            
            <ToolsCard title='' description='General overview'>
                <Card.Header>Token Creation Flow</Card.Header>
                <Card.Body>
                    <ol className="mb-0">
                        <li>Create a <strong>Token Mint Account</strong></li>
                        <li>Create an <strong>Associated Token Account</strong> for a wallet</li>
                        <li><strong>Mint tokens</strong> into an Associated Token Account</li>
                    </ol>
                </Card.Body>
            </ToolsCard>
            <ToolsCard title='' description={<>The Account used for <em>Token</em> creation.<br />Also shows the <em>Associated Token Account</em> once a <em>Token Mint Account</em> has been created.</>}>
                <Card.Header>Account (Fee Payer)</Card.Header>
                <Card.Body>
                    <Account label='Wallet' onKeyPairChange={changeKeyPair} onBalanceChange={onBalanceChange} />
                    {mintAccount.length > 20 ? (
                        <>
                            <hr />
                            <TokenAccount label='Token Account' tokenAcc={tokenAccount} mintAccount={mintAccount} onTokenAccountChange={onTokenAccountChange} keyPair={keyPair} triggerValue={tokenAccountTriggerValue} />
                        </>
                    )
                        : secretKey.length > 20 ?
                            <><hr /><div className="text-muted" style={{ textAlign: 'center' }}>
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width={18} height={18} className="me-2">
                                    <path fillRule="evenodd" d="M9.401 3.003c1.155-2 4.043-2 5.197 0l7.355 12.748c1.154 2-.29 4.5-2.599 4.5H4.645c-2.309 0-3.752-2.5-2.598-4.5L9.4 3.003zM12 8.25a.75.75 0 01.75.75v3.75a.75.75 0 01-1.5 0V9a.75.75 0 01.75-.75zm0 8.25a.75.75 0 100-1.5.75.75 0 000 1.5z" clipRule="evenodd" />
                                </svg>
                                You have to create or set a <em>Mint Account</em> before you can create a <em>Token Account</em> for this Wallet.</div></>
                            :
                            <><hr /><div className="text-muted" style={{ textAlign: 'center' }}>Create or set a <em>Wallet</em> above and create a <em>Mint Account</em> below, before you can create a <em>Token Account</em></div></>
                    }
                </Card.Body>
            </ToolsCard>

            <ToolsCard description="Optionally you can hand the authorities to mint and freeze to other Accounts instead">
                <Card.Header>
                    Optional Addresses
                </Card.Header>
                <Card.Body>
                    <PublicKeyField label="Mint Authority" onKeyChange={onMintAuthorityChange} emptyWarning="None given - Using Feepayer Account instead!" className='mb-1' />
                    <PublicKeyField label="Freeze Authority" onKeyChange={onFreezeAuthorityChange} emptyWarning={`None given - Using ${mintAuthority ? 'Mint Authority' : 'Feepayer'} Account instead!`} />
                </Card.Body>
            </ToolsCard>

            <ToolsCard title='' description="Create a token, monitor its total supply. (Or enter an existing token address)">
                <Card.Header>Token Creation</Card.Header>
                <Card.Body>
                    <TokenCreation publicKey={keyPair?.publicKey} secretKey={keyPair ? bs58.encode(keyPair.secretKey) : null} mintAuthority={mintAuthority ? new PublicKey(mintAuthority) : keyPair?.publicKey} freezeAuthority={freezeAuthority ? new PublicKey(freezeAuthority) : mintAuthority ? new PublicKey(mintAuthority) : keyPair?.publicKey} tokenAcc={tokenAccount} accountBalance={accountBalance} onMintAccountChange={onMintAccountChange} triggerValue={tokenAccountTriggerValue} />
                </Card.Body>
            </ToolsCard>

            <ToolsCard title='' description={<>Mint Tokens to a specific token account. (Make sure the Mint Authority is logged in as the Fee Payer in this case)</>}>
                <Card.Header>Token Minting</Card.Header>
                <Card.Body>
                    <TokenMinting mintAccount={mintAccount} publicKey={keyPair?.publicKey} secretKey={keyPair ? bs58.encode(keyPair.secretKey) : null} mintAuthority={mintAuthority ? new PublicKey(mintAuthority) : keyPair?.publicKey} freezeAuthority={freezeAuthority ? new PublicKey(freezeAuthority) : mintAuthority ? new PublicKey(mintAuthority) : keyPair?.publicKey} tokenAcc={tokenAccount} accountBalance={accountBalance} onTokensMinted={onTokensMinted} />
                </Card.Body>
            </ToolsCard>

        </ConnectionContextProvider>
    );
};

export default TokensPage;

