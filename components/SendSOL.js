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

import React, { useContext, useState } from 'react';4
import { Keypair, LAMPORTS_PER_SOL, Transaction, sendAndConfirmTransaction, SystemProgram, PublicKey } from "@solana/web3.js";
import { Form, InputGroup, Card } from 'react-bootstrap';
import AdvButton from './AdvButton';
import { ConnectionContext } from './ConnectionContextProvider';
import ToolsCard from './ToolsCard';
import * as bs58 from 'bs58';

export const SendSOL = ({secretKey, onChanged = () => {}}) => {
    const [sendSolAmount, setSendSolAmount] = useState(1);
    const [sendSolAddress, setSendSolAddress] = useState('');

    const clusterConn = useContext(ConnectionContext);

    const handleSendSolAmountChange = (e) => setSendSolAmount(e.target.value);
    const handleSendSolAddressChange = (e) => setSendSolAddress(e.target.value);

    const sendSol = async () => {
        const kPair = Keypair.fromSecretKey(bs58.decode(secretKey));
        let transaction = new Transaction();
        transaction.add(
            SystemProgram.transfer({
                fromPubkey: kPair.publicKey,
                toPubkey: new PublicKey(sendSolAddress),
                lamports: LAMPORTS_PER_SOL * sendSolAmount,
            }),
        );

        let connection = clusterConn.connection;

        //console.log('sending on cluster', clusterConn.cluster, connection);

        return sendAndConfirmTransaction(connection, transaction, [kPair])
            .then((res) => {
                console.log('result: ', res);
                onChanged();
                // setCount(count + 1);
            });
    }

    return (
        <ToolsCard title='' description={<>Transfer SOL to another account</>}>
            <Card.Header>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width={18} height={18} className="me-2 mb-1">
                    <path d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z" />
                </svg>
                Send SOL
            </Card.Header>
            <Card.Body>
                {secretKey ? (
                    <>
                        <InputGroup>
                            <InputGroup.Text>Send</InputGroup.Text>
                            <Form.Control type="number" onChange={handleSendSolAmountChange} value={sendSolAmount} />
                            <InputGroup.Text>SOL to</InputGroup.Text>
                            <Form.Control onChange={handleSendSolAddressChange} value={sendSolAddress} />
                            <AdvButton onClick={sendSol}>SEND</AdvButton>
                        </InputGroup>
                    </>
                )
                    : <div style={{ textAlign: 'center' }} className='text-muted'>No Wallet</div>
                }
            </Card.Body>
        </ToolsCard>
    );
};