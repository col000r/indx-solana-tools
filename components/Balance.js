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

import React, { useContext, useEffect, useState } from "react";
import { Button, Form, InputGroup } from "react-bootstrap";
import { PublicKey, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { ConnectionContext } from "./ConnectionContextProvider";
import AdvButton from "./AdvButton";

const refreshIconSvg = <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width={18} height={18} className=" mb-1"><path fillRule="evenodd" d="M4.755 10.059a7.5 7.5 0 0112.548-3.364l1.903 1.903h-3.183a.75.75 0 100 1.5h4.992a.75.75 0 00.75-.75V4.356a.75.75 0 00-1.5 0v3.18l-1.9-1.9A9 9 0 003.306 9.67a.75.75 0 101.45.388zm15.408 3.352a.75.75 0 00-.919.53 7.5 7.5 0 01-12.548 3.364l-1.902-1.903h3.183a.75.75 0 000-1.5H2.984a.75.75 0 00-.75.75v4.992a.75.75 0 001.5 0v-3.18l1.9 1.9a9 9 0 0015.059-4.035.75.75 0 00-.53-.918z" clipRule="evenodd" /></svg>;

const Balance = ({ publicKey, onBalanceChange = () => { }, count = 0 }) => {
    let [balance, setBalance] = useState('0');
    let [refreshIcon, setRefreshIcon] = useState(refreshIconSvg);

    const clusterConn = useContext(ConnectionContext);

    useEffect(() => {
        updateBalance();
        console.log(clusterConn.cluster);
    }, [publicKey, clusterConn, count])

    useEffect(() => {
        console.log("Balance CHANGED: ", balance);
        onBalanceChange(balance);
    }, [balance])

    const updateBalance = async () => {
        console.log('querying balance...');
        const connection = clusterConn.connection;
        //const connection = new Connection(clusterApiUrl(props.cluster));
        const pKey = new PublicKey(publicKey);
        await connection.getBalance(pKey).then((b) => {
            setBalance(b / LAMPORTS_PER_SOL);
            setRefreshIcon(refreshIconSvg)
            console.log(`${balance} SOL`);
        });
    };

    const onUpdateBalanceClicked = async () => {
        setRefreshIcon('');
        await updateBalance();
    };

    const delay = ms => new Promise(res => setTimeout(res, ms));

    const getLatestBlockHash = async (txhash, connection) => {
        let latestBlockHash = await connection.getLatestBlockhash();
        return { latestBlockHash, txhash };
    };

    const requestAirdrop = async () => {
        console.log('requesting airdrop...');
        console.log(clusterConn.cluster);
        const connection = clusterConn.connection;
        const pKey = new PublicKey(publicKey);
        return connection.requestAirdrop(pKey, 1 * LAMPORTS_PER_SOL)
            .then((txhash) => {
                // console.log(`txhash: ${txhash}`);
                return getLatestBlockHash(txhash, connection);
            }).then(({ latestBlockHash, txhash }) => {
                // console.log(`txhash XXX: ${txhash}`);
                return connection.confirmTransaction({
                    blockhash: latestBlockHash.blockhash,
                    lastValidBlockHeight: latestBlockHash.lastValidBlockHeight,
                    signature: txhash,
                });
            }).then((confirmation) => {
                console.log(confirmation);
                return updateBalance();
            }).then(() => console.log('ALL DONE!'))
            .catch((e) => { throw e; });
    }

    return (
        <>
            <InputGroup>
                <InputGroup.Text>
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width={18} height={18}>
                        <path d="M21 6.375c0 2.692-4.03 4.875-9 4.875S3 9.067 3 6.375 7.03 1.5 12 1.5s9 2.183 9 4.875z" />
                        <path d="M12 12.75c2.685 0 5.19-.586 7.078-1.609a8.283 8.283 0 001.897-1.384c.016.121.025.244.025.368C21 12.817 16.97 15 12 15s-9-2.183-9-4.875c0-.124.009-.247.025-.368a8.285 8.285 0 001.897 1.384C6.809 12.164 9.315 12.75 12 12.75z" />
                        <path d="M12 16.5c2.685 0 5.19-.586 7.078-1.609a8.282 8.282 0 001.897-1.384c.016.121.025.244.025.368 0 2.692-4.03 4.875-9 4.875s-9-2.183-9-4.875c0-.124.009-.247.025-.368a8.284 8.284 0 001.897 1.384C6.809 15.914 9.315 16.5 12 16.5z" />
                        <path d="M12 20.25c2.685 0 5.19-.586 7.078-1.609a8.282 8.282 0 001.897-1.384c.016.121.025.244.025.368 0 2.692-4.03 4.875-9 4.875s-9-2.183-9-4.875c0-.124.009-.247.025-.368a8.284 8.284 0 001.897 1.384C6.809 19.664 9.315 20.25 12 20.25z" />
                    </svg>
                </InputGroup.Text>
                <Form.Control disabled={true} value={`${balance} SOL`} />
                <AdvButton onClick={onUpdateBalanceClicked}>
                    {refreshIcon}
                    {/* Refresh Balance */}
                </AdvButton>
                {clusterConn.cluster !== 'mainnet-beta' &&
                <AdvButton onClick={requestAirdrop} variant='secondary'>
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width={18} height={18} className="me-2 mb-1">
                        <path d="M21 6.375c0 2.692-4.03 4.875-9 4.875S3 9.067 3 6.375 7.03 1.5 12 1.5s9 2.183 9 4.875z" />
                        <path d="M12 12.75c2.685 0 5.19-.586 7.078-1.609a8.283 8.283 0 001.897-1.384c.016.121.025.244.025.368C21 12.817 16.97 15 12 15s-9-2.183-9-4.875c0-.124.009-.247.025-.368a8.285 8.285 0 001.897 1.384C6.809 12.164 9.315 12.75 12 12.75z" />
                        <path d="M12 16.5c2.685 0 5.19-.586 7.078-1.609a8.282 8.282 0 001.897-1.384c.016.121.025.244.025.368 0 2.692-4.03 4.875-9 4.875s-9-2.183-9-4.875c0-.124.009-.247.025-.368a8.284 8.284 0 001.897 1.384C6.809 15.914 9.315 16.5 12 16.5z" />
                        <path d="M12 20.25c2.685 0 5.19-.586 7.078-1.609a8.282 8.282 0 001.897-1.384c.016.121.025.244.025.368 0 2.692-4.03 4.875-9 4.875s-9-2.183-9-4.875c0-.124.009-.247.025-.368a8.284 8.284 0 001.897 1.384C6.809 19.664 9.315 20.25 12 20.25z" />
                    </svg>
                    Airdrop
                </AdvButton>}
            </InputGroup>
        </>
    );
}

export default Balance;