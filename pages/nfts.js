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

import React, { useState } from "react";
import * as bs58 from 'bs58';
import Head from 'next/head'
import ConnectionContextProvider from "../components/ConnectionContextProvider";
import CandyMachines from "../components/CandyMachines";
import TopNavBar from "../components/TopNavBar";
import Account, { PublicKeyField } from "../components/Account";
import ToolsCard from "../components/ToolsCard";
import { Card } from "react-bootstrap";

const NFTs = (props) => {
    const [secretKey, setSecretKey] = useState("");
    const [creatorPKey, setCreatorPKey] = useState(undefined);
    const [accountBalance, setAccountBalance] = useState(0);

    const changeKeyPair = (keyPair) => {
        //console.log('changeKeyPair', keyPair)
        if (keyPair) {
            setSecretKey(bs58.encode(keyPair.secretKey));
            console.log(bs58.encode(keyPair.secretKey));
        }
        else {
            setSecretKey('');
            setAccountBalance(0);
        }
    }

    const changeCreator = (pKey) => {
        console.log(pKey);
        setCreatorPKey(pKey);
    }

    const onBalanceChange = (balance) => {
        setAccountBalance(balance);
    }

    return (
        <ConnectionContextProvider>
            <Head>
                <title>NFT Tools</title>
                <meta name="description" content="NFT Tools" />
                <link rel="icon" href="/favicon.ico" />
            </Head>

            <TopNavBar currentPage={3} />

            <ToolsCard title='' description={<>The Wallet that you want to create everything with. Also used as the Creator, unless you set a different Public Key for that.</>}>
                <Card.Header>
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width={18} height={18} fill="currentColor" className="me-2 mb-1">
                        <path d="M4.5 6.375a4.125 4.125 0 118.25 0 4.125 4.125 0 01-8.25 0zM14.25 8.625a3.375 3.375 0 116.75 0 3.375 3.375 0 01-6.75 0zM1.5 19.125a7.125 7.125 0 0114.25 0v.003l-.001.119a.75.75 0 01-.363.63 13.067 13.067 0 01-6.761 1.873c-2.472 0-4.786-.684-6.76-1.873a.75.75 0 01-.364-.63l-.001-.122zM17.25 19.128l-.001.144a2.25 2.25 0 01-.233.96 10.088 10.088 0 005.06-1.01.75.75 0 00.42-.643 4.875 4.875 0 00-6.957-4.611 8.586 8.586 0 011.71 5.157v.003z" />
                    </svg>
                    Identities
                    {secretKey != '' && <span style={{ float: 'right' }}>✅</span>}
                </Card.Header>
                <Card.Body>
                    <Account label='Main Identity' onKeyPairChange={changeKeyPair} onBalanceChange={onBalanceChange} />
                    <PublicKeyField label="Creator" onKeyChange={changeCreator} emptyWarning="ℹ️ No Key - Using Main Identity instead" />
                </Card.Body>
            </ToolsCard>

            <CandyMachines secretKey={secretKey} creatorPKey={creatorPKey} accountBalance={accountBalance}></CandyMachines>

        </ConnectionContextProvider>
    );
}

export default NFTs;